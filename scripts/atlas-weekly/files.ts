import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { WeeklyState } from "./types";

export function weeklyDir(root: string): string {
  return path.join(root, "atlas-memory", "weekly");
}

export function statePath(root: string, weekKey: string): string {
  return path.join(weeklyDir(root), `${weekKey}.json`);
}

export function listWeeklyStateKeys(root: string): string[] {
  try {
    return readdirSync(weeklyDir(root))
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length));
  } catch {
    return [];
  }
}

export function readWeeklyState(root: string, weekKey: string): WeeklyState | null {
  try {
    const parsed = JSON.parse(readFileSync(statePath(root, weekKey), "utf8")) as WeeklyState;
    if (!parsed || parsed.weekKey !== weekKey || typeof parsed.runId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeWeeklyState(root: string, state: WeeklyState, dryRun = false): void {
  const dir = weeklyDir(root);
  mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(root, state.weekKey), `${JSON.stringify(state)}\n`);
  const runDir = path.join(dir, "runs", state.runId);
  mkdirSync(runDir, { recursive: true });
  const summary = {
    run_id: state.runId,
    phase: state.status === "succeeded" && state.stage === "DONE" ? "FINISHED" : state.stage,
    status: state.status === "failed" ? "FAILED" : state.status === "succeeded" ? "SUCCEEDED" : state.stage,
    mode: dryRun ? "dry-run" : "full",
    updated_at: state.updatedAt,
    started_at: state.startedAt,
    finished_at: state.finishedAt,
    counts: state.counts,
    errors: state.errors,
  };
  writeFileSync(path.join(runDir, "run.json"), `${JSON.stringify(summary)}\n`);
}
