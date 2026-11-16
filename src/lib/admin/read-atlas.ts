import "server-only";

import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  parseCandidateHistory,
  parseJapanBatch,
  parseRunRecord,
  type AtlasRunSummary,
  type CandidateState,
  type JapanProductState,
} from "./atlas-state";

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    return null;
  }
}

function collectRuns(dir: string, into: AtlasRunSummary[]) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const parsed = parseRunRecord(readJson(path.join(/*turbopackIgnore: true*/ dir, entry.name, "run.json")));
    if (parsed && !into.some((run) => run.id === parsed.id)) into.push(parsed);
  }
}

export function readAtlasMemory(root = process.cwd()): {
  runs: AtlasRunSummary[];
  candidates: CandidateState[];
  japan: JapanProductState[];
} {
  const runs: AtlasRunSummary[] = [];
  collectRuns(path.join(/*turbopackIgnore: true*/ root, "atlas-memory", "runs"), runs);
  collectRuns(path.join(/*turbopackIgnore: true*/ root, "atlas-memory", "weekly", "runs"), runs);
  runs.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  return {
    runs: runs.slice(0, 30),
    candidates: parseCandidateHistory(readJson(path.join(/*turbopackIgnore: true*/ root, "atlas-memory", "candidate-history.json"))),
    japan: parseJapanBatch(readJson(path.join(/*turbopackIgnore: true*/ root, "atlas-memory", "japan", "batch.json"))),
  };
}
