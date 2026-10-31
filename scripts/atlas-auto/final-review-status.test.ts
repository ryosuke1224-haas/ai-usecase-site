import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { renderFinalReview, type FinalReviewData } from "./dashboard";
import {
  PENDING_SUPERVISOR,
  applyCanonicalFinalReview,
  canonicalFinalReviewStatus,
  canonicalStatusFromRun,
  isContradictoryFinalReview,
  persistCanonicalFinalReviewStatus,
  planFinalReviewResume,
} from "./final-review-status";
import { loadRun, saveRun } from "./memory";
import { canApproveProductAndPrice } from "./retry-builder";
import { HUMAN_REVIEW_REQUIRED } from "./supervisor";
import type { RunRecord } from "./types";

const READY = "READY_FOR_HUMAN_REVIEW";

function readyReview(overrides: Partial<FinalReviewData> = {}): FinalReviewData {
  return {
    blueprintName: "Security Readiness Action Pack",
    candidateId: "security-readiness-action-pack",
    specPath: "agent-specs/security-readiness-action-pack.json",
    taskPath: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loopResultPath: "agent-reports/loops/example/loop-result.json",
    disposition: HUMAN_REVIEW_REQUIRED,
    iterationsUsed: 1,
    maxIterations: 3,
    filesChanged: ["app/blueprints/security-readiness-action-pack/page.tsx"],
    validate: "pass",
    build: "pass",
    qa: { status: "pass", passed: 137, failed: 0, skipped: 0, report: null },
    evaluator: {
      status: "executed",
      decision: "PASS",
      overall: 8.9,
      reason: "pass",
      reportPath: null,
      scores: [],
      findings: [],
    },
    criticalIssues: [],
    sampleInput: "fictional",
    sampleOutput: "fictional",
    suggestedPriceCents: 4900,
    suggestedPaymentType: "ONE_TIME",
    commercialRationale: "test",
    requiresAuthenticatedQa: true,
    supervisor: {
      recommendation: READY,
      classification: "NONE",
      build: "pass",
      qaPassed: 137,
      qaFailed: 0,
      qaSkipped: 0,
      authenticatedQa: "pass",
      evaluatorDecision: "PASS",
      evaluatorScore: 8.9,
      blockingFindings: 0,
      nonBlockingFindings: 4,
      recoveryCyclesUsed: 0,
    },
    ...overrides,
  };
}

function awaitingRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    schema_version: "atlas-auto-run-v1",
    run_id: "20261031T045058Z",
    mode: "full",
    branch: "private-preview",
    started_at: "2026-10-31T04:50:58.000Z",
    updated_at: "2026-10-31T04:50:58.000Z",
    phase: "AWAITING_FINAL_REVIEW",
    research_source: "research-agent",
    scoring_source: "scoring-agent",
    research_notes: [],
    candidates: [],
    filtered_candidates: [],
    dashboard_file: null,
    dashboard_url: null,
    approval_file: "atlas-memory/runs/20261031T045058Z/approval.json",
    approved_candidate_id: "security-readiness-action-pack",
    spec_path: "agent-specs/security-readiness-action-pack.json",
    task_path: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loop_result: "agent-reports/loops/example/loop-result.json",
    loop_disposition: PENDING_SUPERVISOR,
    status: PENDING_SUPERVISOR,
    final_review_file: null,
    final_review_decision: null,
    commerce: null,
    builder_ran: true,
    committed: false,
    pushed: false,
    published: false,
    notes: [],
    supervisor: {
      cycles_used: 0,
      product_fix_iterations: 0,
      auth_session_attempts: 0,
      task_spec_reconcile_attempts: 0,
      evaluator_rebuilds: 0,
      protected_test_violations: 0,
      infra_retries: 0,
      history: [],
      recommendation: READY,
      last_classification: "NONE",
      last_report: readyReview().supervisor,
    },
    ...overrides,
  };
}

function dashboardState(enabled: boolean) {
  return {
    phase: "AWAITING_FINAL_REVIEW" as const,
    mode: "full" as const,
    locked: true,
    final_locked: false,
    approved_candidate_id: "security-readiness-action-pack",
    decisions: {},
    final_review: null,
    commerce_statuses: [],
    message: "",
    price_approval_enabled: enabled,
  };
}

test("AWAITING_FINAL_REVIEW resume preserves/promotes HUMAN_REVIEW_REQUIRED", () => {
  const run = awaitingRun();
  const plan = planFinalReviewResume(run);
  assert.equal(plan.reuseExistingResults, true);
  assert.equal(plan.status, HUMAN_REVIEW_REQUIRED);
  const hydrated = applyCanonicalFinalReview(readyReview({ disposition: PENDING_SUPERVISOR }));
  persistCanonicalFinalReviewStatus(run, hydrated);
  assert.equal(hydrated.disposition, HUMAN_REVIEW_REQUIRED);
  assert.equal(run.loop_disposition, HUMAN_REVIEW_REQUIRED);
  assert.equal(run.status, HUMAN_REVIEW_REQUIRED);
});

test("PENDING_SUPERVISOR + READY_FOR_HUMAN_REVIEW is impossible after canonicalize", () => {
  const raw = readyReview({ disposition: PENDING_SUPERVISOR });
  assert.equal(isContradictoryFinalReview(raw), true);
  const fixed = applyCanonicalFinalReview(raw);
  assert.equal(fixed.disposition, HUMAN_REVIEW_REQUIRED);
  assert.equal(isContradictoryFinalReview(fixed), false);
  assert.equal(canonicalFinalReviewStatus({ disposition: PENDING_SUPERVISOR }), PENDING_SUPERVISOR);
  assert.notEqual(canonicalFinalReviewStatus(raw), PENDING_SUPERVISOR);
});

test("approval UI disabled for PENDING_SUPERVISOR", () => {
  const data = readyReview({
    disposition: PENDING_SUPERVISOR,
    supervisor: { ...readyReview().supervisor!, recommendation: "NEEDS_INTERNAL_RECOVERY" },
  });
  assert.equal(canApproveProductAndPrice(data), false);
  const html = renderFinalReview({
    run: awaitingRun({ supervisor: { ...awaitingRun().supervisor!, recommendation: "NEEDS_INTERNAL_RECOVERY" } }),
    data,
    state: dashboardState(false),
    token: "test",
  });
  assert.match(html, />PENDING_SUPERVISOR</);
  assert.doesNotMatch(html, />HUMAN_REVIEW_REQUIRED</);
  assert.match(html, /data-final="APPROVE_PRODUCT_AND_PRICE" disabled/);
});

test("approval UI enabled for HUMAN_REVIEW_REQUIRED + READY_FOR_HUMAN_REVIEW", () => {
  const data = readyReview();
  assert.equal(canApproveProductAndPrice(data), true);
  const html = renderFinalReview({
    run: awaitingRun({ loop_disposition: HUMAN_REVIEW_REQUIRED, status: HUMAN_REVIEW_REQUIRED }),
    data,
    state: dashboardState(true),
    token: "test",
  });
  assert.match(html, />HUMAN_REVIEW_REQUIRED</);
  assert.doesNotMatch(html, />PENDING_SUPERVISOR</);
  assert.match(html, /data-final="APPROVE_PRODUCT_AND_PRICE"/);
  assert.doesNotMatch(html, /data-final="APPROVE_PRODUCT_AND_PRICE" disabled/);
});

test("repeated resume remains HUMAN_REVIEW_REQUIRED", () => {
  const run = awaitingRun({ loop_disposition: HUMAN_REVIEW_REQUIRED, status: HUMAN_REVIEW_REQUIRED });
  for (let i = 0; i < 3; i += 1) {
    const plan = planFinalReviewResume(run);
    const hydrated = applyCanonicalFinalReview(readyReview({ disposition: PENDING_SUPERVISOR }));
    persistCanonicalFinalReviewStatus(run, hydrated);
    assert.equal(plan.status, HUMAN_REVIEW_REQUIRED);
    assert.equal(hydrated.disposition, HUMAN_REVIEW_REQUIRED);
    assert.equal(run.status, HUMAN_REVIEW_REQUIRED);
  }
});

test("no Builder/QA/Evaluator rerun during final-review resume", () => {
  const plan = planFinalReviewResume(awaitingRun());
  assert.equal(plan.reuseExistingResults, true);
  assert.equal(plan.invokeBuilder, false);
  assert.equal(plan.invokeQa, false);
  assert.equal(plan.invokeEvaluator, false);
});

test("run.json persists HUMAN_REVIEW_REQUIRED", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-final-status-"));
  const previous = process.cwd();
  process.chdir(dir);
  try {
    const run = awaitingRun();
    persistCanonicalFinalReviewStatus(run, { disposition: canonicalStatusFromRun(run) });
    saveRun(run);
    const loaded = loadRun("20261031T045058Z");
    assert.equal(loaded?.status, HUMAN_REVIEW_REQUIRED);
    assert.equal(loaded?.loop_disposition, HUMAN_REVIEW_REQUIRED);
    assert.equal(loaded?.supervisor?.recommendation, READY);
    assert.notEqual(loaded?.status, PENDING_SUPERVISOR);
  } finally {
    process.chdir(previous);
  }
});
