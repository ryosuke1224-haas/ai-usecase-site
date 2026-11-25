import { randomUUID } from "node:crypto";
import { listWeeklyStateKeys, readWeeklyState } from "./files";
import { baseWeekKey, createRun, nextRerunWeekKey, weekKey } from "./pipeline";
import type { WeeklyState } from "./types";

export type ResolveWeeklyRunInput = {
  root: string;
  now: Date;
  rerun: boolean;
  dryRun?: boolean;
  edition?: string;
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
  const base = weekKey(input.now) + (input.dryRun ? "-dry" : "");
  const runId = input.runId ?? `weekly-${randomUUID()}`;
  if (input.edition !== undefined) {
    const edition = input.edition;
    const match = /^(\d{4}-W\d{2}(?:-dry)?)(?:-r\d+)?$/.exec(edition);
    if (input.rerun || !match || match[1].endsWith("-dry") !== Boolean(input.dryRun)) {
      throw new Error("--edition must select an existing edition in the current mode and cannot be combined with --rerun.");
    }
    const existing = readWeeklyState(input.root, edition);
    if (existing?.writerVersion !== 1) throw new Error("No external-writer state exists for this edition.");
    return {
      state: existing,
      baseWeekKey: baseWeekKey(edition),
      rerun: false,
      reusedCompleted: existing.status === "succeeded" && existing.stage === "DONE",
    };
  }
  if (input.rerun) {
    const keys = listWeeklyStateKeys(input.root);
    const edition = nextRerunWeekKey([base, ...keys], base);
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
    state: existing?.writerVersion === 1 ? existing : fresh,
    baseWeekKey: base,
    rerun: false,
    reusedCompleted: false,
  };
}
