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

export function readAtlasMemory(root = process.cwd()): {
  runs: AtlasRunSummary[];
  candidates: CandidateState[];
  japan: JapanProductState[];
} {
  const memory = path.join(root, "atlas-memory");
  const runsDir = path.join(memory, "runs");
  const runs: AtlasRunSummary[] = [];
  if (existsSync(runsDir)) {
    const names = readdirSync(runsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
      .reverse()
      .slice(0, 30);
    for (const name of names) {
      const parsed = parseRunRecord(readJson(path.join(runsDir, name, "run.json")));
      if (parsed) runs.push(parsed);
    }
  }
  return {
    runs,
    candidates: parseCandidateHistory(readJson(path.join(memory, "candidate-history.json"))),
    japan: parseJapanBatch(readJson(path.join(memory, "japan", "batch.json"))),
  };
}
