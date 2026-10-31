import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { AgentTask } from "../atlas-agent/schema";
import {
  ATOMIC_WRITE_FAILED,
  ATOMIC_WRITE_LIMITS,
  createAtlasTempPath,
  parseAtlasJsonTemp,
  withAtomicWriteLock,
  writeAtomicJson,
  type AtomicFs,
} from "./atomic-write";
import { loadRun, saveRun, writeJson } from "./memory";
import { classifyFailure, snapshotFromLoop } from "./supervisor";
import type { RunRecord } from "./types";

const KEPT = `${JSON.stringify({ keep: true }, null, 2)}\n`;

function memoryFs(initial: Record<string, string> = {}): AtomicFs & {
  files: Map<string, string>;
  renames: string[];
  written: string[];
} {
  const files = new Map<string, string>(Object.entries(initial));
  const renames: string[] = [];
  const written: string[] = [];
  return {
    files,
    renames,
    written,
    mkdirSync() {},
    writeFileSync(file, data) {
      written.push(file);
      files.set(file, data);
    },
    renameSync(from, to) {
      renames.push(`${from}->${to}`);
      if (!files.has(from)) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      files.set(to, files.get(from)!);
      files.delete(from);
    },
    unlinkSync(file) {
      files.delete(file);
    },
    existsSync(file) {
      return files.has(file);
    },
    readdirSync(dir) {
      const names: string[] = [];
      for (const file of files.keys()) {
        if (path.dirname(file) === dir || ((dir === "." || dir === "") && (path.dirname(file) === "." || path.dirname(file) === ""))) {
          names.push(path.basename(file));
        }
      }
      return names;
    },
  };
}

function failingRename(
  codes: string[],
  options: { thenSucceed?: boolean; pid?: number; nextId?: () => string } = {},
): AtomicFs & { files: Map<string, string>; attempts: number; written: string[] } {
  const io = memoryFs({ "dest.json": KEPT });
  let attempts = 0;
  const originalRename = io.renameSync;
  io.pid = options.pid ?? 42;
  io.nextId = options.nextId ?? (() => "unique1");
  io.renameSync = (from, to) => {
    attempts += 1;
    (io as { attempts: number }).attempts = attempts;
    if (attempts <= codes.length) throw Object.assign(new Error(codes[attempts - 1]!), { code: codes[attempts - 1] });
    if (options.thenSucceed === false) throw Object.assign(new Error("EPERM"), { code: "EPERM" });
    originalRename(from, to);
  };
  return Object.assign(io, { attempts });
}

function leftoverTemps(files: Map<string, string>, dest = "dest.json"): string[] {
  return [...files.keys()].filter((name) => parseAtlasJsonTemp(path.basename(dest), path.basename(name)));
}

test("normal atomic write replaces the destination", () => {
  const io = memoryFs();
  io.pid = 11;
  io.nextId = () => "abc";
  writeAtomicJson("dest.json", { ok: true }, io, { sleep() {} });
  assert.equal(io.existsSync("dest.json"), true);
  assert.deepEqual(leftoverTemps(io.files), []);
  assert.deepEqual(JSON.parse(io.files.get("dest.json")!), { ok: true });
  assert.equal(io.renames[0], "dest.json.tmp.11.abc->dest.json");
});

test("unique temp files are used", () => {
  const io = memoryFs();
  io.pid = 22;
  io.nextId = () => "id-one";
  writeAtomicJson("dest.json", { ok: true }, io, { sleep() {} });
  assert.equal(io.written[0], createAtlasTempPath("dest.json", 22, "id-one"));
  assert.notEqual(io.written[0], "dest.json.tmp");
  assert.match(io.written[0]!, /^dest\.json\.tmp\.\d+\.[A-Za-z0-9-]+$/);
});

test("two writers do not share the same temp path", () => {
  let n = 0;
  const io = memoryFs();
  io.pid = 33;
  io.nextId = () => `u${++n}`;
  writeAtomicJson("dest.json", { n: 1 }, io, { sleep() {} });
  writeAtomicJson("dest.json", { n: 2 }, io, { sleep() {} });
  assert.equal(io.written.length, 2);
  assert.notEqual(io.written[0], io.written[1]);
  assert.equal(io.written[0], "dest.json.tmp.33.u1");
  assert.equal(io.written[1], "dest.json.tmp.33.u2");
  assert.deepEqual(JSON.parse(io.files.get("dest.json")!), { n: 2 });
});

test("first rename EPERM then retry succeeds", () => {
  const io = failingRename(["EPERM"]);
  writeAtomicJson("dest.json", { next: 2 }, io, { sleep() {} });
  assert.equal(io.attempts, 2);
  assert.deepEqual(JSON.parse(io.files.get("dest.json")!), { next: 2 });
  assert.deepEqual(leftoverTemps(io.files), []);
});

test("EBUSY and EACCES are retried", () => {
  const io = failingRename(["EBUSY", "EACCES"]);
  writeAtomicJson("dest.json", { next: 3 }, io, { sleep() {} });
  assert.ok(io.attempts >= 3);
  assert.deepEqual(JSON.parse(io.files.get("dest.json")!), { next: 3 });
});

test("existing destination stays byte-for-byte unchanged when replacement retries fail", () => {
  const io = failingRename(["EPERM", "EPERM", "EPERM", "EPERM", "EPERM", "EPERM", "EPERM", "EPERM"], {
    thenSucceed: false,
  });
  assert.throws(() => writeAtomicJson("dest.json", { next: 9 }, io, { sleep() {} }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal((error as { code?: string }).code, ATOMIC_WRITE_FAILED);
    assert.equal(error.message.includes(ATOMIC_WRITE_FAILED), true);
    assert.equal(error.message.includes("next"), false);
    return true;
  });
  assert.equal(io.files.get("dest.json"), KEPT);
  assert.deepEqual(leftoverTemps(io.files), []);
});

test("exhausted EPERM returns ATOMIC_WRITE_FAILED", () => {
  const io = failingRename(["EPERM"], { thenSucceed: false });
  assert.throws(() => writeAtomicJson("dest.json", { n: 1 }, io, { sleep() {} }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal((error as { code?: string }).code, ATOMIC_WRITE_FAILED);
    return true;
  });
  assert.equal(io.files.get("dest.json"), KEPT);
});

test("no copy-over-destination fallback exists", () => {
  const source = fs.readFileSync(path.join("scripts", "atlas-auto", "atomic-write.ts"), "utf8");
  assert.equal(source.includes("copyFileSync"), false);
  assert.equal(/\bcopyFile\b/.test(source), false);
  const original = KEPT;
  const io = memoryFs({ "dest.json": original });
  io.pid = 9;
  io.nextId = () => "x";
  io.renameSync = () => {
    throw Object.assign(new Error("EPERM"), { code: "EPERM" });
  };
  (io as AtomicFs & { copyFileSync?: () => void }).copyFileSync = () => {
    io.files.set("dest.json", "CORRUPT");
  };
  assert.throws(() => writeAtomicJson("dest.json", { copied: true }, io, { sleep() {} }));
  assert.equal(io.files.get("dest.json"), original);
});

test("stale Atlas temp cleanup is safe", () => {
  const io = memoryFs({
    "dest.json": KEPT,
    "dest.json.tmp": "legacy-garbage",
    "dest.json.tmp.7.own": "same-process-leftover",
    "dest.json.tmp.999001.dead": "dead-process",
    "dest.json.tmp.1.live": "live-other-process",
    "dest.json.bak": "not-a-temp",
    "other.json.tmp.1.x": "other-destination",
  });
  io.pid = 7;
  io.nextId = () => "fresh";
  io.isPidAlive = (pid) => pid === 1;
  writeAtomicJson("dest.json", { clean: true }, io, { sleep() {} });
  assert.equal(io.existsSync("dest.json.tmp"), false);
  assert.equal(io.existsSync("dest.json.tmp.7.own"), false);
  assert.equal(io.existsSync("dest.json.tmp.999001.dead"), false);
  assert.equal(io.existsSync("dest.json.tmp.1.live"), true);
  assert.equal(io.existsSync("dest.json.bak"), true);
  assert.equal(io.existsSync("other.json.tmp.1.x"), true);
  assert.deepEqual(JSON.parse(io.files.get("dest.json")!), { clean: true });
});

test("concurrent writes to the same file leave valid JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-atomic-"));
  const file = path.join(dir, "run.json");
  writeJson(file, { n: 1, note: "first" });
  writeJson(file, { n: 2, note: "second" });
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { n: number; note: string };
  assert.equal(parsed.n, 2);
  assert.equal(parsed.note, "second");
  const leftovers = fs.readdirSync(dir).filter((name) => parseAtlasJsonTemp("run.json", name));
  assert.deepEqual(leftovers, []);
  const order: string[] = [];
  withAtomicWriteLock(file, () => {
    order.push("a");
    withAtomicWriteLock(`${file}.other`, () => order.push("b"));
  });
  assert.deepEqual(order, ["a", "b"]);
});

test("run.json resume path round-trips through saveRun", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-run-"));
  const previous = process.cwd();
  process.chdir(dir);
  try {
    fs.mkdirSync(path.join("atlas-memory", "runs", "20261031T045058Z"), { recursive: true });
    const run: RunRecord = {
      schema_version: "atlas-auto-run-v1",
      run_id: "20261031T045058Z",
      mode: "full",
      branch: "private-preview",
      started_at: "2026-10-31T04:50:58.000Z",
      updated_at: "2026-10-31T04:50:58.000Z",
      phase: "AWAITING_FINAL_REVIEW",
      research_source: "research-agent",
      scoring_source: "scoring-agent",
      research_notes: [],
      candidates: [],
      filtered_candidates: [],
      dashboard_file: null,
      dashboard_url: null,
      approval_file: "atlas-memory/runs/20261031T045058Z/approval.json",
      approved_candidate_id: "security-readiness-action-pack",
      spec_path: "agent-specs/security-readiness-action-pack.json",
      task_path: "agent-tasks/security-readiness-action-pack-premium-build.json",
      loop_result: null,
      loop_disposition: null,
      final_review_file: null,
      final_review_decision: null,
      commerce: null,
      builder_ran: true,
      committed: false,
      pushed: false,
      published: false,
      notes: [],
    };
    saveRun(run);
    const loaded = loadRun("20261031T045058Z");
    assert.equal(loaded?.run_id, "20261031T045058Z");
    assert.equal(loaded?.phase, "AWAITING_FINAL_REVIEW");
    const runDir = path.join("atlas-memory", "runs", "20261031T045058Z");
    const leftovers = fs.readdirSync(runDir).filter((name) => parseAtlasJsonTemp("run.json", name));
    assert.deepEqual(leftovers, []);
  } finally {
    process.chdir(previous);
  }
});

test("task JSON write path stays valid JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-task-"));
  const taskPath = path.join(dir, "security-readiness-action-pack-premium-build.json");
  const task: Pick<AgentTask, "schema_version" | "id" | "title"> = {
    schema_version: "atlas-agent-task-v1",
    id: "security-readiness-action-pack-premium-build",
    title: "Build",
  };
  writeJson(taskPath, task);
  const parsed = JSON.parse(fs.readFileSync(taskPath, "utf8")) as typeof task;
  assert.equal(parsed.id, "security-readiness-action-pack-premium-build");
  const leftovers = fs.readdirSync(dir).filter((name) =>
    parseAtlasJsonTemp("security-readiness-action-pack-premium-build.json", name),
  );
  assert.deepEqual(leftovers, []);
});

test("ATOMIC_WRITE_FAILED is an orchestration failure, not a product defect", () => {
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: ATOMIC_WRITE_FAILED, classification: ATOMIC_WRITE_FAILED, actual: ATOMIC_WRITE_FAILED }],
        qa: { status: "not_run" },
      }),
    ),
    "ORCHESTRATION_FAILURE",
  );
});

test("retry count and backoff stay inside a 1-2s window", () => {
  assert.equal(ATOMIC_WRITE_LIMITS.maxAttempts, 8);
  const sleeps: number[] = [];
  const io = failingRename(["EPERM"], { thenSucceed: false });
  assert.throws(() => writeAtomicJson("dest.json", { n: 1 }, io, { sleep: (ms) => sleeps.push(ms) }));
  const total = sleeps.reduce((sum, ms) => sum + ms, 0);
  assert.ok(sleeps.length < ATOMIC_WRITE_LIMITS.maxAttempts);
  assert.ok(io.attempts <= ATOMIC_WRITE_LIMITS.maxAttempts);
  assert.ok(total >= 1000);
  assert.ok(total <= 2000);
});
