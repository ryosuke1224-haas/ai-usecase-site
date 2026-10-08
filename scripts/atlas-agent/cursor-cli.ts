import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type CursorAgentRole = "builder" | "evaluator";

export type CursorLaunch = {
  command: string;
  args: string[];
  shell: boolean;
  display: string;
};

const FORBIDDEN_FLAGS = ["--continue", "--resume"];

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
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(launch.command, launch.args, {
      cwd: process.cwd(),
      env,
      shell: launch.shell,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Cursor Agent CLI timed out after ${Math.round(timeoutMs / 60000)} minutes.`));
    }, timeoutMs);
    const push = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString();
      if (target === "stdout") stdout = (stdout + text).slice(-200_000);
      else stderr = (stderr + text).slice(-100_000);
      process.stdout.write(text);
    };
    child.stdout?.on("data", (chunk: Buffer) => push("stdout", chunk));
    child.stderr?.on("data", (chunk: Buffer) => push("stderr", chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
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
