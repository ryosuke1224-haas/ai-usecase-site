import fs from "node:fs";
import path from "node:path";
import { isSameIdea } from "./scoring";
import {
  BLOCKING_STATUSES,
  type CandidateDecision,
  type CandidateHistory,
  type CandidateStatus,
  type HistoryEntry,
  type RunRecord,
  type ScoredCandidate,
  type SummaryScores,
} from "./types";

export const MEMORY_DIR = "atlas-memory";
export const HISTORY_PATH = `${MEMORY_DIR}/candidate-history.json`;
export const REFERENCE_DIR = `${MEMORY_DIR}/reference`;
export const RUNS_DIR = `${MEMORY_DIR}/runs`;
export const REPORTS_DIR = "agent-reports/atlas-auto";

export function runMemoryDir(runId: string): string {
  return `${RUNS_DIR}/${runId}`;
}

export function runReportDir(runId: string): string {
  return `${REPORTS_DIR}/${runId}`;
}

export function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temp, file);
}

export function loadHistory(): CandidateHistory {
  return (
    readJson<CandidateHistory>(HISTORY_PATH) ?? {
      schema_version: "atlas-candidate-history-v1",
      updated_at: new Date().toISOString(),
      candidates: [],
    }
  );
}

export function saveHistory(history: CandidateHistory): void {
  history.updated_at = new Date().toISOString();
  history.candidates.sort((a, b) => a.id.localeCompare(b.id));
  writeJson(HISTORY_PATH, history);
}

export function findHistory(
  history: CandidateHistory,
  candidate: { id: string; name: string },
): HistoryEntry | undefined {
  return (
    history.candidates.find((entry) => entry.id === candidate.id) ??
    history.candidates.find((entry) => isSameIdea(entry, candidate))
  );
}

export function blockingEntry(
  history: CandidateHistory,
  candidate: { id: string; name: string },
): HistoryEntry | undefined {
  const entry = findHistory(history, candidate);
  return entry && BLOCKING_STATUSES.includes(entry.status) ? entry : undefined;
}

/**
 * Record a status change. PROPOSED never overwrites a human decision, so a
 * candidate on HOLD stays on HOLD when research suggests it again.
 */
export function setStatus(
  history: CandidateHistory,
  input: {
    id: string;
    name: string;
    status: CandidateStatus;
    runId: string;
    note: string;
    scores?: SummaryScores;
  },
): HistoryEntry {
  const now = new Date().toISOString();
  let entry = history.candidates.find((item) => item.id === input.id);
  if (!entry) {
    entry = {
      id: input.id,
      name: input.name,
      status: input.status,
      first_seen_at: now,
      updated_at: now,
      runs: [],
      last_scores: null,
      events: [],
    };
    history.candidates.push(entry);
  } else if (input.status !== "PROPOSED" || entry.status === "PROPOSED") {
    entry.status = input.status;
  }
  entry.name = input.name;
  entry.updated_at = now;
  if (!entry.runs.includes(input.runId)) entry.runs.push(input.runId);
  if (input.scores) entry.last_scores = input.scores;
  entry.events.push({ at: now, run_id: input.runId, status: input.status, note: input.note });
  return entry;
}

export function recordProposals(
  history: CandidateHistory,
  runId: string,
  candidates: ScoredCandidate[],
): void {
  for (const candidate of candidates) {
    setStatus(history, {
      id: candidate.id,
      name: candidate.name,
      status: "PROPOSED",
      runId,
      note: `Proposed at rank ${candidate.rank} with overall ${candidate.summary_scores.overall}.`,
      scores: candidate.summary_scores,
    });
  }
  saveHistory(history);
}

export function saveRun(run: RunRecord): void {
  run.updated_at = new Date().toISOString();
  writeJson(`${runMemoryDir(run.run_id)}/run.json`, run);
}

export function loadRun(runId: string): RunRecord | null {
  return readJson<RunRecord>(`${runMemoryDir(runId)}/run.json`);
}

export function loadRunCandidates(runId: string): ScoredCandidate[] {
  return readJson<ScoredCandidate[]>(`${runMemoryDir(runId)}/candidates.json`) ?? [];
}

export function loadDecisions(runId: string): CandidateDecision[] {
  return readJson<CandidateDecision[]>(`${runMemoryDir(runId)}/decisions.json`) ?? [];
}

export function appendDecision(decision: CandidateDecision): void {
  const decisions = loadDecisions(decision.run_id);
  decisions.push(decision);
  writeJson(`${runMemoryDir(decision.run_id)}/decisions.json`, decisions);
}

/** Latest decision per candidate. */
export function latestDecisions(decisions: CandidateDecision[]): Map<string, CandidateDecision> {
  const latest = new Map<string, CandidateDecision>();
  for (const decision of decisions) latest.set(decision.candidate_id, decision);
  return latest;
}

/** Earlier runs, newest first, for research context. */
export function previousRuns(excludeRunId?: string): { run: RunRecord; candidates: ScoredCandidate[] }[] {
  if (!fs.existsSync(RUNS_DIR)) return [];
  return fs
    .readdirSync(RUNS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== excludeRunId)
    .map((entry) => entry.name)
    .sort()
    .reverse()
    .flatMap((runId) => {
      const run = loadRun(runId);
      return run ? [{ run, candidates: loadRunCandidates(runId) }] : [];
    });
}
