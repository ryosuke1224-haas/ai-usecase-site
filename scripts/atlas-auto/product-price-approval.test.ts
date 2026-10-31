import assert from "node:assert/strict";
import { test } from "node:test";
import type { FinalReviewData } from "./dashboard";
import {
  PRICE_APPROVED,
  READY_FOR_PREVIEW,
  applyCommerceOutcome,
  executeProductPriceApproval,
  formatApprovalCli,
  looksLikeSecret,
  persistHumanPriceApproval,
  planProductPriceResume,
  recoverApprovedAmountCents,
  reconcileCompletedApproval,
  type ApprovalDeps,
} from "./product-price-approval";
import type { RunRecord } from "./types";
import { HUMAN_REVIEW_REQUIRED } from "./supervisor";
import type { RegistryProduct } from "../../src/lib/payments/registry";
import type { ProvisionResult, SandboxStripe } from "../../src/lib/payments/provision";

const SLUG = "security-readiness-action-pack";

function readyData(): FinalReviewData {
  return {
    blueprintName: "Security Readiness Action Pack",
    candidateId: SLUG,
    specPath: "agent-specs/security-readiness-action-pack.json",
    taskPath: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loopResultPath: "loop-result.json",
    disposition: HUMAN_REVIEW_REQUIRED,
    iterationsUsed: 1,
    maxIterations: 3,
    filesChanged: [],
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
    approval_file: "approval.json",
    approved_candidate_id: SLUG,
    spec_path: "agent-specs/security-readiness-action-pack.json",
    task_path: "agent-tasks/security-readiness-action-pack-premium-build.json",
    loop_result: "loop-result.json",
    loop_disposition: HUMAN_REVIEW_REQUIRED,
    status: HUMAN_REVIEW_REQUIRED,
    final_review_file: null,
    final_review_decision: null,
    commerce: null,
    builder_ran: true,
    committed: false,
    pushed: false,
    published: false,
    notes: [],
    ...overrides,
  };
}

function okProvision(reused = false): ProvisionResult {
  return {
    ok: true,
    dryRun: false,
    createdProduct: !reused,
    createdPrice: !reused,
    reused,
    statuses: ["BLUEPRINT_APPROVED", "PRICE_APPROVED", "STRIPE_PRODUCT_CREATED", "STRIPE_PRICE_CREATED", "READY_FOR_PREVIEW"],
    row: {
      product_slug: SLUG,
      name: "Security Readiness Action Pack",
      market: "US",
      locale: "en",
      stripe_product_id: "prod_test",
      stripe_price_id: "price_test",
      price_amount: 4900,
      suggested_price_amount: 4900,
      approved_price_amount: 4900,
      currency: "usd",
      payment_type: "ONE_TIME",
      stripe_environment: "SANDBOX",
      status: "ACTIVE",
      commercial_rationale: "test",
      created_at: "t",
      updated_at: "t",
    },
  };
}

function fakeStripe(): SandboxStripe & { products: number; prices: number } {
  const state = { products: 0, prices: 0 };
  return {
    products: 0,
    prices: 0,
    async findProductBySlug() {
      return state.products > 0 ? { id: "prod_test" } : null;
    },
    async findPrice() {
      return state.prices > 0 ? { id: "price_test" } : null;
    },
    async createProduct() {
      state.products += 1;
      this.products = state.products;
      return { id: "prod_test" };
    },
    async createPrice() {
      state.prices += 1;
      this.prices = state.prices;
      return { id: "price_test" };
    },
  };
}

function deps(overrides: Partial<ApprovalDeps> = {}): ApprovalDeps & { provisioned: number; persisted: RunRecord[]; registry: RegistryProduct[] } {
  const registry: RegistryProduct[] = [];
  const persisted: RunRecord[] = [];
  const extra = { provisioned: 0, persisted, registry };
  return Object.assign(
    extra,
    {
      now: () => "2026-10-31T05:38:25.000Z",
      selectAccount: () => ({ ok: true as const, key: "sk_test_sandbox_only", envName: "STRIPE_SECRET_KEY" }),
      provision: async () => {
        extra.provisioned += 1;
        return okProvision();
      },
      readRegistry: async () => registry,
      saveRegistry: async (row: RegistryProduct) => {
        registry.splice(0, registry.length, row);
        return { status: "updated" as const };
      },
      createStripe: () => fakeStripe(),
      persistRun: (run: RunRecord) => {
        persisted.push({ ...run, commerce: run.commerce, commerce_result: run.commerce_result, human_decision: run.human_decision, price_approval: run.price_approval });
      },
    } satisfies ApprovalDeps,
    overrides,
  );
}

test("APPROVE_PRODUCT_AND_PRICE persists the human decision and $49 as 4900 cents", async () => {
  const run = awaitingRun();
  const result = await executeProductPriceApproval({
    run,
    data: readyData(),
    cents: 4900,
    note: "approved at suggested price",
    dryRun: false,
    deps: deps(),
  });
  assert.equal(result.ok, true);
  assert.equal(run.human_decision?.action, "APPROVE_PRODUCT_AND_PRICE");
  assert.equal(run.price_approval?.amount_cents, 4900);
  assert.equal(run.price_approval?.currency, "usd");
  assert.equal(run.price_approval?.payment_type, "ONE_TIME");
  assert.equal(run.final_review_decision, "APPROVE_PRODUCT_AND_PRICE");
});

test("Stripe Sandbox provisioning is invoked and success persists commerce + READY_FOR_PREVIEW", async () => {
  const run = awaitingRun();
  const io = deps();
  const result = await executeProductPriceApproval({ run, data: readyData(), cents: 4900, note: "", dryRun: false, deps: io });
  assert.equal(result.ok, true);
  assert.equal(io.provisioned, 1);
  assert.equal(run.commerce_result?.status, "provisioned");
  assert.equal(run.commerce_result?.product_slug, SLUG);
  assert.equal(run.commerce_result?.amount_cents, 4900);
  assert.equal(run.commerce_result?.environment, "SANDBOX");
  assert.equal(run.status, READY_FOR_PREVIEW);
  assert.equal(run.phase, READY_FOR_PREVIEW);
  assert.equal(run.commerce?.approved_price_cents, 4900);
  assert.ok(io.persisted.some((row) => row.human_decision?.action === "APPROVE_PRODUCT_AND_PRICE" && row.phase !== READY_FOR_PREVIEW));
});

test("missing Sandbox key fails safely and does not claim READY_FOR_PREVIEW", async () => {
  const run = awaitingRun();
  const result = await executeProductPriceApproval({
    run,
    data: readyData(),
    cents: 4900,
    note: "",
    dryRun: false,
    deps: deps({
      selectAccount: () => ({ ok: false, code: "STRIPE_NOT_CONFIGURED", envName: "STRIPE_SECRET_KEY" }),
      provision: async () => {
        throw new Error("Stripe must not be called");
      },
    }),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error, "STRIPE_NOT_CONFIGURED");
  assert.equal(run.human_decision?.action, "APPROVE_PRODUCT_AND_PRICE");
  assert.equal(run.price_approval?.amount_cents, 4900);
  assert.equal(run.commerce_result?.status, "failed");
  assert.equal(run.status, PRICE_APPROVED);
  assert.notEqual(run.phase, READY_FOR_PREVIEW);
});

test("sk_live key remains blocked", async () => {
  const run = awaitingRun();
  const result = await executeProductPriceApproval({
    run,
    data: readyData(),
    cents: 4900,
    note: "",
    dryRun: false,
    deps: deps({
      selectAccount: () => ({ ok: false, code: "LIVE_STRIPE_PROVISIONING_BLOCKED", envName: "STRIPE_SECRET_KEY" }),
    }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "LIVE_STRIPE_PROVISIONING_BLOCKED");
  assert.notEqual(run.phase, READY_FOR_PREVIEW);
  assert.equal(run.human_decision?.action, "APPROVE_PRODUCT_AND_PRICE");
});

test("existing Stripe product/price is reused and repeated approval is idempotent", async () => {
  const run = awaitingRun();
  const existing: RegistryProduct = {
    product_slug: SLUG,
    name: "Security Readiness Action Pack",
    market: "US",
    locale: "en",
    stripe_product_id: "prod_existing",
    stripe_price_id: "price_existing",
    price_amount: 4900,
    suggested_price_amount: 4900,
    approved_price_amount: 4900,
    currency: "usd",
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    status: "ACTIVE",
    commercial_rationale: "test",
    created_at: "t",
    updated_at: "t",
  };
  let calls = 0;
  const io = deps({
    readRegistry: async () => [existing],
    provision: async (input) => {
      calls += 1;
      assert.equal(input.existing?.stripe_product_id, "prod_existing");
      return okProvision(true);
    },
  });
  const first = await executeProductPriceApproval({ run, data: readyData(), cents: 4900, note: "", dryRun: false, deps: io });
  const second = await executeProductPriceApproval({ run, data: readyData(), cents: 4900, note: "", dryRun: false, deps: io });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(calls, 2);
  assert.equal(run.commerce_result?.status, "reused");
  assert.equal(run.commerce?.provisioning, "reused");
});

test("resume retries commerce only and does not reopen Builder/QA/Evaluator", () => {
  const run = awaitingRun({
    status: PRICE_APPROVED,
    human_decision: { action: "APPROVE_PRODUCT_AND_PRICE", decided_at: "t", note: "" },
    price_approval: { amount_cents: 4900, currency: "usd", payment_type: "ONE_TIME", market: "US" },
    final_review_decision: "APPROVE_PRODUCT_AND_PRICE",
    commerce_result: { status: "failed", product_slug: SLUG, market: "US", environment: "SANDBOX", currency: "usd", amount_cents: 4900, payment_type: "ONE_TIME", registry_mapping: "unchanged", code: "STRIPE_NOT_CONFIGURED" },
  });
  const plan = planProductPriceResume(run, { decision: "APPROVE_PRODUCT_AND_PRICE", approved_price_cents: 4900 });
  assert.equal(plan.kind, "commerce_retry");
  assert.equal(plan.invokeStripe, true);
  assert.equal(plan.invokeBuilder, false);
  assert.equal(plan.invokeQa, false);
  assert.equal(plan.invokeEvaluator, false);
  assert.equal(plan.amountCents, 4900);
});

test("completed approval is recovered without inventing an amount", () => {
  const run = awaitingRun({
    phase: READY_FOR_PREVIEW,
    status: HUMAN_REVIEW_REQUIRED,
    final_review_decision: "APPROVE_PRODUCT_AND_PRICE",
    commerce: {
      schema_version: "atlas-commerce-v1",
      run_id: "20261031T045058Z",
      product_slug: SLUG,
      product_name: "Security Readiness Action Pack",
      suggested_price_cents: 4900,
      approved_price_cents: 4900,
      payment_type: "ONE_TIME",
      stripe_environment: "SANDBOX",
      statuses: ["BLUEPRINT_APPROVED", "PRICE_APPROVED", "STRIPE_PRODUCT_CREATED", "STRIPE_PRICE_CREATED", "READY_FOR_PREVIEW"],
      provisioning: "created",
      committed: false,
      pushed: false,
      published: false,
      decided_at: "2026-10-31T05:38:25.950Z",
    },
  });
  assert.equal(recoverApprovedAmountCents({ commerce: run.commerce, finalReview: { decision: "APPROVE_PRODUCT_AND_PRICE", approved_price_cents: 4900 } }), 4900);
  assert.equal(recoverApprovedAmountCents({}), null);
  assert.equal(reconcileCompletedApproval(run, { schema_version: "atlas-auto-final-review-v1", run_id: run.run_id, candidate_id: SLUG, decision: "APPROVE_PRODUCT_AND_PRICE", note: "", decided_at: "t", published: false, committed: false, approved_price_cents: 4900 }), true);
  assert.equal(run.status, READY_FOR_PREVIEW);
  assert.equal(run.phase, READY_FOR_PREVIEW);
  assert.equal(run.human_decision?.action, "APPROVE_PRODUCT_AND_PRICE");
  assert.equal(run.price_approval?.amount_cents, 4900);
  assert.equal(run.commerce_result?.status, "provisioned");
});

test("secret values never appear in run or CLI output", async () => {
  const run = awaitingRun();
  await executeProductPriceApproval({
    run,
    data: readyData(),
    cents: 4900,
    note: "note with sk_test_leakkey123 and whsec_leakkey123",
    dryRun: false,
    deps: deps(),
  });
  const dumped = `${JSON.stringify(run.human_decision)}${JSON.stringify(run.commerce_result)}${formatApprovalCli(run).join("\n")}`;
  assert.equal(looksLikeSecret(dumped), false);
  assert.equal(dumped.includes("sk_live_"), false);
  assert.equal(formatApprovalCli(run).some((line) => looksLikeSecret(line)), false);
});

test("persist happens before a failed provision", () => {
  const run = awaitingRun();
  persistHumanPriceApproval(run, { cents: 4900, note: "", at: "t", slug: SLUG });
  applyCommerceOutcome(run, {
    result: { ok: false, code: "STRIPE_NOT_CONFIGURED" },
    cents: 4900,
    slug: SLUG,
    name: "Security Readiness Action Pack",
    suggestedCents: 4900,
    at: "t",
    dryRun: false,
    registry: "unchanged",
  });
  assert.equal(run.human_decision?.action, "APPROVE_PRODUCT_AND_PRICE");
  assert.equal(run.status, PRICE_APPROVED);
  assert.notEqual(run.phase, READY_FOR_PREVIEW);
});
