import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { createRun, nextRerunWeekKey, weekKey } from "./pipeline";
import { resolveWeeklyRun } from "./resolve-run";

function testRoot(t: TestContext): string {
  const parent = path.resolve("test-results");
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, "weekly-resolve-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

const NOW = new Date("2026-11-17T12:00:00.000Z");

test("a completed week is reused without --rerun", (t) => {
  const root = testRoot(t);
  const dir = path.join(root, "atlas-memory", "weekly");
  mkdirSync(dir, { recursive: true });
  const base = weekKey(NOW);
  const completed = createRun(NOW, "weekly-original", base);
  completed.status = "succeeded";
  completed.stage = "DONE";
  completed.counts.queued = 5;
  writeFileSync(path.join(dir, `${base}.json`), `${JSON.stringify(completed)}\n`);

  const resolved = resolveWeeklyRun({ root, now: NOW, rerun: false, runId: "weekly-next" });
  assert.equal(resolved.reusedCompleted, true);
  assert.equal(resolved.rerun, false);
  assert.equal(resolved.state.runId, "weekly-original");
  assert.equal(resolved.state.counts.queued, 5);
  assert.equal(resolved.state.stage, "DONE");
});

test("explicit --rerun starts a fresh edition without overwriting the original week key", (t) => {
  const root = testRoot(t);
  const dir = path.join(root, "atlas-memory", "weekly");
  mkdirSync(dir, { recursive: true });
  const base = weekKey(NOW);
  const completed = createRun(NOW, "weekly-original", base);
  completed.status = "succeeded";
  completed.stage = "DONE";
  completed.counts.queued = 5;
  writeFileSync(path.join(dir, `${base}.json`), `${JSON.stringify(completed)}\n`);

  assert.equal(nextRerunWeekKey([base], base), `${base}-r2`);
  const resolved = resolveWeeklyRun({ root, now: NOW, rerun: true, runId: "weekly-rerun" });
  assert.equal(resolved.reusedCompleted, false);
  assert.equal(resolved.rerun, true);
  assert.equal(resolved.baseWeekKey, base);
  assert.equal(resolved.state.weekKey, `${base}-r2`);
  assert.equal(resolved.state.runId, "weekly-rerun");
  assert.equal(resolved.state.stage, "RESEARCH");
  assert.equal(resolved.state.status, "running");
  assert.equal(resolved.state.counts.queued, 0);
  assert.deepEqual(resolved.state.completed, []);
});

test("an explicit dry-run rerun can be resumed without selecting a live edition", (t) => {
  const root = testRoot(t);
  const options = { root, now: NOW, dryRun: true, rerun: false };
  const { state } = resolveWeeklyRun({ ...options, rerun: true });
  const dir = path.join(root, "atlas-memory", "weekly");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${state.weekKey}.json`), JSON.stringify(state));

  assert.match(state.weekKey, /-dry-r2$/);
  assert.equal(resolveWeeklyRun({ ...options, edition: state.weekKey }).state.runId, state.runId);
  assert.throws(() => resolveWeeklyRun({ ...options, edition: state.weekKey, dryRun: false }), /current mode/);
});

test("default execution still resumes an unfinished week", (t) => {
  const root = testRoot(t);
  const dir = path.join(root, "atlas-memory", "weekly");
  mkdirSync(dir, { recursive: true });
  const base = weekKey(NOW);
  const running = createRun(NOW, "weekly-running", base);
  running.completed = ["RESEARCH"];
  running.stage = "SELECT";
  writeFileSync(path.join(dir, `${base}.json`), `${JSON.stringify(running)}\n`);

  const resolved = resolveWeeklyRun({ root, now: NOW, rerun: false, runId: "weekly-ignored" });
  assert.equal(resolved.reusedCompleted, false);
  assert.equal(resolved.state.runId, "weekly-running");
  assert.equal(resolved.state.stage, "SELECT");
});
