import assert from "node:assert/strict";
import { test } from "node:test";
import type { ChildProcess } from "node:child_process";
import {
  CLEANUP_DEADLINE_MS,
  looksLikeBuilderTimeoutLog,
  waitForManagedChild,
  type ManagedChildIo,
} from "./process-lifecycle";

function fakeChild(pid = 9001): ChildProcess & {
  emitEvent: (event: string, ...args: unknown[]) => void;
  pushStdout: (text: string) => void;
} {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {
    exit: [],
    close: [],
    error: [],
    data: [],
  };
  const stdout = {
    on(event: string, fn: (...args: unknown[]) => void) {
      if (event === "data") listeners.data.push(fn);
      return this;
    },
    removeAllListeners() {
      listeners.data = [];
    },
    destroy() {},
    destroyed: false,
  };
  return {
    pid,
    stdout,
    stderr: stdout,
    stdin: stdout,
    on(event: string, fn: (...args: unknown[]) => void) {
      listeners[event] = listeners[event] ?? [];
      listeners[event]!.push(fn);
      return this;
    },
    removeListener(event: string, fn: (...args: unknown[]) => void) {
      listeners[event] = (listeners[event] ?? []).filter((item) => item !== fn);
      return this;
    },
    unref() {},
    emitEvent(event: string, ...args: unknown[]) {
      for (const fn of listeners[event] ?? []) fn(...args);
    },
    pushStdout(text: string) {
      for (const fn of listeners.data) fn(Buffer.from(text));
    },
  } as unknown as ChildProcess & {
    emitEvent: (event: string, ...args: unknown[]) => void;
    pushStdout: (text: string) => void;
  };
}

function fakeIo(state: { stopped: number; destroyed: number; timers: Array<() => void> }): ManagedChildIo {
  return {
    now: () => 0,
    setTimer: (fn) => {
      state.timers.push(fn);
      return state.timers.length;
    },
    clearTimer: () => {},
    stopTree: () => {
      state.stopped += 1;
    },
    destroyStdio: () => {
      state.destroyed += 1;
    },
    isPidAlive: () => false,
  };
}

test("missing close event cannot hang the parent past the cleanup deadline", async () => {
  const child = fakeChild();
  const state = { stopped: 0, destroyed: 0, timers: [] as Array<() => void> };
  const pending = waitForManagedChild(child, { cleanupMs: CLEANUP_DEADLINE_MS, io: fakeIo(state) });
  let done = false;
  void pending.then(() => {
    done = true;
  });
  child.emitEvent("exit", 1);
  assert.equal(done, false);
  state.timers.at(-1)?.();
  assert.equal(await pending, 1);
  assert.equal(done, true);
  assert.ok(state.destroyed >= 1);
});

test("stdout/stderr handles cannot keep the run alive after BUILDER_TIMEOUT", async () => {
  const child = fakeChild();
  const state = { stopped: 0, destroyed: 0, timers: [] as Array<() => void> };
  const pending = waitForManagedChild(child, {
    cleanupMs: 5_000,
    postTimeoutMs: 15_000,
    watchTimeoutToken: true,
    io: fakeIo(state),
  });
  child.pushStdout("BUILDER_TIMEOUT. Partial product changes were kept.\n");
  assert.equal(state.timers.length, 1);
  state.timers[0]!();
  assert.equal(await pending, 1);
  assert.ok(state.stopped >= 1);
  assert.ok(state.destroyed >= 1);
});

test("close still returns the child exit code promptly", async () => {
  const child = fakeChild();
  const state = { stopped: 0, destroyed: 0, timers: [] as Array<() => void> };
  const pending = waitForManagedChild(child, { io: fakeIo(state) });
  child.emitEvent("close", 0);
  assert.equal(await pending, 0);
});

test("Builder timeout log is distinct from Research/Spec timeouts", () => {
  assert.equal(looksLikeBuilderTimeoutLog("BUILDER_TIMEOUT. The Builder exceeded 15 minutes"), true);
  assert.equal(looksLikeBuilderTimeoutLog("RESEARCH_AGENT_TIMEOUT. The Research Agent exceeded 15 minutes"), false);
  assert.equal(looksLikeBuilderTimeoutLog("SPEC_AGENT_TIMEOUT. The Spec Agent exceeded 20 minutes"), false);
});
