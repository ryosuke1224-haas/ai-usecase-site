import { z } from "zod";

export const CRITERIA = [
  "smb_value",
  "willingness_to_pay",
  "frequency",
  "time_to_value",
  "setup_simplicity",
  "demonstrability",
  "ai_literacy_value",
  "differentiation",
  "automation_potential",
  "testability",
  "permission_simplicity",
  "smb_breadth",
  "workflow_quality",
] as const;

export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Record<Criterion, string> = {
  smb_value: "SMB value",
  willingness_to_pay: "Willingness to pay",
  frequency: "Frequency",
  time_to_value: "Time to value",
  setup_simplicity: "Setup simplicity",
  demonstrability: "Demonstrability",
  ai_literacy_value: "AI literacy value",
  differentiation: "Differentiation",
  automation_potential: "Automation potential",
  testability: "Testability",
  permission_simplicity: "Permission simplicity",
  smb_breadth: "SMB breadth",
  workflow_quality: "Workflow quality",
};

export const CANDIDATE_STATUSES = [
  "PROPOSED",
  "APPROVED",
  "HOLD",
  "REJECTED",
  "BUILT",
  "COMPLETED",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** Statuses that keep a candidate out of future research. HOLD may come back. */
export const BLOCKING_STATUSES: CandidateStatus[] = ["APPROVED", "REJECTED", "BUILT", "COMPLETED"];

const slug = z
  .string()
  .transform((value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, ""),
  )
  .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));

const upper = <T extends string>(values: readonly [T, ...T[]], fallback: T) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.enum(values).catch(fallback),
  );

const text = z.string().trim().min(1);
const list = z.array(text);

export const candidateSchema = z.object({
  id: slug,
  name: text,
  persona: text,
  problem: text,
  workflow: list.min(3),
  before: text,
  after: text,
  required_data_tools: list.min(1),
  why_pay: text,
  setup_difficulty: upper(["EASY", "MODERATE", "HARD"], "MODERATE"),
  automation_potential: upper(["LOW", "MEDIUM", "HIGH"], "MEDIUM"),
  human_oversight: upper(["LOW", "MEDIUM", "HIGH"], "HIGH"),
  major_risks: list.min(1),
  estimated_premium_value: text,
  sample_input: text,
  sample_output: text,
  guided_demo: text,
  related_catalog_slugs: z.array(z.string()).default([]),
  novelty_note: z.string().default(""),
});

export type Candidate = z.infer<typeof candidateSchema>;

export const researchOutputSchema = z.object({
  candidates: z.array(z.unknown()).min(1),
});

export const scoreSheetSchema = z.object({
  candidate_id: z.string().min(1),
  criteria: z.record(z.string(), z.number()),
  rationale: z.record(z.string(), z.string()).default({}),
  summary: z.string().default(""),
});

export type ScoreSheet = z.infer<typeof scoreSheetSchema>;

export const scoringOutputSchema = z.object({
  scores: z.array(scoreSheetSchema).min(1),
});

export type SummaryScores = {
  commercial: number;
  atlas_fit: number;
  buildability: number;
  overall: number;
};

export type ScoredCandidate = Candidate & {
  rank: number;
  scores: {
    criteria: Record<Criterion, number>;
    rationale: Partial<Record<Criterion, string>>;
    summary: string;
  };
  summary_scores: SummaryScores;
  history_status: CandidateStatus | null;
  source: "research-agent" | "reference-library";
};

export const CANDIDATE_DECISIONS = ["APPROVED", "HOLD", "REJECTED"] as const;
export type CandidateDecisionValue = (typeof CANDIDATE_DECISIONS)[number];

export type CandidateDecision = {
  schema_version: "atlas-auto-decision-v1";
  run_id: string;
  candidate_id: string;
  candidate_name: string;
  decision: CandidateDecisionValue;
  note: string;
  decided_at: string;
  source: "dashboard" | "file";
};

export const FINAL_DECISIONS = [
  "APPROVED_FOR_LATER_PUBLISHING",
  "CHANGES_REQUESTED",
  "REJECTED",
] as const;
export type FinalDecisionValue = (typeof FINAL_DECISIONS)[number];

export type FinalReviewDecision = {
  schema_version: "atlas-auto-final-review-v1";
  run_id: string;
  candidate_id: string;
  decision: FinalDecisionValue;
  note: string;
  decided_at: string;
  published: false;
  committed: false;
};

export type RunPhase =
  | "RESEARCH"
  | "AWAITING_APPROVAL"
  | "DRY_RUN_COMPLETE"
  | "STOPPED_WITHOUT_APPROVAL"
  | "SPEC"
  | "BUILD"
  | "AWAITING_FINAL_REVIEW"
  | "FINISHED"
  | "FAILED";

export type RunRecord = {
  schema_version: "atlas-auto-run-v1";
  run_id: string;
  mode: "dry-run" | "full";
  branch: string;
  started_at: string;
  updated_at: string;
  phase: RunPhase;
  research_source: "research-agent" | "reference-library" | null;
  scoring_source: "scoring-agent" | "reference-library" | null;
  research_notes: string[];
  candidates: {
    id: string;
    name: string;
    rank: number;
    overall: number;
    commercial: number;
    atlas_fit: number;
    buildability: number;
  }[];
  filtered_candidates: { id: string; name: string; reason: string }[];
  dashboard_file: string | null;
  dashboard_url: string | null;
  approval_file: string;
  approved_candidate_id: string | null;
  spec_path: string | null;
  task_path: string | null;
  loop_result: string | null;
  loop_disposition: string | null;
  final_review_file: string | null;
  final_review_decision: FinalDecisionValue | null;
  builder_ran: boolean;
  committed: false;
  pushed: false;
  published: false;
  notes: string[];
};

export type HistoryEvent = {
  at: string;
  run_id: string;
  status: CandidateStatus;
  note: string;
};

export type HistoryEntry = {
  id: string;
  name: string;
  status: CandidateStatus;
  first_seen_at: string;
  updated_at: string;
  runs: string[];
  last_scores: SummaryScores | null;
  events: HistoryEvent[];
};

export type CandidateHistory = {
  schema_version: "atlas-candidate-history-v1";
  updated_at: string;
  candidates: HistoryEntry[];
};
