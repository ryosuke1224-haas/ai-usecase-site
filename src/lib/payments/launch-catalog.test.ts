import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { blueprintCatalog } from "../blueprints";
import { checkoutGate } from "./checkout-gate";
import { buildCheckoutSessionCreateParams } from "./checkout-session";
import { entitlementFromCheckout, type CheckoutCompletion } from "./entitlement";
import {
  COLLECTIONS_JPY_AMOUNT,
  LAUNCH_JPY_AMOUNT,
  LAUNCH_PRODUCTS,
  LAUNCH_USD_CENTS,
  launchLiveRegistryRows,
  launchRegistryRows,
} from "./launch-catalog";
import { commerceScopeForUiLocale, formatCheckoutPrice, previewCommerceScope } from "./preview-market";
import { LIVE_STRIPE_PROVISIONING_BLOCKED, provisionSandboxProduct } from "./provision";
import { getPaidProduct, productCommercePaths } from "./products";
import { mappingKey, mergeRegistryProducts, resolveTrustedPriceId } from "./registry";
import { envForStripeCredential, isLiveStripeKey, stripeRuntimeMode } from "./stripe-mode";

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
  assert.match(stripeServer, /serverCommerceEnv/);
  assert.match(stripeServer, /env\.STRIPE_SECRET_KEY/);
  assert.equal(stripeServer.includes("STRIPE_SECRET_KEY_JP_LIVE"), false);
  assert.equal(stripeServer.includes("STRIPE_SECRET_KEY_US_LIVE"), false);
  assert.equal(isLiveStripeKey("sk_test_not_live"), false);
  assert.equal(isLiveStripeKey("rk_test_not_live"), false);
  assert.equal(isLiveStripeKey("sk_live_example"), true);
  assert.equal(isLiveStripeKey("rk_live_example"), true);
  assert.equal(stripeRuntimeMode(envForStripeCredential({}, "rk_live_example")), "live");
  assert.equal(stripeRuntimeMode(envForStripeCredential({}, "sk_live_example")), "live");
  assert.equal(stripeRuntimeMode(envForStripeCredential({}, "sk_test_example")), "sandbox");
  assert.equal(stripeRuntimeMode(envForStripeCredential({ ATLAS_STRIPE_MODE: "sandbox" }, "rk_live_example")), "sandbox");
  const liveCredential = envForStripeCredential({}, "rk_live_example");
  assert.deepEqual(commerceScopeForUiLocale("ja", liveCredential), {
    market: "JP",
    locale: "ja",
    currency: "jpy",
    stripe_environment: "LIVE",
  });
  assert.deepEqual(commerceScopeForUiLocale("en", liveCredential), {
    market: "JP",
    locale: "en",
    currency: "usd",
    stripe_environment: "LIVE",
  });
  const checkout = readFileSync("src/lib/payments/start-checkout.ts", "utf8");
  assert.match(checkout, /serverCommerceEnv/);
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

test("production uses one Japanese account for yen and dollar prices", () => {
  const live = launchLiveRegistryRows();
  const sandbox = launchRegistryRows();
  assert.equal(live.filter((row) => LAUNCH_PRODUCTS.some((item) => item.slug === row.product_slug)).length, 22);
  const sandboxKeys = new Set(sandbox.map(mappingKey));
  for (const item of LAUNCH_PRODUCTS) {
    const yen = live.find((row) => row.product_slug === item.slug && row.currency === "jpy");
    const dollar = live.find((row) => row.product_slug === item.slug && row.currency === "usd");
    assert.equal(yen?.price_amount, LAUNCH_JPY_AMOUNT);
    assert.equal(dollar?.price_amount, LAUNCH_USD_CENTS);
    assert.equal(yen?.market, "JP");
    assert.equal(dollar?.market, "JP");
    assert.equal(yen?.locale, "ja");
    assert.equal(dollar?.locale, "en");
    assert.equal(yen?.stripe_environment, "LIVE");
    assert.equal(dollar?.stripe_environment, "LIVE");
    assert.equal(yen?.payment_type, "ONE_TIME");
    assert.equal(dollar?.payment_type, "ONE_TIME");
    assert.equal(yen?.stripe_price_id, null);
    assert.equal(dollar?.stripe_price_id, null);
    assert.equal(sandboxKeys.has(mappingKey(yen!)), false);
    assert.equal(sandboxKeys.has(mappingKey(dollar!)), false);
  }
  const collections = live.filter((row) => row.product_slug === "ai-collections-assistant");
  assert.equal(collections.length, 1);
  assert.equal(collections[0]?.currency, "jpy");
  assert.equal(collections[0]?.price_amount, COLLECTIONS_JPY_AMOUNT);
  assert.equal(collections[0]?.stripe_environment, "LIVE");
  assert.equal(live.some((row) => row.product_slug === "ai-daily-inbox-briefing"), false);
  assert.equal(sandbox.some((row) => row.product_slug === "ai-daily-inbox-briefing"), false);

  const slug = "quote-request-assistant";
  const products = mergeRegistryProducts(sandbox, live).map((row) => {
    if (row.product_slug !== slug) return row;
    const priceId = `${row.stripe_environment === "LIVE" ? "price_live" : "price_sandbox"}${row.currency}`;
    return { ...row, stripe_product_id: `prod_${row.stripe_environment.toLowerCase()}`, stripe_price_id: priceId };
  });
  const japan = commerceScopeForUiLocale("ja", { ATLAS_STRIPE_MODE: "live", ATLAS_COMMERCE_MARKET: "US" });
  const english = commerceScopeForUiLocale("en", { ATLAS_STRIPE_MODE: "live", ATLAS_COMMERCE_MARKET: "US" });
  assert.deepEqual(japan, { market: "JP", locale: "ja", currency: "jpy", stripe_environment: "LIVE" });
  assert.deepEqual(english, { market: "JP", locale: "en", currency: "usd", stripe_environment: "LIVE" });
  const liveYen = resolveTrustedPriceId(slug, { products, ...japan!, environment: japan!.stripe_environment });
  const liveDollar = resolveTrustedPriceId(slug, { products, ...english!, environment: english!.stripe_environment });
  assert.deepEqual(liveYen, { ok: true, priceId: "price_livejpy", source: "registry" });
  assert.deepEqual(liveDollar, { ok: true, priceId: "price_liveusd", source: "registry" });
  assert.equal(liveYen.ok && liveDollar.ok && liveYen.priceId !== liveDollar.priceId, true);

  const sandboxJapan = commerceScopeForUiLocale("ja", {});
  const sandboxEnglish = commerceScopeForUiLocale("en", {});
  assert.equal(sandboxJapan?.stripe_environment, "SANDBOX");
  assert.equal(sandboxEnglish?.market, "US");
  const sandboxYen = resolveTrustedPriceId(slug, {
    products,
    ...sandboxJapan!,
    environment: sandboxJapan!.stripe_environment,
  });
  const sandboxDollar = resolveTrustedPriceId(slug, {
    products,
    ...sandboxEnglish!,
    environment: sandboxEnglish!.stripe_environment,
  });
  assert.deepEqual(sandboxYen, { ok: true, priceId: "price_sandboxjpy", source: "registry" });
  assert.deepEqual(sandboxDollar, { ok: true, priceId: "price_sandboxusd", source: "registry" });
  assert.equal(previewCommerceScope({ ATLAS_STRIPE_MODE: "live" })?.market, "JP");
  assert.equal(previewCommerceScope({ ATLAS_STRIPE_MODE: "sandbox" })?.stripe_environment, "SANDBOX");

  const crossed = resolveTrustedPriceId(slug, {
    products,
    market: "US",
    locale: "en",
    currency: "usd",
    environment: "LIVE",
  });
  assert.deepEqual(crossed, { ok: false, error: "unknown_product" });
  const sameSlug = entitlementFromCheckout(
    {
      id: "cs_live_same_slug",
      payment_status: "paid",
      status: "complete",
      client_reference_id: USER_ID,
      customer: "cus_live",
      payment_intent: "pi_live",
      metadata: { atlas_user_id: USER_ID, product_slug: slug },
    },
    new Date(),
    products.filter((row) => row.stripe_environment === "LIVE").map((row) => row.product_slug),
  );
  const sandboxGrant = entitlementFromCheckout(
    {
      id: "cs_test_same_slug",
      payment_status: "paid",
      status: "complete",
      client_reference_id: USER_ID,
      customer: "cus_test",
      payment_intent: "pi_test",
      metadata: { atlas_user_id: USER_ID, product_slug: slug },
    },
    new Date(),
    products.filter((row) => row.stripe_environment === "SANDBOX").map((row) => row.product_slug),
  );
  assert.equal("ok" in sameSlug && sameSlug.entitlement.product_slug, slug);
  assert.equal("ok" in sandboxGrant && sandboxGrant.entitlement.product_slug, slug);
});
