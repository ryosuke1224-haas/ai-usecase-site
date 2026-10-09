import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** Every role except the Builder runs in read-only ask mode. */
export type CursorAgentRole = "builder" | "evaluator" | "research" | "scoring" | "spec";

export type CursorLaunch = {
  command: string;
  args: string[];
  shell: boolean;
  display: string;
};

const FORBIDDEN_FLAGS = ["--continue", "--resume"];

/** Default Builder limit. Override with ATLAS_BUILDER_TIMEOUT_MS for a local experiment. */
export const DEFAULT_BUILDER_TIMEOUT_MS = 15 * 60 * 1000;

export class BuilderTimeoutError extends Error {
  readonly code = "BUILDER_TIMEOUT";
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(
      `BUILDER_TIMEOUT. The Builder exceeded ${Math.round(timeoutMs / 60000)} minutes and its process tree was stopped. Partial product changes were kept. The loop will not start another Builder attempt.`,
    );
    this.name = "BuilderTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function builderTimeoutMs(): number {
  const raw = process.env.ATLAS_BUILDER_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_BUILDER_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1000) return DEFAULT_BUILDER_TIMEOUT_MS;
  return parsed;
}

export function agentCliExists(): boolean {
  return findOnPath("agent") !== null;
}

export function cursorAgentLaunch(assignment: string, role: CursorAgentRole): CursorLaunch {
  const entry = findOnPath("agent");
  if (!entry) {
    throw new Error("Cursor Agent CLI `agent` is not on PATH.");
  }
  const agentArgs =
    role === "builder"
      ? ["-p", "--force", "--trust", "--output-format", "text", "--workspace", process.cwd(), assignment]
      : [
          "-p",
          "--mode",
          "ask",
          "--trust",
          "--output-format",
          "text",
          "--workspace",
          process.cwd(),
          assignment,
        ];
  if (agentArgs.some((arg) => FORBIDDEN_FLAGS.includes(arg))) {
    throw new Error("Cursor Agent invocations must not resume a previous chat.");
  }
  const script = powershellEntry(entry);
  if (script) {
    const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...agentArgs];
    return {
      command: "powershell.exe",
      args,
      shell: false,
      display: formatCommand("powershell.exe", args),
    };
  }
  return {
    command: entry,
    args: agentArgs,
    shell: false,
    display: formatCommand(entry, agentArgs),
  };
}

export function runCursorAgent(
  launch: CursorLaunch,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
  options: { echo?: boolean } = {},
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const echo = options.echo ?? true;
  return new Promise((resolve, reject) => {
    const child = spawn(launch.command, launch.args, {
      cwd: process.cwd(),
      env,
      shell: launch.shell,
      windowsHide: true,
      // A new process group lets a Unix timeout kill the Agent and its children.
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = (finish: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      finish();
    };
    timer = setTimeout(() => {
      stopProcessTree(child);
      settle(() => reject(new BuilderTimeoutError(timeoutMs)));
    }, timeoutMs);
    const push = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString();
      if (target === "stdout") stdout = (stdout + text).slice(-200_000);
      else stderr = (stderr + text).slice(-100_000);
      if (echo) process.stdout.write(text);
    };
    child.stdout?.on("data", (chunk: Buffer) => push("stdout", chunk));
    child.stderr?.on("data", (chunk: Buffer) => push("stderr", chunk));
    child.on("error", (error) => {
      settle(() => reject(error));
    });
    child.on("close", (status) => {
      settle(() => resolve({ status, stdout, stderr }));
    });
  });
}

/** Stops the Agent process and every child it started. Does not delete files. */
function stopProcessTree(child: ChildProcess): void {
  const pid = child.pid;
  if (pid && process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true });
    return;
  }
  if (pid && process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGKILL");
      return;
    } catch {
      // The process may already have exited, or it may not lead a group.
    }
  }
  child.kill("SIGKILL");
}

function powershellEntry(entry: string): string | null {
  if (entry.toLowerCase().endsWith(".ps1")) return entry;
  const dir = path.dirname(entry);
  for (const name of ["cursor-agent.ps1", "agent.ps1"]) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args]
    .map((arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg))
    .join(" ");
}

function findOnPath(name: string): string | null {
  const finder = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(finder, [name], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const found = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && fs.existsSync(line));
  return found ?? null;
}
