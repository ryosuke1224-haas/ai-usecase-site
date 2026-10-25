import type { LocaleCode, MarketCode, RegistryCurrency, RegistryProduct, StripeEnvironment } from "./registry";

export const LIVE_STRIPE_PROVISIONING_BLOCKED = "LIVE_STRIPE_PROVISIONING_BLOCKED";
export const PRICE_APPROVAL_REQUIRED = "PRICE_APPROVAL_REQUIRED";

export const PRICE_CHOICES_CENTS = [2900, 4900, 7900, 9900] as const;

export const COMMERCE_STATUSES = [
  "BLUEPRINT_APPROVED",
  "PRICE_APPROVED",
  "STRIPE_PRODUCT_CREATED",
  "STRIPE_PRICE_CREATED",
  "READY_FOR_PREVIEW",
  "PRODUCTION_APPROVED",
  "PUBLISHED",
] as const;

export type CommerceStatus = (typeof COMMERCE_STATUSES)[number];

export function suggestPriceCents(estimated: string): number {
  const match = estimated.match(/\$\s*(\d{1,4})(?:\.\d{2})?/);
  if (!match) return 4900;
  const dollars = Number(match[1]);
  let best: (typeof PRICE_CHOICES_CENTS)[number] = 4900;
  let distance = Number.POSITIVE_INFINITY;
  for (const cents of PRICE_CHOICES_CENTS) {
    const next = Math.abs(cents / 100 - dollars);
    if (next < distance) {
      distance = next;
      best = cents;
    }
  }
  return best;
}

export function parseApprovedAmount(input: {
  choice?: unknown;
  customDollars?: unknown;
}): { ok: true; cents: number } | { ok: false; error: string } {
  const choice = typeof input.choice === "string" ? input.choice : "";
  if ((PRICE_CHOICES_CENTS as readonly number[]).includes(Number(choice) * 100) && /^\d+$/.test(choice)) {
    return { ok: true, cents: Number(choice) * 100 };
  }
  if (choice === "custom") {
    const raw = typeof input.customDollars === "string" ? input.customDollars.trim() : "";
    if (!/^\d{1,3}$/.test(raw)) return { ok: false, error: "Enter a whole dollar amount from 1 to 999." };
    const dollars = Number(raw);
    if (dollars < 1 || dollars > 999) return { ok: false, error: "Enter a whole dollar amount from 1 to 999." };
    return { ok: true, cents: dollars * 100 };
  }
  return { ok: false, error: "Choose a price before approving." };
}

export function formatUsd(cents: number): string {
  return `$${cents / 100}`;
}

export function canApproveCommercialRelease(input: { disposition: string; qaStatus: string }): boolean {
  return input.disposition === "READY_FOR_HUMAN_REVIEW" && input.qaStatus === "pass";
}

export function assertSandboxStripeKey(key: string): { ok: true } | { ok: false; code: typeof LIVE_STRIPE_PROVISIONING_BLOCKED } {
  const trimmed = key.trim();
  if (trimmed.startsWith("sk_test_") || trimmed.startsWith("rk_test_")) return { ok: true };
  return { ok: false, code: LIVE_STRIPE_PROVISIONING_BLOCKED };
}

export type SandboxStripe = {
  findProductBySlug(slug: string, market?: MarketCode): Promise<{ id: string } | null>;
  findPrice(productId: string, amountCents: number, currency?: RegistryCurrency): Promise<{ id: string } | null>;
  createProduct(input: { name: string; slug: string; market?: MarketCode; locale?: LocaleCode }): Promise<{ id: string }>;
  createPrice(input: {
    productId: string;
    amountCents: number;
    slug: string;
    currency?: RegistryCurrency;
    market?: MarketCode;
  }): Promise<{ id: string }>;
};

export type ProvisionResult =
  | {
      ok: true;
      dryRun: boolean;
      createdProduct: boolean;
      createdPrice: boolean;
      reused: boolean;
      statuses: CommerceStatus[];
      row: RegistryProduct | null;
    }
  | {
      ok: false;
      code: typeof LIVE_STRIPE_PROVISIONING_BLOCKED | typeof PRICE_APPROVAL_REQUIRED | "STRIPE_NOT_CONFIGURED" | "INVALID_AMOUNT";
      createdProduct: false;
      createdPrice: false;
    };

const READY: CommerceStatus[] = [
  "BLUEPRINT_APPROVED",
  "PRICE_APPROVED",
  "STRIPE_PRODUCT_CREATED",
  "STRIPE_PRICE_CREATED",
  "READY_FOR_PREVIEW",
];

type ProvisionScope = {
  market: MarketCode;
  locale: LocaleCode;
  currency: RegistryCurrency;
  environment: StripeEnvironment;
};

function provisionScope(input: Partial<ProvisionScope>): ProvisionScope {
  return {
    market: input.market ?? "US",
    locale: input.locale ?? "en",
    currency: input.currency ?? "usd",
    environment: input.environment ?? "SANDBOX",
  };
}

function amountIsValid(currency: RegistryCurrency, amount: number): boolean {
  if (!Number.isInteger(amount)) return false;
  if (currency === "jpy") return amount >= 50 && amount <= 9_999_999;
  return amount >= 100 && amount <= 99_900;
}

/** A US Sandbox row must not be reused as the Japan price, or the reverse. */
function alignedExisting(existing: RegistryProduct | null, slug: string, scope: ProvisionScope): RegistryProduct | null {
  if (!existing) return null;
  if (existing.product_slug !== slug) return null;
  if ((existing.market ?? "US") !== scope.market) return null;
  if ((existing.locale ?? "en") !== scope.locale) return null;
  if ((existing.currency ?? "usd") !== scope.currency) return null;
  if ((existing.stripe_environment ?? "SANDBOX") !== scope.environment) return null;
  return existing;
}

export async function provisionSandboxProduct(input: {
  humanApproved: boolean;
  stripeKey: string;
  dryRun: boolean;
  slug: string;
  name: string;
  approvedAmountCents: number;
  suggestedAmountCents: number;
  rationale: string;
  existing: RegistryProduct | null;
  stripe: SandboxStripe;
  market?: MarketCode;
  locale?: LocaleCode;
  currency?: RegistryCurrency;
  environment?: StripeEnvironment;
  now?: Date;
}): Promise<ProvisionResult> {
  const scope = provisionScope(input);
  if (scope.environment !== "SANDBOX") {
    return { ok: false, code: LIVE_STRIPE_PROVISIONING_BLOCKED, createdProduct: false, createdPrice: false };
  }
  const existing = alignedExisting(input.existing, input.slug, scope);
  const scoped = { ...input, ...scope, existing };
  if (!input.humanApproved) {
    return { ok: false, code: PRICE_APPROVAL_REQUIRED, createdProduct: false, createdPrice: false };
  }
  if (!amountIsValid(scope.currency, input.approvedAmountCents)) {
    return { ok: false, code: "INVALID_AMOUNT", createdProduct: false, createdPrice: false };
  }
  const key = input.stripeKey.trim();
  if (!key) {
    if (input.dryRun) return dryPlan(scoped, mappedProductId(scoped), mappedPriceId(scoped));
    return { ok: false, code: "STRIPE_NOT_CONFIGURED", createdProduct: false, createdPrice: false };
  }
  const sandbox = assertSandboxStripeKey(key);
  if (!sandbox.ok) {
    return { ok: false, code: sandbox.code, createdProduct: false, createdPrice: false };
  }

  if (input.dryRun) return dryPlan(scoped, mappedProductId(scoped), mappedPriceId(scoped));

  let productId = existing?.stripe_product_id ?? null;
  let createdProduct = false;
  if (!productId) {
    const found = await input.stripe.findProductBySlug(input.slug, scope.market);
    productId = found?.id ?? null;
  }
  if (!productId) {
    productId = (
      await input.stripe.createProduct({
        name: input.name,
        slug: input.slug,
        market: scope.market,
        locale: scope.locale,
      })
    ).id;
    createdProduct = true;
  }

  let priceId =
    existing?.stripe_price_id && existing.price_amount === input.approvedAmountCents ? existing.stripe_price_id : null;
  let createdPrice = false;
  if (!priceId) {
    const found = await input.stripe.findPrice(productId, input.approvedAmountCents, scope.currency);
    priceId = found?.id ?? null;
  }
  if (!priceId) {
    priceId = (
      await input.stripe.createPrice({
        productId,
        amountCents: input.approvedAmountCents,
        slug: input.slug,
        currency: scope.currency,
        market: scope.market,
      })
    ).id;
    createdPrice = true;
  }

  const now = (input.now ?? new Date()).toISOString();
  return {
    ok: true,
    dryRun: false,
    createdProduct,
    createdPrice,
    reused: !createdProduct && !createdPrice,
    statuses: READY,
    row: registryRow(scoped, productId, priceId, now),
  };
}

function mappedProductId(input: { existing: RegistryProduct | null }): string | null {
  return input.existing?.stripe_product_id ?? null;
}

function mappedPriceId(input: { existing: RegistryProduct | null; approvedAmountCents: number }): string | null {
  if (!input.existing?.stripe_price_id) return null;
  return input.existing.price_amount === input.approvedAmountCents ? input.existing.stripe_price_id : null;
}

function dryPlan(
  input: {
    slug: string;
    name: string;
    approvedAmountCents: number;
    suggestedAmountCents: number;
    rationale: string;
    existing: RegistryProduct | null;
    market: MarketCode;
    locale: LocaleCode;
    currency: RegistryCurrency;
    environment: StripeEnvironment;
  },
  productId: string | null,
  priceId: string | null,
): ProvisionResult {
  const createdProduct = !productId;
  const createdPrice = !priceId;
  return {
    ok: true,
    dryRun: true,
    createdProduct,
    createdPrice,
    reused: !createdProduct && !createdPrice,
    statuses: ["BLUEPRINT_APPROVED", "PRICE_APPROVED"],
    row: null,
  };
}

function registryRow(
  input: {
    slug: string;
    name: string;
    approvedAmountCents: number;
    suggestedAmountCents: number;
    rationale: string;
    existing: RegistryProduct | null;
    market: MarketCode;
    locale: LocaleCode;
    currency: RegistryCurrency;
    environment: StripeEnvironment;
  },
  productId: string,
  priceId: string,
  now: string,
): RegistryProduct {
  return {
    product_slug: input.slug,
    name: input.name,
    market: input.market,
    locale: input.locale,
    stripe_product_id: productId,
    stripe_price_id: priceId,
    price_amount: input.approvedAmountCents,
    suggested_price_amount: input.suggestedAmountCents,
    approved_price_amount: input.approvedAmountCents,
    currency: input.currency,
    payment_type: "ONE_TIME",
    stripe_environment: input.environment,
    status: "ACTIVE",
    commercial_rationale: input.rationale.slice(0, 2000),
    created_at: input.existing?.created_at ?? now,
    updated_at: now,
  };
}

export function renderProvisionPlan(input: {
  blueprintName: string;
  approved: boolean;
  approvedAmountCents: number | null;
  suggestedAmountCents: number | null;
  existingMapping: boolean;
  wouldCreateProduct: boolean;
  wouldCreatePrice: boolean;
  blockedCode?: string;
}): string {
  if (!input.approved || input.blockedCode) {
    return [
      "Provisioning blocked before human price approval.",
      input.blockedCode ? `Code: ${input.blockedCode}` : "Code: PRICE_APPROVAL_REQUIRED",
      `Blueprint: ${input.blueprintName}`,
      "Created: nothing",
    ].join("\n");
  }
  const amount = input.approvedAmountCents == null ? "not approved" : `${formatUsd(input.approvedAmountCents)} USD one-time`;
  const suggestion = input.suggestedAmountCents == null ? "none" : formatUsd(input.suggestedAmountCents);
  const create =
    input.wouldCreateProduct ? "Stripe Product and Price" : input.wouldCreatePrice ? "Stripe Price on the existing Product" : "nothing";
  return [
    `Approved blueprint: ${input.blueprintName}`,
    `Proposed Stripe Product: ${input.blueprintName}`,
    `Agent suggestion: ${suggestion}`,
    `Approved amount: ${amount}`,
    `Existing mapping: ${input.existingMapping ? "yes" : "no"}`,
    `Would create: ${create}`,
    "Created: nothing",
  ].join("\n");
}
