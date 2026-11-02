import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChildProcess } from "node:child_process";
import {
  AgentTimeoutError,
  BuilderTimeoutError,
  elapsedDisplay,
  runCursorAgent,
  timeoutErrorForRole,
  type AgentRunIo,
} from "./cursor-cli";

function fakeChild(pid = 4242): ChildProcess & { listeners: Record<string, ((...args: unknown[]) => void)[]> } {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = { data: [], error: [], close: [] };
  return {
    pid,
    listeners,
    stdout: { on: (_event: string, fn: (...args: unknown[]) => void) => listeners.data.push(fn) },
    stderr: { on: () => {} },
    on(event: string, fn: (...args: unknown[]) => void) {
      listeners[event] = listeners[event] ?? [];
      listeners[event]!.push(fn);
      return this;
    },
    kill() {},
  } as unknown as ChildProcess & { listeners: Record<string, ((...args: unknown[]) => void)[]> };
}

function fakeIo(state: {
  mono: number;
  wall: number;
  stopped: number;
  alive: boolean;
  destroyed?: boolean;
  watchdog?: () => void;
  cleanup?: () => void;
}): AgentRunIo {
  return {
    spawn: () => fakeChild(),
    stopTree: () => {
      state.stopped += 1;
      state.alive = false;
    },
    now: () => state.mono,
    wallNow: () => state.wall,
    interval: (fn) => {
      state.watchdog = fn;
      return 1 as unknown as ReturnType<typeof setInterval>;
    },
    clearInterval: () => {
      state.watchdog = undefined;
    },
    isPidAlive: () => state.alive,
    setTimer: (fn) => {
      state.cleanup = fn;
      return 2;
    },
    clearTimer: () => {
      state.cleanup = undefined;
    },
    destroyStdio: () => {
      state.destroyed = true;
    },
  };
}

test("elapsed display is monotonic and does not jump to 306 minutes", () => {
  assert.equal(elapsedDisplay(11 * 60_000 + 35_000), "11m 35s");
  assert.notEqual(elapsedDisplay(11 * 60_000 + 35_000), "306m 26s");
  const wallJump = 306 * 60_000 + 26_000;
  assert.equal(elapsedDisplay(11 * 60_000 + 35_000), "11m 35s");
  assert.equal(elapsedDisplay(wallJump) !== elapsedDisplay(11 * 60_000 + 35_000), true);
});

test("Research timeout is RESEARCH_AGENT_TIMEOUT, not BUILDER_TIMEOUT", () => {
  const error = timeoutErrorForRole("research", 15 * 60_000);
  assert.equal(error instanceof AgentTimeoutError, true);
  assert.equal(error instanceof BuilderTimeoutError, false);
  assert.equal(error.code, "RESEARCH_AGENT_TIMEOUT");
  assert.equal(error.message.includes("BUILDER_TIMEOUT"), false);
  assert.equal(error.message.includes("Research Agent"), true);
});

test("Spec timeout is SPEC_AGENT_TIMEOUT, not BUILDER_TIMEOUT", () => {
  const error = timeoutErrorForRole("spec", 15 * 60_000);
  assert.equal(error.code, "SPEC_AGENT_TIMEOUT");
  assert.equal(error.message.includes("BUILDER_TIMEOUT"), false);
});

test("Builder timeout remains BUILDER_TIMEOUT", () => {
  const error = timeoutErrorForRole("builder", 15 * 60_000);
  assert.equal(error instanceof BuilderTimeoutError, true);
  assert.equal(error.code, "BUILDER_TIMEOUT");
});

test("timeout watchdog kills the process tree and does not leave an orphan", async () => {
  const state = {
    mono: 0,
    wall: 0,
    stopped: 0,
    alive: true,
    destroyed: false,
    watchdog: undefined as undefined | (() => void),
  };
  const pending = runCursorAgent(
    { command: "agent", args: [], shell: false, display: "agent" },
    process.env,
    5_000,
    { echo: false, role: "research", io: fakeIo(state) },
  );
  assert.equal(state.stopped, 0);
  state.wall = 5_000;
  state.watchdog?.();
  await assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof AgentTimeoutError);
    assert.equal(error.code, "RESEARCH_AGENT_TIMEOUT");
    return true;
  });
  assert.ok(state.stopped >= 1);
  assert.equal(state.alive, false);
  assert.equal(state.destroyed, true);
});

test("timeout path returns without waiting for a missing close event", async () => {
  const state = {
    mono: 0,
    wall: 0,
    stopped: 0,
    alive: true,
    destroyed: false,
    watchdog: undefined as undefined | (() => void),
  };
  const started = Date.now();
  const pending = runCursorAgent(
    { command: "agent", args: [], shell: false, display: "agent" },
    process.env,
    1_000,
    { echo: false, role: "builder", io: fakeIo(state) },
  );
  state.wall = 1_000;
  state.watchdog?.();
  await assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof BuilderTimeoutError);
    return true;
  });
  assert.ok(Date.now() - started < 1_000);
  assert.equal(state.destroyed, true);
});

test("a wall-clock sleep jump still expires the watchdog at the configured limit", async () => {
  const state = { mono: 11 * 60_000, wall: 11 * 60_000, stopped: 0, alive: true, watchdog: undefined as undefined | (() => void) };
  const pending = runCursorAgent(
    { command: "agent", args: [], shell: false, display: "agent" },
    process.env,
    15 * 60_000,
    { echo: false, role: "spec", io: fakeIo(state) },
  );
  state.wall = 306 * 60_000;
  state.watchdog?.();
  await assert.rejects(pending, (error: unknown) => {
    assert.ok(error instanceof AgentTimeoutError);
    assert.equal(error.code, "SPEC_AGENT_TIMEOUT");
    return true;
  });
  assert.ok(state.stopped >= 1);
  assert.equal(state.alive, false);
});
