import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { AgentTimeoutError } from "../atlas-agent/cursor-cli";
import {
  AGENT_CONNECTION_FAILURE,
  AGENT_RETRY_LIMITS,
  RESEARCH_AGENT_TIMEOUT,
  SPEC_AGENT_TIMEOUT,
  classifyAgentInfra,
  isRetryableAgentError,
  isTransientAgentError,
  withTransientAgentRetry,
} from "./agent-retry";
import { researchAndScore } from "./research";
import { runSpecAgent } from "./spec";
import { candidateSchema, type Candidate, type CandidateHistory, type Criterion } from "./types";
import { CRITERIA } from "./types";

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
    before: "Manual work.",
    after: "Structured review.",
    required_data_tools: ["CSV export"],
    why_pay: "Rules and a review step.",
    setup_difficulty: "EASY",
    automation_potential: "LOW",
    human_oversight: "HIGH",
    major_risks: ["The owner skips the review."],
    estimated_premium_value: "About $49 one-time.",
    sample_input: "fictional",
    sample_output: "fictional",
    guided_demo: "fictional demo",
    related_catalog_slugs: [],
    novelty_note: name,
  });
}

function researchJson(candidates: Candidate[]) {
  return { json: { schema_version: "atlas-research-v1", candidates } };
}

function scoringJson(candidates: Candidate[]) {
  const criteria = Object.fromEntries(CRITERIA.map((key) => [key, 7])) as Record<Criterion, number>;
  return {
    json: {
      schema_version: "atlas-scoring-v1",
      scores: candidates.map((item) => ({
        candidate_id: item.id,
        criteria,
        rationale: {},
        summary: "test",
      })),
    },
  };
}

function specJson() {
  return {
    json: {
      name: "AI Expense Watchdog",
      value_proposition: "Review a fictional expense export.",
      persona: "A small-business operator.",
      problem: "Expenses pile up.",
      workflow: ["Collect an export.", "Apply the rules.", "The owner reviews."],
      before: "Manual.",
      after: "Structured.",
      guided_demo: {
        summary: "A fictional walkthrough.",
        steps: ["Show the export.", "Show the review."],
        sample_input: "fictional",
        sample_output: "fictional",
        fictional_data_notice: "Fictional.",
      },
      kit_contents: [
        { id: "a", title: "A", purpose: "p" },
        { id: "b", title: "B", purpose: "p" },
        { id: "c", title: "C", purpose: "p" },
      ],
      decision_rules: ["The owner decides."],
      human_ai_boundary: ["AI prepares."],
      safety: ["Fictional data only."],
      required_data_tools: ["CSV export"],
      acceptance_criteria: ["One", "Two", "Three"],
      qa_checks: [
        { id: "public", description: "public", viewport: "both", requires_auth: false },
        { id: "auth", description: "auth", viewport: "desktop", requires_auth: true },
      ],
      out_of_scope: [],
    },
  };
}

function abortError(): Error {
  return Object.assign(new Error("write ECONNABORTED"), { code: "ECONNABORTED" });
}

test("ECONNABORTED is a transient connection failure, not a Builder timeout", () => {
  const error = abortError();
  assert.equal(isTransientAgentError(error), true);
  assert.equal(isRetryableAgentError(error), true);
  assert.equal(classifyAgentInfra("research", error), AGENT_CONNECTION_FAILURE);
  assert.equal(classifyAgentInfra("spec", error), AGENT_CONNECTION_FAILURE);
  assert.notEqual(classifyAgentInfra("research", error), "BUILDER_TIMEOUT");
});

test("Research Agent timeout is not labeled BUILDER_TIMEOUT", () => {
  const error = new AgentTimeoutError("research", 15 * 60_000);
  assert.equal(classifyAgentInfra("research", error), RESEARCH_AGENT_TIMEOUT);
  assert.equal(error.message.includes("BUILDER_TIMEOUT"), false);
  assert.equal(error.code, RESEARCH_AGENT_TIMEOUT);
});

test("Research Agent ECONNABORTED then succeeds", async () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-research-retry-"));
  let attempts = 0;
  const pool = [candidate("stalled-deal-rescue-queue", "Stalled Deal Rescue Queue")];
  const result = await researchAndScore({
    runId: "research-retry",
    history: history(),
    reportDir,
    offline: false,
    displayLimit: 10,
    sleep: async () => {},
    researchAgent: async () => {
      attempts += 1;
      if (attempts === 1) throw abortError();
      return researchJson(pool);
    },
    scoringAgent: async (candidates) => scoringJson(candidates),
  });
  assert.equal(attempts, 2);
  assert.equal(result.researchSource, "research-agent");
  assert.equal(result.candidates.some((item) => item.id === "stalled-deal-rescue-queue"), true);
  fs.rmSync(reportDir, { recursive: true, force: true });
});

test("Research Agent timeout then fallback library continues", async () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-research-timeout-"));
  let attempts = 0;
  const result = await researchAndScore({
    runId: "research-timeout",
    history: history(),
    reportDir,
    offline: false,
    sleep: async () => {},
    researchAgent: async () => {
      attempts += 1;
      throw new AgentTimeoutError("research", 15 * 60_000);
    },
  });
  assert.equal(attempts, AGENT_RETRY_LIMITS.maxAttempts);
  assert.equal(result.researchSource, "reference-library");
  assert.ok(result.candidates.length > 0);
  assert.match(result.notes.join("\n"), /RESEARCH_AGENT_TIMEOUT/);
  assert.equal(result.notes.join("\n").includes("BUILDER_TIMEOUT"), false);
  fs.rmSync(reportDir, { recursive: true, force: true });
});

test("Spec Agent ECONNABORTED then succeeds", async () => {
  const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-spec-retry-"));
  const specPath = path.join(reportDir, "ai-expense-watchdog.json");
  const liveSpecPath = "agent-specs/ai-expense-watchdog.json";
  const liveBefore = fs.existsSync(liveSpecPath) ? fs.readFileSync(liveSpecPath, "utf8") : null;
  let attempts = 0;
  const result = await runSpecAgent({
    candidate: {
      ...candidate("ai-expense-watchdog", "AI Expense Watchdog"),
      rank: 1,
      scores: {
        criteria: Object.fromEntries(CRITERIA.map((key) => [key, 7])) as Record<Criterion, number>,
        rationale: {},
        summary: "",
      },
      summary_scores: { commercial: 7, atlas_fit: 7, buildability: 7, overall: 7 },
      history_status: null,
      source: "reference-library",
    },
    approval: {
      schema_version: "atlas-auto-decision-v1",
      run_id: "r",
      candidate_id: "ai-expense-watchdog",
      candidate_name: "AI Expense Watchdog",
      decision: "APPROVED",
      note: "",
      decided_at: "t",
      source: "file",
    },
    runId: "r",
    reportDir,
    specPath,
    sleep: async () => {},
    specAgent: async () => {
      attempts += 1;
      if (attempts === 1) throw abortError();
      return specJson();
    },
  });
  assert.equal(attempts, 2);
  assert.equal(result.spec.id, "ai-expense-watchdog");
  assert.equal(result.specPath, specPath);
  assert.equal(fs.existsSync(specPath), true);
  const liveAfter = fs.existsSync(liveSpecPath) ? fs.readFileSync(liveSpecPath, "utf8") : null;
  assert.equal(liveAfter, liveBefore);
  fs.rmSync(reportDir, { recursive: true, force: true });
});

test("Spec Agent ECONNABORTED exhausts retries", async () => {
  let attempts = 0;
  await assert.rejects(
    withTransientAgentRetry({
      role: "spec",
      label: "Spec Agent",
      sleep: async () => {},
      run: async () => {
        attempts += 1;
        throw abortError();
      },
    }),
    (error: unknown) => {
      assert.equal(classifyAgentInfra("spec", error), AGENT_CONNECTION_FAILURE);
      return true;
    },
  );
  assert.equal(attempts, AGENT_RETRY_LIMITS.maxAttempts);
});
