import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  CLEANUP_DEADLINE_MS,
  destroyStdio,
  isPidAlive,
  stopProcessTree,
} from "./process-lifecycle";

export { CLEANUP_DEADLINE_MS, destroyStdio, isPidAlive, stopProcessTree } from "./process-lifecycle";

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

export const AGENT_TIMEOUT_CODES = {
  builder: "BUILDER_TIMEOUT",
  evaluator: "EVALUATOR_TIMEOUT",
  research: "RESEARCH_AGENT_TIMEOUT",
  scoring: "SCORING_AGENT_TIMEOUT",
  spec: "SPEC_AGENT_TIMEOUT",
} as const;

export type AgentTimeoutCode = (typeof AGENT_TIMEOUT_CODES)[CursorAgentRole];

export class AgentTimeoutError extends Error {
  readonly code: AgentTimeoutCode;
  readonly role: CursorAgentRole;
  readonly timeoutMs: number;

  constructor(role: CursorAgentRole, timeoutMs: number) {
    const code = AGENT_TIMEOUT_CODES[role];
    const minutes = Math.round(timeoutMs / 60000);
    super(
      role === "builder"
        ? `${code}. The Builder exceeded ${minutes} minutes and its process tree was stopped. Partial product changes were kept. The loop will not start another Builder attempt.`
        : `${code}. The ${roleLabel(role)} exceeded ${minutes} minutes and its process tree was stopped. No product files were kept from this session.`,
    );
    this.name = "AgentTimeoutError";
    this.code = code;
    this.role = role;
    this.timeoutMs = timeoutMs;
  }
}

export class BuilderTimeoutError extends AgentTimeoutError {
  override readonly code = "BUILDER_TIMEOUT";

  constructor(timeoutMs: number) {
    super("builder", timeoutMs);
    this.name = "BuilderTimeoutError";
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

export type AgentRunIo = {
  spawn: typeof spawn;
  stopTree: (child: ChildProcess) => void;
  now: () => number;
  wallNow: () => number;
  interval: (fn: () => void, ms: number) => ReturnType<typeof setInterval>;
  clearInterval: (id: ReturnType<typeof setInterval>) => void;
  isPidAlive: (pid: number) => boolean;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
  destroyStdio: (child: ChildProcess) => void;
};

const defaultIo: AgentRunIo = {
  spawn,
  stopTree: stopProcessTree,
  now: () => performance.now(),
  wallNow: () => Date.now(),
  interval: (fn, ms) => setInterval(fn, ms),
  clearInterval: (id) => clearInterval(id),
  isPidAlive,
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  destroyStdio,
};

export function runCursorAgent(
  launch: CursorLaunch,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
  options: { echo?: boolean; role?: CursorAgentRole; io?: Partial<AgentRunIo> } = {},
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const echo = options.echo ?? true;
  const role = options.role ?? "builder";
  const io = { ...defaultIo, ...options.io };
  return new Promise((resolve, reject) => {
    const child = io.spawn(launch.command, launch.args, {
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
    let cleanupTimer: unknown;
    const startedMono = io.now();
    const startedWall = io.wallNow();
    const settle = (finish: () => void) => {
      if (settled) return;
      settled = true;
      io.clearInterval(watchdog);
      io.clearTimer(cleanupTimer);
      io.destroyStdio(child);
      try {
        child.unref?.();
      } catch {
        // Test doubles may omit unref.
      }
      finish();
    };
    const expire = () => {
      if (settled) return;
      io.stopTree(child);
      io.destroyStdio(child);
      if (child.pid && io.isPidAlive(child.pid)) io.stopTree(child);
      const finishTimeout = () => settle(() => reject(timeoutErrorForRole(role, timeoutMs)));
      // Return the timeout result even if close/stdio never arrive.
      cleanupTimer = io.setTimer(finishTimeout, CLEANUP_DEADLINE_MS);
      finishTimeout();
    };
    const watchdog = io.interval(() => {
      if (settled) return;
      const mono = io.now() - startedMono;
      const wall = io.wallNow() - startedWall;
      if (mono >= timeoutMs || wall >= timeoutMs) expire();
    }, 1000);
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
    child.on("exit", () => {
      // Exit without close still completes; timeout path already settled.
    });
    child.on("close", (status) => {
      settle(() => resolve({ status, stdout, stderr }));
    });
  });
}

export function timeoutErrorForRole(role: CursorAgentRole, timeoutMs: number): AgentTimeoutError {
  return role === "builder" ? new BuilderTimeoutError(timeoutMs) : new AgentTimeoutError(role, timeoutMs);
}

export function elapsedDisplay(elapsedMs: number): string {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function roleLabel(role: CursorAgentRole): string {
  return role === "spec" ? "Spec Agent" : role === "research" ? "Research Agent" : role === "scoring" ? "Scoring Agent" : role;
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
