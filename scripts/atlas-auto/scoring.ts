import {
  CRITERIA,
  type Candidate,
  type CandidateStatus,
  type Criterion,
  type ScoreSheet,
  type ScoredCandidate,
  type SummaryScores,
} from "./types";

export const SUMMARY_GROUPS: Record<"commercial" | "atlas_fit" | "buildability", Criterion[]> = {
  commercial: ["smb_value", "willingness_to_pay", "frequency", "smb_breadth"],
  atlas_fit: ["differentiation", "ai_literacy_value", "demonstrability", "workflow_quality"],
  buildability: ["setup_simplicity", "permission_simplicity", "testability", "automation_potential"],
};

/** Overall recommendation weights. Time to value is the only criterion outside the three groups. */
export const OVERALL_WEIGHTS = {
  commercial: 0.4,
  atlas_fit: 0.3,
  buildability: 0.2,
  time_to_value: 0.1,
} as const;

export function summarize(criteria: Record<Criterion, number>): SummaryScores {
  const mean = (keys: Criterion[]) => keys.reduce((sum, key) => sum + criteria[key], 0) / keys.length;
  const commercial = mean(SUMMARY_GROUPS.commercial);
  const atlasFit = mean(SUMMARY_GROUPS.atlas_fit);
  const buildability = mean(SUMMARY_GROUPS.buildability);
  const overall =
    OVERALL_WEIGHTS.commercial * commercial +
    OVERALL_WEIGHTS.atlas_fit * atlasFit +
    OVERALL_WEIGHTS.buildability * buildability +
    OVERALL_WEIGHTS.time_to_value * criteria.time_to_value;
  return {
    commercial: round(commercial, 1),
    atlas_fit: round(atlasFit, 1),
    buildability: round(buildability, 1),
    overall: round(overall, 2),
  };
}

export function normalizeCriteria(sheet: Pick<ScoreSheet, "criteria">): Record<Criterion, number> {
  const missing = CRITERIA.filter((key) => typeof sheet.criteria[key] !== "number");
  if (missing.length > 0) throw new Error(`Score sheet is missing: ${missing.join(", ")}`);
  return Object.fromEntries(
    CRITERIA.map((key) => [key, round(Math.min(10, Math.max(1, sheet.criteria[key])), 1)]),
  ) as Record<Criterion, number>;
}

export function rankCandidates(
  entries: {
    candidate: Candidate;
    sheet: ScoreSheet;
    historyStatus: CandidateStatus | null;
    source: ScoredCandidate["source"];
  }[],
): ScoredCandidate[] {
  const scored = entries.map(({ candidate, sheet, historyStatus, source }) => {
    const criteria = normalizeCriteria(sheet);
    const rationale = Object.fromEntries(
      CRITERIA.filter((key) => typeof sheet.rationale?.[key] === "string").map((key) => [
        key,
        sheet.rationale[key],
      ]),
    ) as Partial<Record<Criterion, string>>;
    return {
      ...candidate,
      rank: 0,
      scores: { criteria, rationale, summary: sheet.summary ?? "" },
      summary_scores: summarize(criteria),
      history_status: historyStatus,
      source,
    } satisfies ScoredCandidate;
  });
  scored.sort(
    (a, b) =>
      b.summary_scores.overall - a.summary_scores.overall ||
      b.summary_scores.commercial - a.summary_scores.commercial ||
      a.name.localeCompare(b.name),
  );
  return scored.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

const STOP_WORDS = new Set([
  "ai",
  "the",
  "a",
  "an",
  "and",
  "for",
  "of",
  "to",
  "your",
  "smb",
  "premium",
  "blueprint",
  "assistant",
  "kit",
  "workflow",
]);

export function nameTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.replace(/s$/, ""))
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

export function isSameIdea(
  left: { id: string; name: string },
  right: { id: string; name: string },
): boolean {
  if (left.id === right.id) return true;
  const a = nameTokens(`${left.name} ${left.id}`);
  const b = nameTokens(`${right.name} ${right.id}`);
  if (a.size === 0 || b.size === 0) return false;
  const shared = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return shared / union >= 0.6;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
