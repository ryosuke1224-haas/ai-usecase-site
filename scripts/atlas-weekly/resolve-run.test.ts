import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { createRun, nextRerunWeekKey, weekKey } from "./pipeline";
import { resolveWeeklyRun } from "./resolve-run";

const NOW = new Date("2026-11-17T12:00:00.000Z");

test("a completed week is reused without --rerun", () => {
  const root = mkdtempSync(path.join(tmpdir(), "atlas-weekly-"));
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

test("explicit --rerun starts a fresh edition without overwriting the original week key", () => {
  const root = mkdtempSync(path.join(tmpdir(), "atlas-weekly-"));
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

test("default execution still resumes an unfinished week", () => {
  const root = mkdtempSync(path.join(tmpdir(), "atlas-weekly-"));
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
