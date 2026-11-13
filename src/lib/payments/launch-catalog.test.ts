import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { blueprintCatalog } from "../blueprints";
import { checkoutGate } from "./checkout-gate";
import { buildCheckoutSessionCreateParams } from "./checkout-session";
import { entitlementFromCheckout, type CheckoutCompletion } from "./entitlement";
import {
  LAUNCH_JPY_AMOUNT,
  LAUNCH_PRODUCTS,
  LAUNCH_USD_CENTS,
  launchRegistryRows,
} from "./launch-catalog";
import { formatCheckoutPrice } from "./preview-market";
import { LIVE_STRIPE_PROVISIONING_BLOCKED, provisionSandboxProduct } from "./provision";
import { getPaidProduct, productCommercePaths } from "./products";
import { mergeRegistryProducts, resolveTrustedPriceId } from "./registry";

const USER_ID = "11111111-1111-4111-8111-111111111111";

test("all 11 launch products share one flat one-time sandbox price", () => {
  assert.equal(LAUNCH_PRODUCTS.length, 11);
  const rows = launchRegistryRows();
  assert.equal(rows.length, 22);
  for (const item of LAUNCH_PRODUCTS) {
    const product = getPaidProduct(item.slug);
    assert.equal(product?.slug, item.slug);
    assert.equal(product?.accessType, "lifetime");
    assert.equal(product?.priceEnv, undefined);
    const card = blueprintCatalog.find((entry) => entry.productSlug === item.slug);
    assert.equal(card?.id, item.slug);
    assert.equal(card?.access, "premium");
    const usd = rows.find((row) => row.product_slug === item.slug && row.currency === "usd");
    const jpy = rows.find((row) => row.product_slug === item.slug && row.currency === "jpy");
    assert.equal(usd?.price_amount, LAUNCH_USD_CENTS);
    assert.equal(usd?.approved_price_amount, 4900);
    assert.equal(usd?.market, "US");
    assert.equal(usd?.locale, "en");
    assert.equal(jpy?.price_amount, LAUNCH_JPY_AMOUNT);
    assert.equal(jpy?.approved_price_amount, 7980);
    assert.equal(jpy?.market, "JP");
    assert.equal(jpy?.locale, "ja");
    for (const row of [usd, jpy]) {
      assert.equal(row?.payment_type, "ONE_TIME");
      assert.equal(row?.stripe_environment, "SANDBOX");
      assert.equal(row?.status, "ACTIVE");
      assert.equal(row?.stripe_price_id, null);
      assert.equal(row?.stripe_product_id, null);
    }
  }
  assert.equal(formatCheckoutPrice(LAUNCH_USD_CENTS, "usd"), "$49");
  assert.equal(formatCheckoutPrice(LAUNCH_JPY_AMOUNT, "jpy"), "¥7,980");
  assert.equal(rows.some((row) => row.stripe_environment !== "SANDBOX"), false);
});

test("english and japanese checkout use the same product and return to that locale", () => {
  const slug = "quote-request-assistant";
  const products = mergeRegistryProducts(launchRegistryRows(), [
    {
      ...launchRegistryRows().find((row) => row.product_slug === slug && row.currency === "usd")!,
      stripe_price_id: "price_sandboxusd",
    },
    {
      ...launchRegistryRows().find((row) => row.product_slug === slug && row.currency === "jpy")!,
      stripe_price_id: "price_sandboxjpy",
    },
  ]);
  const usd = resolveTrustedPriceId(slug, { products, market: "US", locale: "en", currency: "usd", environment: "SANDBOX" });
  const jpy = resolveTrustedPriceId(slug, { products, market: "JP", locale: "ja", currency: "jpy", environment: "SANDBOX" });
  assert.deepEqual(usd, { ok: true, priceId: "price_sandboxusd", source: "registry" });
  assert.deepEqual(jpy, { ok: true, priceId: "price_sandboxjpy", source: "registry" });

  const missing = resolveTrustedPriceId(slug, { products: launchRegistryRows() });
  assert.deepEqual(missing, { ok: false, error: "missing_price" });

  const english = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: slug,
    origin: "https://preview.example",
    serverPriceId: "price_sandboxusd",
    clientPriceId: "price_frombrowser",
    registryStatus: "ACTIVE",
  });
  const japanese = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: slug,
    origin: "https://preview.example",
    serverPriceId: "price_sandboxjpy",
    registryStatus: "ACTIVE",
    successPath: productCommercePaths(slug, "ja")?.success,
    cancelPath: productCommercePaths(slug, "ja")?.demo,
  });
  assert.equal(english.ok && english.params.mode, "payment");
  assert.equal(english.ok && english.params.metadata.product_slug, slug);
  assert.equal(english.ok && english.params.line_items[0].price, "price_sandboxusd");
  assert.equal(
    english.ok && english.params.success_url,
    "https://preview.example/blueprints/quote-request-assistant/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(
    japanese.ok && japanese.params.success_url,
    "https://preview.example/ja/blueprints/quote-request-assistant/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  );
  assert.equal(japanese.ok && japanese.params.cancel_url, "https://preview.example/ja/blueprints/quote-request-assistant");
  assert.equal(japanese.ok && japanese.params.metadata.product_slug, slug);
});

test("paid checkout grants the canonical slug and an owned buyer is not sent to checkout again", () => {
  const slug = "ai-payroll-forecasting";
  const session: CheckoutCompletion = {
    id: "cs_test_launch",
    payment_status: "paid",
    status: "complete",
    client_reference_id: USER_ID,
    customer: "cus_test",
    payment_intent: "pi_test",
    metadata: { atlas_user_id: USER_ID, product_slug: slug },
  };
  const granted = entitlementFromCheckout(session, new Date("2026-11-10T00:00:00.000Z"), [slug]);
  assert.equal("ok" in granted && granted.entitlement.product_slug, slug);
  assert.equal("ok" in granted && granted.entitlement.access_type, "lifetime");
  assert.equal("ok" in granted && granted.entitlement.stripe_subscription_id, null);

  const card = blueprintCatalog.find((entry) => entry.productSlug === slug);
  const active = new Set([slug]);
  const unlocked = card?.access === "free-authenticated" || (card?.productSlug ? active.has(card.productSlug) : false);
  assert.equal(unlocked, true);

  const loggedOut = checkoutGate({ productSlug: slug, uiLocale: "ja", signedIn: false, alreadyOwned: false });
  assert.equal(loggedOut.kind, "sign-in");
  if (loggedOut.kind === "sign-in") {
    assert.match(loggedOut.location, /^\/ja\/auth\?/);
    assert.match(loggedOut.location, /next=%2Fja%2Fblueprints%2Fai-payroll-forecasting$/);
  }
  const owned = checkoutGate({ productSlug: slug, uiLocale: null, signedIn: true, alreadyOwned: true });
  assert.deepEqual(owned, { kind: "owned", location: "/blueprints/ai-payroll-forecasting/kit" });
  const japaneseOwned = checkoutGate({ productSlug: slug, uiLocale: "ja", signedIn: true, alreadyOwned: true });
  assert.deepEqual(japaneseOwned, { kind: "owned", location: "/ja/blueprints/ai-payroll-forecasting/kit" });
});

test("launch provisioning stays in sandbox and does not create a live price", async () => {
  const stripeServer = readFileSync("src/lib/stripe/server.ts", "utf8");
  assert.match(stripeServer, /environment: "SANDBOX"/);
  assert.doesNotMatch(stripeServer, /environment: "LIVE"/);
  const success = readFileSync("app/blueprints/[slug]/checkout/success/page.tsx", "utf8");
  assert.match(success, /hasActiveEntitlement/);
  assert.doesNotMatch(success, /grantCheckoutSession|upsertEntitlement/);

  const blocked = await provisionSandboxProduct({
    humanApproved: true,
    stripeKey: "sk_test_unused",
    dryRun: true,
    slug: "quote-request-assistant",
    name: "Quote Request Assistant",
    approvedAmountCents: LAUNCH_USD_CENTS,
    suggestedAmountCents: LAUNCH_USD_CENTS,
    rationale: "sandbox",
    existing: null,
    environment: "LIVE",
    stripe: {
      async findProductBySlug() {
        throw new Error("Stripe was called.");
      },
      async findPrice() {
        throw new Error("Stripe was called.");
      },
      async createProduct() {
        throw new Error("Stripe was called.");
      },
      async createPrice() {
        throw new Error("Stripe was called.");
      },
    },
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, LIVE_STRIPE_PROVISIONING_BLOCKED);
});
