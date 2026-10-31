import assert from "node:assert/strict";
import { test } from "node:test";
import { countHumanStatusToken, HUMAN_REVIEW_REQUIRED } from "./supervisor";
import { candidateSchema, CRITERIA, type Criterion, type RunRecord, type ScoredCandidate } from "./types";
import type { FinalReviewData } from "./dashboard";
import { renderBatchReview } from "./batch-dashboard";
import {
  BATCH_CANARY_CHECKPOINT,
  BATCH_HUMAN_REVIEW_REQUIRED,
  CANARY_CHECKPOINT,
  EXISTING_COMPLETED_PRODUCT,
  READY_FOR_BATCH_REVIEW,
  SECURITY_COMPLETED_RUN_ID,
  SECURITY_PRODUCT_ID,
  additionalSuccessCount,
  applyBuildOutcome,
  batchUserFacingLines,
  canEnterBatchReview,
  createBatch,
  executeBatchBuild,
  executeBatchSubmit,
  formatCanaryCheckpoint,
  importCompletedSecurity,
  parseBatchCli,
  planBatchResume,
  selectBatchCandidates,
  type BatchDeps,
  type BatchHumanDecision,
  type BatchRecord,
} from "./batch";

const NAMES = [
  ["stalled-deal-rescue-queue", "Stalled Deal Rescue Queue"],
  ["cash-gap-planner", "13-Week Cash Gap Planner"],
  ["google-ads-performance-coach", "Google Ads Performance Coach"],
  ["next-pay-labor-check", "Next-Pay Labor Check"],
  ["lapsed-customer-return-queue", "Lapsed Customer Return Queue"],
  ["collections-follow-up-queue", "Collections Follow-Up Queue"],
  ["inventory-reorder-check", "Inventory Reorder Check"],
  ["invoice-aging-triage", "Invoice Aging Triage"],
  ["meeting-prep-brief", "Meeting Prep Brief"],
  ["vendor-renewal-watch", "Vendor Renewal Watch"],
] as const;

function scored(id: string, name: string, overall = 8): ScoredCandidate {
  const criteria = Object.fromEntries(CRITERIA.map((key) => [key, overall])) as Record<Criterion, number>;
  return {
    ...candidateSchema.parse({
      id,
      name,
      persona: "A small-business operator.",
      problem: `${name} solves a recurring operating problem.`,
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
      related_catalog_slugs: [id.split("-")[0] ?? id],
      novelty_note: name,
    }),
    rank: 1,
    scores: { criteria, rationale: {}, summary: "" },
    summary_scores: { commercial: overall, atlas_fit: overall, buildability: overall, overall },
    history_status: null,
    source: "reference-library",
  };
}

function readyReview(id: string, name: string, overall = 8.5): FinalReviewData {
  return {
    blueprintName: name,
    candidateId: id,
    specPath: `agent-specs/${id}.json`,
    taskPath: `agent-tasks/${id}-premium-build.json`,
    loopResultPath: "loop-result.json",
    disposition: HUMAN_REVIEW_REQUIRED,
    iterationsUsed: 1,
    maxIterations: 3,
    filesChanged: [`app/blueprints/${id}/page.tsx`],
    validate: "pass",
    build: "pass",
    qa: { status: "pass", passed: 12, failed: 0, skipped: 0, report: null },
    evaluator: {
      status: "executed",
      decision: "PASS",
      overall,
      reason: "pass",
      reportPath: null,
      scores: [
        { dimension: "clarity", score: overall },
        { dimension: "actionability", score: overall },
        { dimension: "smb_relevance", score: overall },
        { dimension: "ai_literacy", score: overall },
        { dimension: "safety", score: overall },
        { dimension: "setup_usability", score: overall },
        { dimension: "human_ai_boundary", score: overall },
      ],
      findings: [],
    },
    criticalIssues: [],
    sampleInput: "fictional",
    sampleOutput: "fictional",
    suggestedPriceCents: 4900,
    suggestedPaymentType: "ONE_TIME",
    commercialRationale: "One-time Premium pack.",
    requiresAuthenticatedQa: true,
    supervisor: {
      recommendation: "READY_FOR_HUMAN_REVIEW",
      classification: "NONE",
      build: "pass",
      qaPassed: 12,
      qaFailed: 0,
      qaSkipped: 0,
      authenticatedQa: "pass",
      evaluatorDecision: "PASS",
      evaluatorScore: overall,
      blockingFindings: 0,
      nonBlockingFindings: 1,
      recoveryCyclesUsed: 0,
    },
  };
}

function failedReview(id: string, name: string): FinalReviewData {
  return {
    ...readyReview(id, name),
    build: "fail",
    disposition: "HUMAN_INTERVENTION_REQUIRED",
    supervisor: {
      recommendation: "HUMAN_INTERVENTION_REQUIRED",
      classification: "PRODUCT_DEFECT",
      build: "fail",
      qaPassed: 0,
      qaFailed: 2,
      qaSkipped: 0,
      authenticatedQa: "fail",
      evaluatorDecision: null,
      evaluatorScore: null,
      blockingFindings: 1,
      nonBlockingFindings: 0,
      recoveryCyclesUsed: 2,
      intervention: "Product defect exhausted recovery.",
    },
    qa: { status: "fail", passed: 0, failed: 2, skipped: 0, report: null },
    evaluator: { ...readyReview(id, name).evaluator, status: "not_run", decision: null, overall: null },
  };
}

function securityRun(): RunRecord {
  return {
    schema_version: "atlas-auto-run-v1",
    run_id: SECURITY_COMPLETED_RUN_ID,
    mode: "full",
    branch: "private-preview",
    started_at: "2026-10-31T04:50:58.000Z",
    updated_at: "2026-10-31T05:47:28.000Z",
    phase: "READY_FOR_PREVIEW",
    research_source: "research-agent",
    scoring_source: "scoring-agent",
    research_notes: [],
    candidates: [],
    filtered_candidates: [],
    dashboard_file: null,
    dashboard_url: null,
    approval_file: "approval.json",
    approved_candidate_id: SECURITY_PRODUCT_ID,
    spec_path: "agent-specs/security-readiness-action-pack.json",
    task_path: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loop_result: "loop-result.json",
    loop_disposition: HUMAN_REVIEW_REQUIRED,
    status: "READY_FOR_PREVIEW",
    price_approval: { amount_cents: 4900, currency: "usd", payment_type: "ONE_TIME", market: "US" },
    commerce: {
      schema_version: "atlas-commerce-v1",
      run_id: SECURITY_COMPLETED_RUN_ID,
      product_slug: SECURITY_PRODUCT_ID,
      product_name: "Security Readiness Action Pack",
      suggested_price_cents: 4900,
      approved_price_cents: 4900,
      payment_type: "ONE_TIME",
      stripe_environment: "SANDBOX",
      statuses: ["READY_FOR_PREVIEW"],
      provisioning: "created",
      committed: false,
      pushed: false,
      published: false,
      decided_at: "t",
    },
    final_review_file: null,
    final_review_decision: "APPROVE_PRODUCT_AND_PRICE",
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
      recommendation: "READY_FOR_HUMAN_REVIEW",
      last_classification: "NONE",
      last_report: {
        recommendation: "READY_FOR_HUMAN_REVIEW",
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
    },
  };
}

function candidates(count = 3): ScoredCandidate[] {
  return NAMES.slice(0, count).map(([id, name], index) => scored(id, name, 8.2 - index * 0.1));
}

function deps(input: {
  candidates: ScoredCandidate[];
  build?: (candidate: ScoredCandidate) => Promise<Parameters<BatchDeps["buildCandidate"]> extends never ? never : Awaited<ReturnType<BatchDeps["buildCandidate"]>>>;
  security?: RunRecord | null;
  provision?: BatchDeps["provision"];
}): { deps: BatchDeps; built: string[]; provisioned: string[]; batches: BatchRecord[] } {
  const built: string[] = [];
  const provisioned: string[] = [];
  const batches: BatchRecord[] = [];
  return {
    built,
    provisioned,
    batches,
    deps: {
      now: () => "2026-10-31T12:00:00.000Z",
      persist: (batch) => {
        batches.push(structuredClone(batch));
      },
      persistCandidates: () => {},
      loadSecurityRun: () => input.security ?? null,
      research: async () => input.candidates,
      buildCandidate: async (candidate) => {
        built.push(candidate.id);
        if (input.build) return input.build(candidate);
        return {
          candidate_id: candidate.id,
          name: candidate.name,
          source_run_id: `run-${candidate.id}`,
          review: readyReview(candidate.id, candidate.name),
          classification: "NONE",
          rebuilt: false,
        };
      },
      provision: async (decision, product) => {
        provisioned.push(product.candidate_id);
        return input.provision ? input.provision(decision, product) : { candidate_id: product.candidate_id, status: "provisioned" };
      },
    },
  };
}

test("parseBatchCli keeps single-product args untouched", () => {
  assert.deepEqual(parseBatchCli([]), { batchSize: null, resumeBatchId: null, canarySuccessCount: null });
  assert.deepEqual(parseBatchCli(["--dry-run"]), { batchSize: null, resumeBatchId: null, canarySuccessCount: null });
  assert.equal(parseBatchCli(["--batch", "8"]).batchSize, 8);
  assert.equal(parseBatchCli(["--batch", "8"]).canarySuccessCount, null);
  assert.equal(parseBatchCli(["--resume-batch", "batch-1"]).resumeBatchId, "batch-1");
  assert.equal(parseBatchCli(["--batch", "8", "--canary", "2"]).canarySuccessCount, 2);
  assert.match(parseBatchCli(["--batch", "nope"]).error ?? "", /--batch/);
  assert.match(parseBatchCli(["--batch", "8", "--resume-batch", "x"]).error ?? "", /either/);
  assert.match(parseBatchCli(["--canary", "2"]).error ?? "", /--batch/);
  assert.match(parseBatchCli(["--batch", "8", "--canary", "8"]).error ?? "", /smaller/);
});

test("batch of 3 fully successful products reaches batch review only", async () => {
  const pool = candidates(3);
  const harness = deps({ candidates: pool });
  const started = createBatch({ batchId: "batch-3", requestedSuccessCount: 3, now: "t" });
  const result = await executeBatchBuild({ batch: started, candidates: pool, deps: harness.deps });
  assert.equal(result.humanReviewRequired, false);
  assert.equal(result.stripeInvoked, false);
  assert.equal(result.userStatus, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(additionalSuccessCount(result.batch), 3);
  assert.equal(result.batch.completed.filter((item) => item.status === READY_FOR_BATCH_REVIEW).length, 3);
  assert.deepEqual(batchUserFacingLines(result.batch), [BATCH_HUMAN_REVIEW_REQUIRED]);
  assert.equal(countHumanStatusToken(batchUserFacingLines(result.batch).join("\n"), HUMAN_REVIEW_REQUIRED), 0);
  assert.equal(harness.built.length, 3);
});

test("one product fails and remaining products continue", async () => {
  const pool = candidates(3);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: candidate.id === pool[0]!.id ? failedReview(candidate.id, candidate.name) : readyReview(candidate.id, candidate.name),
      classification: candidate.id === pool[0]!.id ? "PRODUCT_DEFECT" : "NONE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-fail-one", requestedSuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.failed.length, 1);
  assert.equal(result.batch.failed[0]?.candidate_id, pool[0]!.id);
  assert.equal(additionalSuccessCount(result.batch), 2);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(harness.built.length, 3);
  assert.equal(result.humanReviewRequired, false);
});

test("successful product does not trigger individual human review", async () => {
  const pool = candidates(1);
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-one", requestedSuccessCount: 1, now: "t" }),
    candidates: pool,
    deps: deps({ candidates: pool }).deps,
  });
  assert.equal(result.humanReviewRequired, false);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(result.batch.completed[0]?.status, READY_FOR_BATCH_REVIEW);
  assert.equal(canEnterBatchReview(readyReview(pool[0]!.id, pool[0]!.name)), true);
});

test("only fully gated products become READY_FOR_BATCH_REVIEW", () => {
  assert.equal(canEnterBatchReview(failedReview("x", "X")), false);
  const blocked = readyReview("x", "X");
  blocked.supervisor = { ...blocked.supervisor!, blockingFindings: 2, recommendation: "READY_FOR_HUMAN_REVIEW" };
  assert.equal(canEnterBatchReview(blocked), false);
  const noAuth = readyReview("x", "X");
  noAuth.supervisor = { ...noAuth.supervisor!, authenticatedQa: "fail" };
  assert.equal(canEnterBatchReview(noAuth), false);
  const noEval = readyReview("x", "X");
  noEval.evaluator.decision = "HUMAN_REVIEW_REQUIRED";
  assert.equal(canEnterBatchReview(noEval), false);
  const batch = createBatch({ batchId: "g", requestedSuccessCount: 1, now: "t" });
  const outcome = applyBuildOutcome(
    batch,
    scored("x", "Broken Product"),
    {
      candidate_id: "x",
      name: "Broken Product",
      source_run_id: "r",
      review: failedReview("x", "Broken Product"),
      classification: "PRODUCT_DEFECT",
      rebuilt: false,
    },
    "t",
  );
  assert.equal(outcome.batch.completed.length, 0);
  assert.equal(outcome.batch.failed.length, 1);
  assert.equal(outcome.humanReviewRequired, false);
});

test("no Stripe provisioning during build phase", async () => {
  const pool = candidates(2);
  const harness = deps({ candidates: pool });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-no-stripe", requestedSuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.stripeInvoked, false);
  assert.equal(result.batch.stripe_invoked_during_build, false);
  assert.equal(harness.provisioned.length, 0);
  assert.equal(result.batch.commerce_results.length, 0);
});

test("Security completed run can be imported without rebuilding", async () => {
  const pool = candidates(1);
  const harness = deps({ candidates: pool, security: securityRun() });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-security", requestedSuccessCount: 1, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  const imported = result.batch.completed.find((item) => item.candidate_id === SECURITY_PRODUCT_ID);
  assert.ok(imported);
  assert.equal(imported.status, EXISTING_COMPLETED_PRODUCT);
  assert.equal(imported.imported, true);
  assert.equal(imported.qa.passed, 137);
  assert.equal(imported.evaluator_score, 8.9);
  assert.equal(imported.suggested_price_cents, 4900);
  assert.equal(harness.built.includes(SECURITY_PRODUCT_ID), false);
  assert.equal(importCompletedSecurity({ ...securityRun(), run_id: "other" }), null);
});

test("resume does not rebuild finished candidates", async () => {
  const pool = candidates(3);
  const started = createBatch({ batchId: "batch-resume", requestedSuccessCount: 3, now: "t" });
  const first = applyBuildOutcome(
    { ...started, candidate_queue: pool.map((item) => item.id), phase: "BUILDING" },
    pool[0]!,
    {
      candidate_id: pool[0]!.id,
      name: pool[0]!.name,
      source_run_id: "run-1",
      review: readyReview(pool[0]!.id, pool[0]!.name),
      classification: "NONE",
      rebuilt: false,
    },
    "t",
  ).batch;
  const plan = planBatchResume(first);
  assert.deepEqual(plan.skipRebuildIds, [pool[0]!.id]);
  assert.equal(plan.invokeStripe, false);
  assert.equal(plan.continueBuilding, true);
  const harness = deps({ candidates: pool });
  const result = await executeBatchBuild({ batch: first, candidates: pool, deps: harness.deps });
  assert.equal(harness.built.includes(pool[0]!.id), false);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(additionalSuccessCount(result.batch), 3);
});

test("batch reaches requested success count", async () => {
  const pool = candidates(5);
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-count", requestedSuccessCount: 3, now: "t" }),
    candidates: pool,
    deps: deps({ candidates: pool }).deps,
  });
  assert.equal(additionalSuccessCount(result.batch), 3);
  assert.equal(result.batch.requested_success_count, 3);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
});

test("duplicate candidate is prevented", () => {
  const selected = selectBatchCandidates({
    candidates: [
      scored("collections-assistant", "AI Collections Assistant"),
      scored("collections-helper", "Collections Assistant"),
      scored("cash-gap-planner", "13-Week Cash Gap Planner"),
    ],
    needed: 2,
  });
  assert.equal(selected.queue.length, 2);
  assert.ok(selected.duplicatesSkipped.includes("collections-helper") || selected.queue.every((item) => item.id !== "collections-helper"));
  assert.equal(selected.queue.some((item) => item.id === SECURITY_PRODUCT_ID), false);
});

test("shared infrastructure failure stops the batch safely", async () => {
  const pool = candidates(3);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: failedReview(candidate.id, candidate.name),
      classification: "ORCHESTRATION_FAILURE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-infra", requestedSuccessCount: 3, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.phase, "STOPPED_INFRASTRUCTURE");
  assert.equal(harness.built.length, 1);
  assert.equal(result.batch.completed.length, 0);
  assert.equal(result.humanReviewRequired, false);
});

test("product-level failure does not stop unrelated products", async () => {
  const pool = candidates(3);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: candidate.id === pool[1]!.id ? failedReview(candidate.id, candidate.name) : readyReview(candidate.id, candidate.name),
      classification: candidate.id === pool[1]!.id ? "EVALUATOR_REJECTED" : "NONE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-continue", requestedSuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.failed.map((item) => item.candidate_id).includes(pool[1]!.id), true);
  assert.equal(additionalSuccessCount(result.batch), 2);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
});

test("final batch dashboard contains all READY products", async () => {
  const pool = candidates(3);
  const harness = deps({ candidates: pool, security: securityRun() });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-dash", requestedSuccessCount: 3, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  const html = renderBatchReview({
    batch: result.batch,
    state: { phase: result.batch.phase, locked: false, message: "", decisions: {}, commerce: {} },
    token: "test",
  });
  for (const product of result.batch.completed) {
    assert.match(html, new RegExp(product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(html, /EXISTING_COMPLETED_PRODUCT/);
  assert.match(html, /Security Readiness Action Pack/);
  assert.match(html, /Portfolio comparison/);
  assert.match(html, /BATCH_HUMAN_REVIEW_REQUIRED|Batch review/);
});

test("batch submit provisions only human-approved products and is idempotent", async () => {
  const pool = candidates(2);
  const harness = deps({ candidates: pool });
  const built = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-submit", requestedSuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  const decisions: BatchHumanDecision[] = [
    {
      candidate_id: pool[0]!.id,
      decision: "APPROVE",
      amount_cents: 4900,
      payment_type: "ONE_TIME",
      note: "launch",
      decided_at: "t",
    },
    {
      candidate_id: pool[1]!.id,
      decision: "REJECT",
      amount_cents: null,
      payment_type: "ONE_TIME",
      note: "drop",
      decided_at: "t",
    },
  ];
  const first = await executeBatchSubmit({ batch: built.batch, decisions, deps: harness.deps });
  assert.deepEqual(first.provisioned, [pool[0]!.id]);
  assert.ok(first.skipped.includes(pool[1]!.id));
  assert.equal(harness.provisioned.length, 1);
  const second = await executeBatchSubmit({ batch: first.batch, decisions, deps: harness.deps });
  assert.deepEqual(second.provisioned, []);
  assert.ok(second.skipped.includes(pool[0]!.id));
  assert.equal(harness.provisioned.length, 1);
});

test("rejected product never provisions and Security is reused", async () => {
  const pool = candidates(1);
  const harness = deps({ candidates: pool, security: securityRun() });
  const built = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-reject", requestedSuccessCount: 1, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  const result = await executeBatchSubmit({
    batch: built.batch,
    decisions: [
      {
        candidate_id: pool[0]!.id,
        decision: "REJECT",
        amount_cents: null,
        payment_type: "ONE_TIME",
        note: "",
        decided_at: "t",
      },
      {
        candidate_id: SECURITY_PRODUCT_ID,
        decision: "APPROVE",
        amount_cents: 4900,
        payment_type: "ONE_TIME",
        note: "keep",
        decided_at: "t",
      },
    ],
    deps: harness.deps,
  });
  assert.deepEqual(result.provisioned, []);
  assert.ok(result.skipped.includes(pool[0]!.id));
  assert.ok(result.skipped.includes(SECURITY_PRODUCT_ID));
  assert.equal(harness.provisioned.length, 0);
});

test("target 8 + canary 2 pauses after exactly 2 successful products", async () => {
  const pool = candidates(8);
  const harness = deps({ candidates: pool });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-canary", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.requested_success_count, 8);
  assert.equal(result.batch.canary_success_count, 2);
  assert.equal(result.batch.phase, CANARY_CHECKPOINT);
  assert.equal(result.userStatus, BATCH_CANARY_CHECKPOINT);
  assert.equal(additionalSuccessCount(result.batch), 2);
  assert.equal(harness.built.length, 2);
  assert.equal(result.humanReviewRequired, false);
  assert.equal(result.stripeInvoked, false);
  assert.equal(result.batch.stripe_invoked_during_build, false);
  assert.equal(harness.provisioned.length, 0);
  assert.equal(result.batch.phase === BATCH_HUMAN_REVIEW_REQUIRED, false);
  assert.equal(batchUserFacingLines(result.batch).includes(BATCH_HUMAN_REVIEW_REQUIRED), false);
  assert.deepEqual(batchUserFacingLines(result.batch), formatCanaryCheckpoint(result.batch));
  assert.match(batchUserFacingLines(result.batch).join("\n"), /Target: 8/);
  assert.match(batchUserFacingLines(result.batch).join("\n"), /Canary completed: 2/);
  assert.match(batchUserFacingLines(result.batch).join("\n"), /Stripe invoked: false/);
  assert.match(batchUserFacingLines(result.batch).join("\n"), /--resume-batch batch-canary/);
});

test("imported Security does not count toward the canary of 2", async () => {
  const pool = candidates(8);
  const harness = deps({ candidates: pool, security: securityRun() });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-canary-sec", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.completed.some((item) => item.status === EXISTING_COMPLETED_PRODUCT), true);
  assert.equal(additionalSuccessCount(result.batch), 2);
  assert.equal(result.batch.phase, CANARY_CHECKPOINT);
  assert.equal(harness.built.includes(SECURITY_PRODUCT_ID), false);
  assert.equal(harness.built.length, 2);
});

test("failed candidate does not count toward the canary of 2", async () => {
  const pool = candidates(8);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: candidate.id === pool[0]!.id ? failedReview(candidate.id, candidate.name) : readyReview(candidate.id, candidate.name),
      classification: candidate.id === pool[0]!.id ? "PRODUCT_DEFECT" : "NONE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-canary-fail", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.failed.length, 1);
  assert.equal(additionalSuccessCount(result.batch), 2);
  assert.equal(result.batch.phase, CANARY_CHECKPOINT);
  assert.equal(harness.built.length, 3);
  assert.equal(result.batch.infrastructure_failures.length, 0);
});

test("resume from canary keeps target 8 and does not rebuild the first 2", async () => {
  const pool = candidates(8);
  const harness = deps({ candidates: pool });
  const started = createBatch({ batchId: "batch-canary-resume", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" });
  const checkpoint = await executeBatchBuild({ batch: started, candidates: pool, deps: harness.deps });
  assert.equal(checkpoint.batch.phase, CANARY_CHECKPOINT);
  const plan = planBatchResume(checkpoint.batch);
  assert.equal(plan.continueBuilding, true);
  assert.equal(plan.openDashboard, false);
  assert.equal(plan.invokeStripe, false);
  assert.equal(plan.skipRebuildIds.includes(pool[0]!.id), true);
  assert.equal(plan.skipRebuildIds.includes(pool[1]!.id), true);
  const resumed = await executeBatchBuild({ batch: checkpoint.batch, candidates: pool, deps: harness.deps });
  assert.equal(resumed.batch.batch_id, started.batch_id);
  assert.equal(resumed.batch.requested_success_count, 8);
  assert.equal(resumed.batch.canary_passed, true);
  assert.equal(harness.built.filter((id) => id === pool[0]!.id).length, 1);
  assert.equal(harness.built.filter((id) => id === pool[1]!.id).length, 1);
  assert.ok(harness.built.includes(pool[2]!.id));
  assert.equal(additionalSuccessCount(resumed.batch), 8);
  assert.equal(resumed.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.deepEqual(batchUserFacingLines(resumed.batch), [BATCH_HUMAN_REVIEW_REQUIRED]);
  assert.equal(resumed.stripeInvoked, false);
});

test("infrastructure failure before canary stops safely", async () => {
  const pool = candidates(8);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: failedReview(candidate.id, candidate.name),
      classification: "ORCHESTRATION_FAILURE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-canary-infra", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.phase, "STOPPED_INFRASTRUCTURE");
  assert.equal(additionalSuccessCount(result.batch), 0);
  assert.equal(result.batch.infrastructure_failures.length, 1);
  assert.equal(result.batch.phase === CANARY_CHECKPOINT, false);
  assert.equal(harness.built.length, 1);
});

test("product defect does not trigger the infrastructure circuit breaker", async () => {
  const pool = candidates(8);
  const harness = deps({
    candidates: pool,
    build: async (candidate) => ({
      candidate_id: candidate.id,
      name: candidate.name,
      source_run_id: `run-${candidate.id}`,
      review: [pool[0]!.id, pool[1]!.id].includes(candidate.id)
        ? failedReview(candidate.id, candidate.name)
        : readyReview(candidate.id, candidate.name),
      classification: [pool[0]!.id, pool[1]!.id].includes(candidate.id) ? "PRODUCT_DEFECT" : "NONE",
      rebuilt: false,
    }),
  });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-canary-defect", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.phase, CANARY_CHECKPOINT);
  assert.equal(result.batch.failed.length, 2);
  assert.equal(result.batch.infrastructure_failures.length, 0);
  assert.equal(additionalSuccessCount(result.batch), 2);
});

test("batch mode without --canary still opens review at the full target", async () => {
  const pool = candidates(8);
  const harness = deps({ candidates: pool });
  const result = await executeBatchBuild({
    batch: createBatch({ batchId: "batch-no-canary", requestedSuccessCount: 8, now: "t" }),
    candidates: pool,
    deps: harness.deps,
  });
  assert.equal(result.batch.canary_success_count, null);
  assert.equal(result.batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.equal(additionalSuccessCount(result.batch), 8);
  assert.equal(harness.built.length, 8);
  assert.equal(result.batch.phase === CANARY_CHECKPOINT, false);
});
