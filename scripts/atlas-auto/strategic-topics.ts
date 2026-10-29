import { candidateSchema, type Candidate, type Criterion, type ScoreSheet } from "./types";

/**
 * Strategic research seeds. Active seeds are inserted into the candidate pool
 * before scoring. They are not pre-ranked and not pre-approved.
 * Inactive seeds stay out of the pool.
 */
export type StrategicSeed = {
  id: string;
  active: boolean;
  candidate: Candidate;
  /** Used only when the Scoring Agent does not return a complete sheet for this id. */
  fallbackSheet: ScoreSheet;
};

const checklist = (id: string, name: string, problem: string): Candidate =>
  candidateSchema.parse({
    id,
    name,
    persona: "A small-business operator.",
    problem,
    workflow: ["Collect the owner's notes.", "Apply the checklist.", "The owner chooses what to do.", "Nothing is sent or changed automatically."],
    before: "The owner has an unstructured list.",
    after: "The owner has a reviewed list and decides what to do.",
    required_data_tools: ["A spreadsheet the owner already has"],
    why_pay: "The checklist and review labels are the product, not a generic summary.",
    setup_difficulty: "EASY",
    automation_potential: "LOW",
    human_oversight: "HIGH",
    major_risks: ["A buyer treats the checklist as proof the company is secure."],
    estimated_premium_value: "A one-time pack. Value estimate, not a price.",
    sample_input: "item,status\nMFA,off\n(Fictional. No live systems.)",
    sample_output: "Confirmed: MFA is off in the fictional inventory. Suggested action: the owner decides. This does not certify the company as secure.",
    guided_demo: "A fictional inventory becomes a labeled checklist. The owner chooses every action.",
    related_catalog_slugs: [],
    novelty_note: "Configured strategic seed. Not a scanner, exploit tool, or certificate.",
  });

const fallback = (id: string): ScoreSheet => ({
  candidate_id: id,
  criteria: {
    smb_value: 6,
    willingness_to_pay: 6,
    frequency: 5,
    time_to_value: 6,
    setup_simplicity: 6,
    demonstrability: 6,
    ai_literacy_value: 6,
    differentiation: 6,
    automation_potential: 5,
    testability: 6,
    permission_simplicity: 6,
    smb_breadth: 6,
    workflow_quality: 6,
  } satisfies Record<Criterion, number>,
  rationale: {},
  summary: "Fallback criterion inputs used only when the Scoring Agent omits this id.",
});

export const strategicSeeds: StrategicSeed[] = [
  {
    id: "security",
    active: true,
    candidate: checklist(
      "security-readiness-action-pack",
      "Security Readiness Action Pack",
      "An SMB owner with no security team does not know which access, backup, and account checks to do first.",
    ),
    fallbackSheet: fallback("security-readiness-action-pack"),
  },
  {
    id: "inactive-example",
    active: false,
    candidate: checklist(
      "inactive-topic-example",
      "Inactive Topic Example",
      "This seed is inactive and must not be inserted into the pool.",
    ),
    fallbackSheet: fallback("inactive-topic-example"),
  },
];

export function activeStrategicSeeds(): StrategicSeed[] {
  return strategicSeeds.filter((seed) => seed.active);
}

export function isActiveStrategicCandidate(id: string): boolean {
  return activeStrategicSeeds().some((seed) => seed.candidate.id === id);
}
