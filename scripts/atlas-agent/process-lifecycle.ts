import { spawn, spawnSync, type ChildProcess } from "node:child_process";

/** After timeout/exit, never wait longer than this for stdio/close. */
export const CLEANUP_DEADLINE_MS = 5_000;

/** After the child logs BUILDER_TIMEOUT, the parent must not wait indefinitely. */
export const POST_TIMEOUT_PARENT_DEADLINE_MS = 15_000;

const TASKKILL_TIMEOUT_MS = 8_000;

export type ManagedChildIo = {
  now: () => number;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (id: unknown) => void;
  stopTree: (child: ChildProcess) => void;
  destroyStdio: (child: ChildProcess) => void;
  isPidAlive: (pid: number) => boolean;
};

const defaultIo: ManagedChildIo = {
  now: () => performance.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
  stopTree: stopProcessTree,
  destroyStdio,
  isPidAlive,
};

export function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

export function destroyStdio(child: ChildProcess): void {
  for (const stream of [child.stdin, child.stdout, child.stderr]) {
    if (!stream) continue;
    stream.removeAllListeners();
    if ("destroyed" in stream && stream.destroyed) continue;
    try {
      stream.destroy();
    } catch {
      // Already closed.
    }
  }
}

/** Stops the Agent process and every child it started, including Windows PowerShell wrappers. */
export function stopProcessTree(child: ChildProcess): void {
  const pid = child.pid;
  if (pid && process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      timeout: TASKKILL_TIMEOUT_MS,
    });
    if (isPidAlive(pid)) {
      try {
        child.kill("SIGKILL");
      } catch {
        // Already gone.
      }
    }
    destroyStdio(child);
    return;
  }
  if (pid && process.platform !== "win32") {
    try {
      process.kill(-pid, "SIGKILL");
      destroyStdio(child);
      return;
    } catch {
      // The process may already have exited, or it may not lead a group.
    }
  }
  try {
    child.kill("SIGKILL");
  } catch {
    // Already gone.
  }
  destroyStdio(child);
}

export function looksLikeBuilderTimeoutLog(line: string): boolean {
  return /BUILDER_TIMEOUT/.test(line) && !/RESEARCH_AGENT_TIMEOUT|SPEC_AGENT_TIMEOUT|SCORING_AGENT_TIMEOUT/.test(line);
}

/**
 * Resolves when the child exits/closes, or when a bounded cleanup deadline
 * proves stdio/close will never arrive. Never waits indefinitely.
 */
export function waitForManagedChild(
  child: ChildProcess,
  options: {
    cleanupMs?: number;
    postTimeoutMs?: number;
    watchTimeoutToken?: boolean;
    io?: Partial<ManagedChildIo>;
  } = {},
): Promise<number> {
  const io = { ...defaultIo, ...options.io };
  const cleanupMs = options.cleanupMs ?? CLEANUP_DEADLINE_MS;
  const postTimeoutMs = options.postTimeoutMs ?? POST_TIMEOUT_PARENT_DEADLINE_MS;
  return new Promise((resolve) => {
    let settled = false;
    let exitCode = 1;
    let cleanupTimer: unknown;
    let postTimeoutTimer: unknown;
    const settle = (code: number) => {
      if (settled) return;
      settled = true;
      io.clearTimer(cleanupTimer);
      io.clearTimer(postTimeoutTimer);
      child.removeListener("exit", onExit);
      child.removeListener("close", onClose);
      child.removeListener("error", onError);
      io.destroyStdio(child);
      try {
        child.unref?.();
      } catch {
        // Not all test doubles implement unref.
      }
      resolve(code);
    };
    const forceAfterExit = () => {
      if (settled) return;
      if (child.pid && io.isPidAlive(child.pid)) io.stopTree(child);
      settle(exitCode);
    };
    const onExit = (code: number | null) => {
      exitCode = code ?? 1;
      io.clearTimer(cleanupTimer);
      cleanupTimer = io.setTimer(forceAfterExit, cleanupMs);
    };
    const onClose = (code: number | null) => {
      settle(code ?? exitCode);
    };
    const onError = () => settle(1);
    child.on("exit", onExit);
    child.on("close", onClose);
    child.on("error", onError);
    if (options.watchTimeoutToken) {
      const watch = (chunk: Buffer) => {
        if (settled || postTimeoutTimer) return;
        if (!looksLikeBuilderTimeoutLog(chunk.toString())) return;
        postTimeoutTimer = io.setTimer(() => {
          io.stopTree(child);
          settle(1);
        }, postTimeoutMs);
      };
      child.stdout?.on("data", watch);
      child.stderr?.on("data", watch);
    }
  });
}

export function runManagedShell(
  command: string,
  env: NodeJS.ProcessEnv,
  options: {
    stdio?: ("inherit" | "pipe")[];
    onLine?: (line: string, dest: "stdout" | "stderr") => void;
    cleanupMs?: number;
    postTimeoutMs?: number;
  } = {},
): Promise<number> {
  const child = spawn(command, {
    cwd: process.cwd(),
    shell: true,
    stdio: options.stdio ?? ["inherit", "pipe", "pipe"],
    env,
    windowsHide: true,
  });
  const forward = (stream: NodeJS.ReadableStream | null, dest: "stdout" | "stderr") => {
    if (!stream || !options.onLine) return;
    let leftover = "";
    stream.on("data", (chunk: Buffer) => {
      const parts = (leftover + chunk.toString()).split(/\r?\n/);
      leftover = parts.pop() ?? "";
      for (const line of parts) options.onLine?.(line, dest);
    });
    stream.on("end", () => {
      if (leftover) options.onLine?.(leftover, dest);
    });
  };
  if (options.onLine) {
    forward(child.stdout, "stdout");
    forward(child.stderr, "stderr");
  }
  return waitForManagedChild(child, {
    cleanupMs: options.cleanupMs,
    postTimeoutMs: options.postTimeoutMs,
    watchTimeoutToken: true,
  });
}
