import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { renderCandidateDashboard, statusLabel } from "./dashboard";
import { researchAndScore, type ResearchAgentResult } from "./research";
import { OVERALL_WEIGHTS, summarize } from "./scoring";
import { CRITERIA, candidateSchema, type Candidate, type CandidateHistory, type Criterion, type RunRecord } from "./types";

const SECURITY_ID = "security-readiness-action-pack";

function history(): CandidateHistory {
  return { schema_version: "atlas-candidate-history-v1", updated_at: "", candidates: [] };
}

function candidate(id: string, name: string): Candidate {
  return candidateSchema.parse({
    id,
    name,
    persona: "A small-business operator.",
    problem: "A recurring operating problem.",
    workflow: ["Collect an export.", "Apply the rules.", "The owner reviews.", "Nothing is sent automatically."],
    before: "The owner does this from memory.",
    after: "The owner reviews a structured result.",
    required_data_tools: ["A CSV export"],
    why_pay: "The rules and review step are the product.",
    setup_difficulty: "EASY",
    automation_potential: "LOW",
    human_oversight: "HIGH",
    major_risks: ["The owner skips the review."],
    estimated_premium_value: "A one-time pack. Value estimate, not a price.",
    sample_input: "row,value\n1,fictional",
    sample_output: "Confirmed: one fictional row. The owner decides.",
    guided_demo: "One fictional row becomes a reviewed result.",
    related_catalog_slugs: [],
    novelty_note: "Test candidate.",
  });
}

function researchResult(candidates: Candidate[]): ResearchAgentResult {
  return { json: { schema_version: "atlas-research-v1", candidates } };
}

function scoringResult(candidates: Candidate[], value: number): ResearchAgentResult {
  const criteria = Object.fromEntries(CRITERIA.map((key) => [key, value])) as Record<Criterion, number>;
  return {
    json: {
      schema_version: "atlas-scoring-v1",
      scores: candidates.map((item) => ({
        candidate_id: item.id,
        criteria,
        rationale: {},
        summary: "Scored by the test double of the Scoring Agent.",
      })),
    },
  };
}

function runRecord(result: Awaited<ReturnType<typeof researchAndScore>>): RunRecord {
  return {
    schema_version: "atlas-auto-run-v1",
    run_id: "pool-test",
    mode: "full",
    branch: "private-preview",
    started_at: "",
    updated_at: "",
    phase: "AWAITING_APPROVAL",
    research_source: result.researchSource,
    scoring_source: result.scoringSource,
    research_notes: result.notes,
    candidates: result.candidates.map((item) => ({
      id: item.id,
      name: item.name,
      rank: item.rank,
      ...item.summary_scores,
    })),
    filtered_candidates: result.filtered,
    dashboard_file: null,
    dashboard_url: null,
    approval_file: "atlas-memory/runs/pool-test/approval.json",
    approved_candidate_id: null,
    spec_path: null,
    task_path: null,
    loop_result: null,
    loop_disposition: null,
    final_review_file: null,
    final_review_decision: null,
    commerce: null,
    builder_ran: false,
    committed: false,
    pushed: false,
    published: false,
    notes: [],
  };
}

test("the scoring formula is unchanged", () => {
  assert.deepEqual(OVERALL_WEIGHTS, {
    commercial: 0.4,
    atlas_fit: 0.3,
    buildability: 0.2,
    time_to_value: 0.1,
  });
});

test("researchAndScore inserts the active Security seed before scoring", async () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-security-pool-"));
  let scoredIds: string[] = [];
  const result = await researchAndScore({
    runId: "security-pool",
    history: history(),
    reportDir,
    offline: false,
    researchAgent: async () =>
      researchResult([
        candidate("quote-request-assistant", "Quote Request Assistant"),
        candidate("google-ads-performance-coach", "Google Ads Performance Coach"),
        candidate(SECURITY_ID, "Security Readiness Action Pack"),
        candidate(SECURITY_ID, "Security Readiness Action Pack"),
      ]),
    scoringAgent: async (candidates) => {
      scoredIds = candidates.map((item) => item.id);
      return scoringResult(candidates, 4);
    },
  });

  assert.deepEqual(scoredIds.filter((id) => id === SECURITY_ID), [SECURITY_ID]);
  assert.equal(scoredIds.includes("inactive-topic-example"), false);
  assert.equal(scoredIds.includes("quote-request-assistant"), true);
  assert.equal(scoredIds.includes("google-ads-performance-coach"), true);

  const security = result.candidates.find((item) => item.id === SECURITY_ID);
  assert.ok(security);
  assert.equal(security.history_status, null);
  assert.equal(statusLabel(undefined, security.history_status), "Pending");
  assert.deepEqual(security.summary_scores, summarize(security.scores.criteria));
  assert.equal(security.summary_scores.overall, summarize(Object.fromEntries(CRITERIA.map((key) => [key, 4])) as Record<Criterion, number>).overall);
  assert.equal(result.candidates.filter((item) => item.id === SECURITY_ID).length, 1);
  assert.equal(result.filtered.some((item) => item.id === SECURITY_ID && item.reason.includes("Duplicate")), true);
  assert.equal(result.candidates.some((item) => item.history_status === "APPROVED"), false);

  const html = renderCandidateDashboard({
    run: runRecord(result),
    candidates: result.candidates,
    state: {
      phase: "AWAITING_APPROVAL",
      mode: "full",
      locked: false,
      final_locked: false,
      approved_candidate_id: null,
      decisions: {},
      final_review: null,
      commerce_statuses: [],
      message: "",
    },
    token: "test-token",
  });
  assert.match(html, /Security Readiness Action Pack/);
  assert.match(html, /Pending/);
  assert.equal(html.includes(">APPROVED<"), false);
  fs.rmSync(reportDir, { recursive: true, force: true });
});

test("an omitted Security seed stays visible when it ranks outside the top 5", async () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-security-omit-"));
  const research = [
    candidate("ai-customer-response-assistant", "Customer Reply Review Queue"),
    candidate("ai-cash-flow-forecaster", "13-Week Cash Gap Planner"),
    candidate("ai-pipeline-risk-detector", "Stalled Deal Risk Queue"),
    candidate("inactive-customer-winback", "Lapsed Customer Winback Queue"),
    candidate("google-ads-performance-coach", "Google Ads Performance Coach"),
    candidate("ai-hiring-affordability-planner", "Next Hire Affordability Check"),
  ];
  let sawSecurityBeforeScoring = false;
  const result = await researchAndScore({
    runId: "security-omitted",
    history: history(),
    reportDir,
    offline: false,
    researchAgent: async () => researchResult(research),
    scoringAgent: async (candidates) => {
      sawSecurityBeforeScoring = candidates.some((item) => item.id === SECURITY_ID);
      return scoringResult(candidates, 5);
    },
  });

  assert.equal(sawSecurityBeforeScoring, true);
  const prompt = fs.readFileSync(path.join(reportDir, "scoring-prompt.txt"), "utf8");
  assert.match(prompt, new RegExp(SECURITY_ID));
  assert.equal(prompt.includes("inactive-topic-example"), false);
  const security = result.candidates.find((item) => item.id === SECURITY_ID);
  assert.ok(security);
  assert.equal(security.rank, 6);
  assert.equal(security.summary_scores.overall, summarize(Object.fromEntries(CRITERIA.map((key) => [key, 5])) as Record<Criterion, number>).overall);
  assert.equal(security.history_status, null);
  assert.equal(statusLabel(undefined, security.history_status), "Pending");
  assert.equal(result.candidates.filter((item) => item.id === SECURITY_ID).length, 1);
  assert.equal(result.filtered.some((item) => item.id === SECURITY_ID), false);
  assert.equal(result.candidates.some((item) => item.history_status === "APPROVED"), false);
  assert.equal([...result.candidates, ...result.filtered].some((item) => item.id === "inactive-topic-example"), false);
  for (const item of research) {
    assert.equal([...result.candidates, ...result.filtered].some((entry) => entry.id === item.id), true, item.id);
  }
  const html = renderCandidateDashboard({
    run: runRecord(result),
    candidates: result.candidates,
    state: {
      phase: "AWAITING_APPROVAL",
      mode: "full",
      locked: false,
      final_locked: false,
      approved_candidate_id: null,
      decisions: {},
      final_review: null,
      commerce_statuses: [],
      message: "",
    },
    token: "test-token",
  });
  assert.match(html, /<span class="rank sm">6<\/span>[\s\S]*?Security Readiness Action Pack[\s\S]*?Strategic topic/);
  assert.match(html, /Pending/);
  assert.equal(html.includes(">APPROVED<"), false);
  assert.equal((html.match(/data-card="security-readiness-action-pack"/g) ?? []).length, 1);
  fs.rmSync(reportDir, { recursive: true, force: true });
});
