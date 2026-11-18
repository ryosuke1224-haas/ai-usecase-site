import { randomUUID } from "node:crypto";
import { listWeeklyStateKeys, readWeeklyState } from "./files";
import { baseWeekKey, createRun, nextRerunWeekKey, weekKey } from "./pipeline";
import type { WeeklyState } from "./types";

export type ResolveWeeklyRunInput = {
  root: string;
  now: Date;
  rerun: boolean;
  runId?: string;
};

export type ResolveWeeklyRunResult = {
  state: WeeklyState;
  baseWeekKey: string;
  rerun: boolean;
  reusedCompleted: boolean;
};

/**
 * Default weekly runs stay idempotent for a completed week.
 * --rerun starts a new edition key (2026-W47-r2) without touching the original state file.
 */
export function resolveWeeklyRun(input: ResolveWeeklyRunInput): ResolveWeeklyRunResult {
  const base = weekKey(input.now);
  const runId = input.runId ?? `weekly-${randomUUID()}`;
  if (input.rerun) {
    const keys = listWeeklyStateKeys(input.root);
    const edition = nextRerunWeekKey(keys.length > 0 ? keys : [base], base);
    return {
      state: createRun(input.now, runId, edition),
      baseWeekKey: base,
      rerun: true,
      reusedCompleted: false,
    };
  }
  const fresh = createRun(input.now, runId, base);
  const existing = readWeeklyState(input.root, fresh.weekKey);
  if (existing?.status === "succeeded" && existing.stage === "DONE") {
    return {
      state: existing,
      baseWeekKey: baseWeekKey(existing.weekKey),
      rerun: false,
      reusedCompleted: true,
    };
  }
  return {
    state: existing ?? fresh,
    baseWeekKey: base,
    rerun: false,
    reusedCompleted: false,
  };
}
