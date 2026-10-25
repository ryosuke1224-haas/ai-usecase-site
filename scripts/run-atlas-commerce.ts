/**
 * Atlas Commerce v1.
 * Dry-run prints a Sandbox plan and creates nothing.
 * --import-existing records the current AI Collections Assistant Sandbox price
 * without creating another Stripe Product.
 * This script never commits, pushes, deploys, or publishes.
 */
import fs from "node:fs";
import Stripe from "stripe";
import { currentBranch } from "./atlas-agent/workspace";
import { loadRun, loadRunCandidates, readJson, runMemoryDir } from "./atlas-auto/memory";
import type { FinalReviewDecision } from "./atlas-auto/types";
import { formatRegistrySync, readMergedRegistry, saveRegistryRow } from "./atlas-commerce/save-registry";
import {
  LIVE_STRIPE_PROVISIONING_BLOCKED,
  PRICE_APPROVAL_REQUIRED,
  assertSandboxStripeKey,
  provisionSandboxProduct,
  renderProvisionPlan,
  suggestPriceCents,
  type SandboxStripe,
} from "../src/lib/payments/provision";
import type { RegistryProduct } from "../src/lib/payments/registry";

const COLLECTIONS_SLUG = "ai-collections-assistant";

function loadLocalEnv(): void {
  const file = ".env.local";
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const throwingStripe: SandboxStripe = {
  async findProductBySlug() {
    throw new Error("Stripe was called during a dry run.");
  },
  async findPrice() {
    throw new Error("Stripe was called during a dry run.");
  },
  async createProduct() {
    throw new Error("Stripe was called during a dry run.");
  },
  async createPrice() {
    throw new Error("Stripe was called during a dry run.");
  },
};

async function dryRun(runId: string): Promise<void> {
  const run = loadRun(runId);
  if (!run) fail(`Run not found: ${runMemoryDir(runId)}/run.json`);
  const finalReview = readJson<Partial<FinalReviewDecision>>(`${runMemoryDir(runId)}/final-review.json`);
  const approved = finalReview?.decision === "APPROVE_PRODUCT_AND_PRICE";
  const candidates = loadRunCandidates(runId);
  const candidate = candidates.find((item) => item.id === (run.approved_candidate_id ?? finalReview?.candidate_id));
  const slug = candidate?.id ?? run.approved_candidate_id ?? COLLECTIONS_SLUG;
  const name = candidate?.name ?? slug;
  const suggested = finalReview?.suggested_price_cents ?? suggestPriceCents(candidate?.estimated_premium_value ?? "");
  const approvedAmount = finalReview?.approved_price_cents ?? null;
  const existing = (await readMergedRegistry()).find((item) => item.product_slug === slug) ?? null;
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (key && !assertSandboxStripeKey(key).ok) {
    console.log(LIVE_STRIPE_PROVISIONING_BLOCKED);
    console.log("Created: nothing");
    process.exit(1);
  }
  if (!approved || approvedAmount == null) {
    console.log(
      renderProvisionPlan({
        blueprintName: name,
        approved: false,
        approvedAmountCents: null,
        suggestedAmountCents: suggested,
        existingMapping: Boolean(existing?.stripe_product_id),
        wouldCreateProduct: false,
        wouldCreatePrice: false,
        blockedCode: PRICE_APPROVAL_REQUIRED,
      }),
    );
    return;
  }
  const result = await provisionSandboxProduct({
    humanApproved: true,
    stripeKey: key,
    dryRun: true,
    slug,
    name,
    approvedAmountCents: approvedAmount,
    suggestedAmountCents: suggested,
    rationale: candidate?.why_pay ?? "",
    existing,
    stripe: throwingStripe,
  });
  if (!result.ok) {
    console.log(result.code);
    console.log("Created: nothing");
    process.exit(result.code === LIVE_STRIPE_PROVISIONING_BLOCKED ? 1 : 1);
  }
  console.log(
    renderProvisionPlan({
      blueprintName: name,
      approved: true,
      approvedAmountCents: approvedAmount,
      suggestedAmountCents: suggested,
      existingMapping: Boolean(existing?.stripe_product_id),
      wouldCreateProduct: result.createdProduct,
      wouldCreatePrice: result.createdPrice,
    }),
  );
}

async function importExisting(): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const sandbox = assertSandboxStripeKey(key);
  if (!sandbox.ok) {
    console.log(LIVE_STRIPE_PROVISIONING_BLOCKED);
    console.log("Created: nothing");
    process.exit(1);
  }
  const existing = (await readMergedRegistry()).find((item) => item.product_slug === COLLECTIONS_SLUG);
  if (existing?.stripe_product_id && existing.stripe_price_id) {
    console.log("Existing mapping reused.");
    console.log("Blueprint: AI Collections Assistant");
    console.log(formatRegistrySync(await saveRegistryRow(existing)));
    console.log("Created: nothing");
    return;
  }
  const priceId = process.env.STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT?.trim() ?? "";
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) {
    fail("The existing Collections Sandbox price is not configured. Nothing was created.");
  }
  const stripe = new Stripe(key);
  let productId = "";
  let amount = 0;
  try {
    const price = await stripe.prices.retrieve(priceId);
    productId = typeof price.product === "string" ? price.product : price.product.id;
    amount = price.unit_amount ?? 0;
  } catch {
    fail("Could not read the existing Sandbox price. Nothing was created.");
  }
  if (!productId.startsWith("prod_") || amount < 100) {
    fail("The existing Sandbox price could not be mapped. Nothing was created.");
  }
  const now = new Date().toISOString();
  const row: RegistryProduct = {
    product_slug: COLLECTIONS_SLUG,
    name: "AI Collections Assistant",
    stripe_product_id: productId,
    stripe_price_id: priceId,
    price_amount: amount,
    suggested_price_amount: amount,
    approved_price_amount: amount,
    currency: "usd",
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    status: "ACTIVE",
    commercial_rationale: "Imported from the existing Sandbox price. No new Stripe product was created.",
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  const supabase = await saveRegistryRow(row);
  console.log("Existing mapping imported.");
  console.log("Blueprint: AI Collections Assistant");
  console.log("Stripe Product: present");
  console.log("Stripe Price: present");
  console.log(formatRegistrySync(supabase));
  console.log("Created: nothing");
}

async function main() {
  if (currentBranch() !== "private-preview") fail("Atlas Commerce only runs on private-preview.");
  loadLocalEnv();
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (args[0] === "--import-existing") {
    await importExisting();
    return;
  }
  if (args[0] === "--dry-run" && args[1]) {
    await dryRun(args[1]);
    return;
  }
  fail("Usage: npm run atlas:commerce -- --dry-run <run-id>\n       npm run atlas:commerce -- --import-existing");
}

main().catch(() => {
  console.error("Atlas Commerce failed. Nothing was published.");
  process.exit(1);
});
