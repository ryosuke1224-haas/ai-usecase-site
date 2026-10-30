import assert from "node:assert/strict";
import { test } from "node:test";
import { renderFinalReview } from "./dashboard";
import {
  canApproveProductAndPrice,
  createBuilderRetryRun,
  evaluateBuilderRetry,
  inspectBuilderRetry,
  previousBuildSucceeded,
  resumeBlockedMessage,
  type BuilderRetryInspection,
} from "./retry-builder";
import type { CandidateDecision, RunRecord } from "./types";

const SOURCE_ID = "20261029T062527Z";
const SECURITY_ID = "security-readiness-action-pack";

function approval(overrides: Partial<CandidateDecision> = {}): CandidateDecision {
  return {
    schema_version: "atlas-auto-decision-v1",
    run_id: SOURCE_ID,
    candidate_id: SECURITY_ID,
    candidate_name: "Security Readiness Action Pack",
    decision: "APPROVED",
    note: "",
    decided_at: "2026-10-29T07:26:55.069Z",
    source: "dashboard",
    ...overrides,
  };
}

function sourceRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    schema_version: "atlas-auto-run-v1",
    run_id: SOURCE_ID,
    mode: "full",
    branch: "private-preview",
    started_at: "2026-10-29T06:25:27.622Z",
    updated_at: "2026-10-29T15:37:26.992Z",
    phase: "FINISHED",
    research_source: "research-agent",
    scoring_source: "scoring-agent",
    research_notes: [],
    candidates: [
      {
        id: SECURITY_ID,
        name: "Security Readiness Action Pack",
        rank: 6,
        commercial: 5.6,
        atlas_fit: 7.4,
        buildability: 7,
        overall: 6.41,
      },
    ],
    filtered_candidates: [],
    dashboard_file: null,
    dashboard_url: null,
    approval_file: `atlas-memory/runs/${SOURCE_ID}/approval.json`,
    approved_candidate_id: SECURITY_ID,
    spec_path: "agent-specs/security-readiness-action-pack.json",
    task_path: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loop_result: "agent-reports/loops/20261029T074902Z-security-readiness-action-pack-premium-build/loop-result.json",
    loop_disposition: "HUMAN_REVIEW_REQUIRED",
    final_review_file: `atlas-memory/runs/${SOURCE_ID}/final-review.json`,
    final_review_decision: "CHANGES_REQUESTED",
    commerce: null,
    builder_ran: true,
    committed: false,
    pushed: false,
    published: false,
    notes: [],
    ...overrides,
  };
}

function inspection(overrides: Partial<BuilderRetryInspection> = {}): BuilderRetryInspection {
  const source = overrides.source ?? sourceRun();
  return {
    source,
    approval: approval(),
    spec: {
      schema_version: "atlas-blueprint-spec-v1",
      id: SECURITY_ID,
    } as BuilderRetryInspection["spec"],
    specExists: true,
    loop: {
      disposition: "HUMAN_REVIEW_REQUIRED",
      files_changed: [],
      qa_result: { status: "not_run" },
      unresolved_issues: [{ classification: "BUILDER_TIMEOUT" }],
    },
    productPresent: false,
    ...overrides,
  };
}

function reviewData(overrides: Partial<Parameters<typeof canApproveProductAndPrice>[0]> = {}) {
  return {
    disposition: "HUMAN_REVIEW_REQUIRED",
    build: "not_run",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    ...overrides,
  };
}

test("the finished Security timeout run is eligible for a Builder retry", () => {
  const real = inspectBuilderRetry(SOURCE_ID);
  assert.equal(real.source.phase, "FINISHED");
  assert.equal(real.source.approved_candidate_id, SECURITY_ID);
  assert.equal(real.approval?.decision, "APPROVED");
  assert.equal(real.spec?.id, SECURITY_ID);
  assert.equal(real.specExists, true);
  assert.equal(real.loop?.unresolved_issues?.[0]?.classification, "BUILDER_TIMEOUT");
  assert.equal(previousBuildSucceeded(real.source, real.loop), false);
  assert.deepEqual(evaluateBuilderRetry(real), { ok: true });
  assert.match(resumeBlockedMessage(real.source, true), /--retry-builder 20261029T062527Z/);
});

test("Builder retry creates a new run identity and reuses the approved Spec", () => {
  const source = inspectBuilderRetry(SOURCE_ID).source;
  const next = createBuilderRetryRun({
    source,
    approval: approval(),
    specPath: "agent-specs/security-readiness-action-pack.json",
    taskPath: "agent-tasks/security-readiness-action-pack-premium-build.json",
    runId: "20261029T999999Z",
    now: "2026-10-29T22:00:00.000Z",
  });
  assert.equal(next.run.run_id, "20261029T999999Z");
  assert.notEqual(next.run.run_id, SOURCE_ID);
  assert.equal(next.run.parent_run_id, SOURCE_ID);
  assert.equal(next.run.retry_kind, "builder");
  assert.equal(next.run.phase, "BUILD");
  assert.equal(next.run.approved_candidate_id, SECURITY_ID);
  assert.equal(next.run.spec_path, "agent-specs/security-readiness-action-pack.json");
  assert.equal(next.run.loop_result, null);
  assert.equal(next.run.builder_ran, false);
  assert.equal(next.run.final_review_decision, null);
  assert.equal(next.approval.candidate_id, SECURITY_ID);
  assert.equal(next.approval.decision, "APPROVED");
  assert.equal(next.approval.run_id, "20261029T999999Z");
  assert.match(next.run.notes[0] ?? "", /Research, scoring, approval, and Spec were not rerun/);
  const scores = source.candidates.find((item) => item.id === SECURITY_ID);
  assert.deepEqual(
    next.run.candidates.find((item) => item.id === SECURITY_ID),
    scores,
  );
});

test("Builder retry is refused without approval, without a Spec, or after a successful product", () => {
  assert.equal(
    evaluateBuilderRetry(inspection({ approval: approval({ decision: "HOLD" }) })).ok,
    false,
  );
  assert.equal(evaluateBuilderRetry(inspection({ specExists: false, spec: null })).ok, false);
  assert.equal(
    evaluateBuilderRetry(
      inspection({
        source: sourceRun({ loop_disposition: "READY_FOR_HUMAN_REVIEW" }),
        loop: { disposition: "READY_FOR_HUMAN_REVIEW", files_changed: ["app/blueprints/x/page.tsx"], qa_result: { status: "pass" } },
        productPresent: true,
      }),
    ).ok,
    false,
  );
  assert.match(
    evaluateBuilderRetry(
      inspection({
        source: sourceRun({ loop_disposition: "READY_FOR_HUMAN_REVIEW" }),
        loop: { disposition: "READY_FOR_HUMAN_REVIEW", qa_result: { status: "pass" } },
        productPresent: true,
      }),
    ).reason,
    /overwrite/,
  );
});

test("price approval stays closed until Build, QA, and Evaluator succeed", () => {
  assert.equal(canApproveProductAndPrice(reviewData()), false);
  assert.equal(
    canApproveProductAndPrice(
      reviewData({
        disposition: "READY_FOR_HUMAN_REVIEW",
        build: "pass",
        qa: { status: "pass" },
        evaluator: { status: "not_run", decision: null },
      }),
    ),
    false,
  );
  assert.equal(
    canApproveProductAndPrice({
      disposition: "READY_FOR_HUMAN_REVIEW",
      build: "pass",
      qa: { status: "pass" },
      evaluator: { status: "executed", decision: "PASS_WITH_RECOMMENDATIONS" },
    }),
    true,
  );
  assert.equal(
    canApproveProductAndPrice({
      disposition: "HUMAN_REVIEW_REQUIRED",
      build: "pass",
      qa: { status: "pass", skipped: 0 },
      evaluator: { status: "executed", decision: "PASS" },
      supervisor: { recommendation: "READY_FOR_HUMAN_REVIEW" },
    }),
    true,
  );
  assert.equal(
    canApproveProductAndPrice({
      disposition: "HUMAN_REVIEW_REQUIRED",
      build: "pass",
      qa: { status: "pass", skipped: 0 },
      evaluator: { status: "executed", decision: "PASS" },
      supervisor: { recommendation: "NEEDS_INTERNAL_RECOVERY" },
    }),
    false,
  );

  const timedOut = renderFinalReview({
    run: sourceRun(),
    data: {
      blueprintName: "Security Readiness Action Pack",
      candidateId: SECURITY_ID,
      specPath: "agent-specs/security-readiness-action-pack.json",
      taskPath: "agent-tasks/security-readiness-action-pack-premium-build.json",
      loopResultPath: null,
      disposition: "HUMAN_REVIEW_REQUIRED",
      iterationsUsed: 0,
      maxIterations: 3,
      filesChanged: [],
      validate: "not_run",
      build: "not_run",
      qa: { status: "not_run", passed: 0, failed: 0, skipped: 0, report: null },
      evaluator: {
        status: "not_run",
        decision: null,
        overall: null,
        reason: "The Evaluator runs only after QA passes.",
        reportPath: null,
        scores: [],
        findings: [],
      },
      criticalIssues: ["BUILDER_TIMEOUT"],
      sampleInput: "fictional",
      sampleOutput: "fictional",
      suggestedPriceCents: 4900,
      suggestedPaymentType: "ONE_TIME",
      commercialRationale: "test",
    },
    state: {
      phase: "AWAITING_FINAL_REVIEW",
      mode: "full",
      locked: true,
      final_locked: false,
      approved_candidate_id: SECURITY_ID,
      decisions: {},
      final_review: null,
      commerce_statuses: [],
      message: "",
      price_approval_enabled: false,
    },
    token: "test-token",
  });
  assert.match(timedOut, /APPROVE PRODUCT &amp; PRICE stays closed/);
  assert.match(timedOut, /data-final="APPROVE_PRODUCT_AND_PRICE" disabled/);
});

test("retry does not invent a new candidate or change the approved scores", () => {
  const source = inspectBuilderRetry(SOURCE_ID);
  const before = source.source.candidates.find((item) => item.id === SECURITY_ID);
  const next = createBuilderRetryRun({
    source: source.source,
    approval: source.approval!,
    specPath: source.source.spec_path!,
    taskPath: source.source.task_path!,
    runId: "retry-identity",
    now: "2026-10-29T22:00:00.000Z",
  });
  assert.equal(next.run.candidates.filter((item) => item.id === SECURITY_ID).length, 1);
  assert.deepEqual(next.run.candidates, source.source.candidates);
  assert.equal(next.run.approved_candidate_id, SECURITY_ID);
  assert.deepEqual(
    next.run.candidates.find((item) => item.id === SECURITY_ID),
    before,
  );
});
