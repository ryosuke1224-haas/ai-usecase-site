import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderFinalReview, type FinalReviewData } from "../../../scripts/atlas-auto/dashboard";
import type { RunRecord } from "../../../scripts/atlas-auto/types";
import { canAccessBlueprint, getBlueprintById } from "../blueprints";
import { buildCheckoutSessionCreateParams } from "./checkout-session";
import { grantCheckoutSession, type CheckoutCompletion } from "./entitlement";
import {
  LIVE_STRIPE_PROVISIONING_BLOCKED,
  canApproveCommercialRelease,
  parseApprovedAmount,
  provisionSandboxProduct,
  renderProvisionPlan,
  suggestPriceCents,
  type SandboxStripe,
} from "./provision";
import {
  formatRegistrySync,
  missingSupabaseRegistryConfig,
  publicRegistrySyncReason,
} from "../../../scripts/atlas-commerce/save-registry";
import {
  readRegistryFile,
  resolveTrustedPriceId,
  upsertRegistryProduct,
  writeRegistryFile,
  type RegistryProduct,
} from "./registry";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function product(overrides: Partial<RegistryProduct> = {}): RegistryProduct {
  return {
    product_slug: "ai-collections-assistant",
    name: "AI Collections Assistant",
    stripe_product_id: "prod_existing",
    stripe_price_id: "price_existing",
    price_amount: 4900,
    suggested_price_amount: 2900,
    approved_price_amount: 4900,
    currency: "usd",
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    status: "ACTIVE",
    commercial_rationale: "Weekly collections queue.",
    created_at: "2026-10-10T00:00:00.000Z",
    updated_at: "2026-10-10T00:00:00.000Z",
    ...overrides,
  };
}

function fakeStripe(): SandboxStripe & { counts: { products: number; prices: number } } {
  const products: { id: string; slug: string }[] = [];
  const prices: { id: string; productId: string; amount: number }[] = [];
  const counts = { products: 0, prices: 0 };
  return {
    counts,
    async findProductBySlug(slug) {
      const found = products.find((item) => item.slug === slug);
      return found ? { id: found.id } : null;
    },
    async findPrice(productId, amountCents) {
      const found = prices.find((item) => item.productId === productId && item.amount === amountCents);
      return found ? { id: found.id } : null;
    },
    async createProduct({ slug }) {
      counts.products += 1;
      const id = "prod_test_sandbox";
      products.push({ id, slug });
      return { id };
    },
    async createPrice({ productId, amountCents }) {
      counts.prices += 1;
      const id = "price_test_sandbox";
      prices.push({ id, productId, amount: amountCents });
      return { id };
    },
  };
}

const baseProvision = {
  stripeKey: "sk_test_sandbox_only",
  dryRun: false,
  slug: "future-blueprint",
  name: "Future Blueprint",
  approvedAmountCents: 7900,
  suggestedAmountCents: 4900,
  rationale: "Saves a weekly review.",
  existing: null as RegistryProduct | null,
};

test("provisioning is blocked before human price approval", async () => {
  const stripe = fakeStripe();
  const result = await provisionSandboxProduct({
    ...baseProvision,
    humanApproved: false,
    stripe,
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "PRICE_APPROVAL_REQUIRED");
  assert.equal(stripe.counts.products, 0);
  assert.equal(stripe.counts.prices, 0);
});

test("a live Stripe key is rejected and a sandbox key is allowed", async () => {
  const live = fakeStripe();
  const blocked = await provisionSandboxProduct({
    ...baseProvision,
    humanApproved: true,
    stripeKey: "sk_live_blocked",
    stripe: live,
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, LIVE_STRIPE_PROVISIONING_BLOCKED);
  assert.equal(live.counts.products, 0);

  const sandbox = fakeStripe();
  const allowed = await provisionSandboxProduct({
    ...baseProvision,
    humanApproved: true,
    stripeKey: "sk_test_sandbox_only",
    stripe: sandbox,
  });
  assert.equal(allowed.ok, true);
  assert.equal(sandbox.counts.products, 1);
  assert.equal(sandbox.counts.prices, 1);
});

test("a dry run does not call Stripe", async () => {
  const stripe: SandboxStripe = {
    async findProductBySlug() {
      throw new Error("called");
    },
    async findPrice() {
      throw new Error("called");
    },
    async createProduct() {
      throw new Error("called");
    },
    async createPrice() {
      throw new Error("called");
    },
  };
  const result = await provisionSandboxProduct({
    ...baseProvision,
    humanApproved: true,
    dryRun: true,
    existing: product({ product_slug: "future-blueprint", price_amount: 7900, approved_price_amount: 7900 }),
    stripe,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.dryRun, true);
  assert.equal(result.createdProduct, false);
  assert.equal(result.createdPrice, false);
  assert.equal(result.row, null);
});

test("an existing mapping is reused and a repeat does not create another product", async () => {
  const stripe = fakeStripe();
  const first = await provisionSandboxProduct({ ...baseProvision, humanApproved: true, stripe });
  assert.equal(first.ok, true);
  const second = await provisionSandboxProduct({ ...baseProvision, humanApproved: true, existing: null, stripe });
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.equal(second.reused, true);
  assert.equal(second.createdProduct, false);
  assert.equal(second.createdPrice, false);
  assert.equal(stripe.counts.products, 1);
  assert.equal(stripe.counts.prices, 1);
  assert.deepEqual(second.statuses, [
    "BLUEPRINT_APPROVED",
    "PRICE_APPROVED",
    "STRIPE_PRODUCT_CREATED",
    "STRIPE_PRICE_CREATED",
    "READY_FOR_PREVIEW",
  ]);
});

test("the browser cannot choose the Stripe price and inactive products cannot be purchased", () => {
  const active = resolveTrustedPriceId("ai-collections-assistant", {
    products: [product()],
    env: { STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT: "price_fromenv" },
  });
  assert.equal(active.ok, true);
  if (!active.ok) return;
  assert.equal(active.source, "registry");
  assert.equal(active.priceId, "price_existing");

  const checkout = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: "ai-collections-assistant",
    origin: "http://localhost:3000",
    serverPriceId: active.priceId,
    clientPriceId: "price_frombrowser",
    registryStatus: "ACTIVE",
  });
  assert.equal(checkout.ok, true);
  if (!checkout.ok) return;
  assert.equal(checkout.params.line_items[0].price, "price_existing");
  assert.equal(JSON.stringify(checkout.params).includes("price_frombrowser"), false);

  const inactive = resolveTrustedPriceId("ai-collections-assistant", {
    products: [product({ status: "ARCHIVED" })],
    env: { STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT: "price_fromenv" },
  });
  assert.deepEqual(inactive, { ok: false, error: "inactive_product" });
  const blocked = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: "ai-collections-assistant",
    origin: "http://localhost:3000",
    serverPriceId: "price_fromenv",
    clientPriceId: "price_frombrowser",
    registryStatus: "DRAFT",
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.error, "inactive_product");
});

test("an active registered product can create checkout and Collections can fall back to the legacy env", () => {
  const future = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: "future-blueprint",
    origin: "http://localhost:3000",
    serverPriceId: "price_future",
    clientPriceId: "price_frombrowser",
    registryStatus: "ACTIVE",
  });
  assert.equal(future.ok, true);
  if (!future.ok) return;
  assert.equal(future.params.mode, "payment");
  assert.equal(future.params.line_items[0].price, "price_future");
  assert.equal(future.params.metadata.product_slug, "future-blueprint");

  const legacy = resolveTrustedPriceId("ai-collections-assistant", {
    products: [],
    env: { STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT: "price_legacyconfigured" },
  });
  assert.equal(legacy.ok, true);
  if (!legacy.ok) return;
  assert.equal(legacy.source, "legacy_env");
  assert.equal(legacy.priceId, "price_legacyconfigured");
});

test("entitlements still grant paid access and Daily Inbox stays free", async () => {
  const session: CheckoutCompletion = {
    id: "cs_test_future",
    payment_status: "paid",
    status: "complete",
    client_reference_id: USER_ID,
    customer: "cus_test",
    payment_intent: "pi_test",
    metadata: { atlas_user_id: USER_ID, product_slug: "future-blueprint" },
  };
  const rows = new Map<string, unknown>();
  const granted = await grantCheckoutSession(session, {
    async upsert(row) {
      rows.set(row.product_slug, row);
    },
  }, new Date(), ["future-blueprint"]);
  assert.equal(granted.granted, true);
  assert.equal(rows.size, 1);

  const starter = getBlueprintById("daily-inbox-briefing-starter-kit");
  assert.ok(starter);
  assert.equal(starter.access, "free-authenticated");
  assert.equal(canAccessBlueprint(USER_ID, starter), true);
  const daily = resolveTrustedPriceId("daily-inbox-briefing", { products: [], env: {} });
  assert.deepEqual(daily, { ok: false, error: "unknown_product" });
});

test("the local registry round-trips without printing Stripe ids in the dry-run plan", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-registry-"));
  const file = path.join(dir, "product-registry.json");
  writeRegistryFile(upsertRegistryProduct([], product()), file);
  const stored = readRegistryFile(file);
  assert.equal(stored.length, 1);
  assert.equal(stored[0]?.status, "ACTIVE");
  const plan = renderProvisionPlan({
    blueprintName: "AI Collections Assistant",
    approved: true,
    approvedAmountCents: 4900,
    suggestedAmountCents: 2900,
    existingMapping: true,
    wouldCreateProduct: false,
    wouldCreatePrice: false,
  });
  assert.match(plan, /Existing mapping: yes/);
  assert.match(plan, /Would create: nothing/);
  assert.match(plan, /Created: nothing/);
  assert.doesNotMatch(plan, /prod_|price_/);
  assert.equal(suggestPriceCents("about $79 per workflow"), 7900);
  assert.equal(canApproveCommercialRelease({ disposition: "READY_FOR_HUMAN_REVIEW", qaStatus: "pass" }), true);
  assert.equal(canApproveCommercialRelease({ disposition: "HUMAN_REVIEW_REQUIRED", qaStatus: "pass" }), false);
  assert.equal(canApproveCommercialRelease({ disposition: "READY_FOR_HUMAN_REVIEW", qaStatus: "fail" }), false);
  assert.deepEqual(parseApprovedAmount({ choice: "49" }), { ok: true, cents: 4900 });
  assert.equal(parseApprovedAmount({ choice: "custom", customDollars: "120" }).ok, true);
  assert.equal(parseApprovedAmount({ choice: "price_frombrowser" }).ok, false);
});

test("the final review asks for a human price and the registry migration blocks browser writes", () => {
  const html = renderFinalReview({
    run: { run_id: "run", branch: "private-preview" } as RunRecord,
    data: {
      blueprintName: "Sample Blueprint",
      candidateId: "sample-blueprint",
      specPath: "spec",
      taskPath: "task",
      loopResultPath: null,
      disposition: "READY_FOR_HUMAN_REVIEW",
      iterationsUsed: 1,
      maxIterations: 3,
      filesChanged: [],
      validate: "pass",
      build: "pass",
      qa: { status: "pass", passed: 1, failed: 0, skipped: 0, report: null },
      evaluator: {
        status: "executed",
        decision: "PASS",
        overall: 8.8,
        reason: "",
        reportPath: null,
        scores: [],
        findings: [],
      },
      criticalIssues: [],
      sampleInput: "in",
      sampleOutput: "out",
      suggestedPriceCents: 4900,
      suggestedPaymentType: "ONE_TIME",
      commercialRationale: "Owners pay to shorten collections follow-up.",
    } satisfies FinalReviewData,
    state: {
      phase: "AWAITING_FINAL_REVIEW",
      mode: "full",
      locked: true,
      final_locked: false,
      approved_candidate_id: "sample-blueprint",
      decisions: {},
      final_review: null,
      commerce_statuses: [],
      message: "",
    },
    token: "token",
  });
  assert.match(html, /APPROVE PRODUCT &amp; PRICE/);
  assert.match(html, /\$29/);
  assert.match(html, /\$49/);
  assert.match(html, /\$79/);
  assert.match(html, /\$99/);
  assert.match(html, /Custom/);
  assert.match(html, /REQUEST CHANGES/);
  assert.match(html, /REJECT/);
  assert.doesNotMatch(html, /sk_test_|sk_live_|service_role/);

  const sql = readFileSync("supabase/migrations/20261011000000_create_product_registry.sql", "utf8");
  assert.match(sql, /stripe_environment in \('SANDBOX'\)/);
  assert.match(sql, /status in \('DRAFT', 'ACTIVE', 'ARCHIVED'\)/);
  assert.match(sql, /payment_type in \('ONE_TIME'\)/);
  assert.match(sql, /grant select, insert, update on table public.product_registry to service_role/);
  assert.match(sql, /revoke all on table public.product_registry from public, anon, authenticated/);
  assert.doesNotMatch(sql, /for\s+insert/i);
  assert.doesNotMatch(sql, /grant\s+[^;]*to\s+authenticated/i);
  assert.doesNotMatch(sql, /drop\s+table/i);
});

test("a reused import still reports the exact Supabase sync result without secrets", () => {
  const source = readFileSync("scripts/run-atlas-commerce.ts", "utf8");
  const reuse = source.slice(source.indexOf("Existing mapping reused."), source.indexOf("Existing mapping imported."));
  const saveAt = reuse.indexOf("saveRegistryRow(existing)");
  assert.ok(saveAt > reuse.indexOf("Existing mapping reused."));
  assert.ok(reuse.lastIndexOf("return;") > saveAt);
  assert.match(reuse, /formatRegistrySync/);
  assert.doesNotMatch(reuse, /stripe\.products\.create|stripe\.prices\.create/);

  assert.equal(missingSupabaseRegistryConfig({}), "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set.");
  assert.equal(
    missingSupabaseRegistryConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" }),
    "SUPABASE_SERVICE_ROLE_KEY is not set.",
  );
  assert.equal(
    formatRegistrySync({ status: "skipped", reason: "SUPABASE_SERVICE_ROLE_KEY is not set." }),
    "Supabase registry skipped: SUPABASE_SERVICE_ROLE_KEY is not set.",
  );
  assert.equal(formatRegistrySync({ status: "updated" }), "Supabase registry updated.");

  const reason = publicRegistrySyncReason(
    "Invalid key sb_secret_example sk_test_example price_abc123 prod_def456 eyJaaaaaaaaaa.bbbbbbbbbb.cccccccccc",
    {},
  );
  assert.match(reason, /Invalid key/);
  assert.doesNotMatch(reason, /sb_secret_example|sk_test_example|price_abc123|prod_def456|eyJaaaaaaaaaa/);
});
