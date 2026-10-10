import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import Stripe from "stripe";
import { canAccessBlueprint, getBlueprintById } from "../blueprints";
import {
  buildCheckoutSessionCreateParams,
  serverPriceForProduct,
} from "./checkout-session";
import { isE2eEntitlementGrant } from "./e2e-grant";
import {
  grantCheckoutSession,
  type CheckoutCompletion,
  type EntitlementStore,
  type EntitlementWrite,
} from "./entitlement";
import { COLLECTIONS_PRODUCT_SLUG, getPaidProduct } from "./products";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SECRET_ENV = /STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_WEBHOOK_SECRET/;

function paidSession(id = "cs_test_completed"): CheckoutCompletion {
  return {
    id,
    payment_status: "paid",
    status: "complete",
    client_reference_id: USER_ID,
    customer: "cus_test",
    payment_intent: "pi_test",
    metadata: {
      atlas_user_id: USER_ID,
      product_slug: COLLECTIONS_PRODUCT_SLUG,
    },
  };
}

function memoryStore() {
  const rows = new Map<string, EntitlementWrite>();
  let writes = 0;
  const store: EntitlementStore = {
    async upsert(row) {
      writes += 1;
      rows.set(`${row.user_id}:${row.product_slug}`, row);
    },
  };
  return {
    rows,
    store,
    writes: () => writes,
  };
}

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      found.push(...sourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts")) found.push(full);
  }
  return found;
}

test("checkout uses the server price and ignores a browser price id", () => {
  const product = getPaidProduct(COLLECTIONS_PRODUCT_SLUG);
  assert.ok(product);
  assert.equal(product.priceEnv, "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT");
  assert.equal(product.accessType, "lifetime");

  const serverPriceId = serverPriceForProduct(COLLECTIONS_PRODUCT_SLUG, {
    STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT: "price_serverconfigured",
  });
  const result = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    email: "person@example.com",
    productSlug: COLLECTIONS_PRODUCT_SLUG,
    origin: "http://localhost:3000",
    serverPriceId,
    clientPriceId: "price_from_browser",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.params.mode, "payment");
  assert.equal(result.params.line_items[0].price, "price_serverconfigured");
  assert.equal(result.params.line_items[0].quantity, 1);
  assert.equal(result.params.client_reference_id, USER_ID);
  assert.equal(result.params.metadata.atlas_user_id, USER_ID);
  assert.equal(result.params.metadata.product_slug, COLLECTIONS_PRODUCT_SLUG);
  assert.equal(JSON.stringify(result.params).includes("price_from_browser"), false);
  assert.match(result.params.success_url, /\{CHECKOUT_SESSION_ID\}/);
});

test("unknown products and arbitrary prices are rejected", () => {
  const unknown = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: "daily-inbox-briefing",
    origin: "http://localhost:3000",
    serverPriceId: "price_server_configured",
    clientPriceId: "price_from_browser",
  });
  assert.equal(unknown.ok, false);

  const missing = buildCheckoutSessionCreateParams({
    userId: USER_ID,
    productSlug: COLLECTIONS_PRODUCT_SLUG,
    origin: "http://localhost:3000",
    serverPriceId: "not-a-price",
    clientPriceId: "price_from_browser",
  });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.equal(missing.error, "missing_price");
});

test("an invalid webhook signature is rejected and a paid session grants once", async () => {
  const secret = "whsec_unit_test_secret";
  assert.throws(() => Stripe.webhooks.constructEvent("{}", "t=1,v1=bad", secret));

  const session = paidSession();
  const payload = JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type: "checkout.session.completed",
    data: { object: session },
  });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  const event = Stripe.webhooks.constructEvent(payload, header, secret);
  assert.equal(event.type, "checkout.session.completed");

  const memory = memoryStore();
  const first = await grantCheckoutSession(session, memory.store);
  const repeat = await grantCheckoutSession(session, memory.store);
  const anotherSession = await grantCheckoutSession(paidSession("cs_test_repeat"), memory.store);
  assert.equal(first.granted, true);
  assert.equal(repeat.granted, true);
  assert.equal(anotherSession.granted, true);
  assert.equal(memory.rows.size, 1);
  const row = memory.rows.get(`${USER_ID}:${COLLECTIONS_PRODUCT_SLUG}`);
  assert.ok(row);
  assert.equal(row.access_type, "lifetime");
  assert.equal(row.status, "active");
  assert.equal(row.stripe_subscription_id, null);
  assert.equal(row.stripe_customer_id, "cus_test");
  assert.equal(row.stripe_payment_intent_id, "pi_test");
});

test("unpaid, unknown, and mismatched checkout sessions do not grant access", async () => {
  const memory = memoryStore();
  const unpaid = await grantCheckoutSession(
    { ...paidSession(), payment_status: "unpaid" },
    memory.store,
  );
  const unknown = await grantCheckoutSession(
    {
      ...paidSession(),
      metadata: { atlas_user_id: USER_ID, product_slug: "daily-inbox-briefing" },
    },
    memory.store,
  );
  const mismatched = await grantCheckoutSession(
    { ...paidSession(), client_reference_id: "22222222-2222-4222-8222-222222222222" },
    memory.store,
  );
  assert.equal(unpaid.granted, false);
  assert.equal(unknown.granted, false);
  assert.equal(mismatched.granted, false);
  assert.equal(memory.writes(), 0);
});

test("a browser header cannot grant an entitlement unless the local test flag matches", () => {
  const secret = "atlas-e2e-entitlement-v1";
  const env = { ATLAS_PAYMENTS_E2E: "1", ATLAS_PAYMENTS_E2E_SECRET: secret };
  assert.equal(isE2eEntitlementGrant(secret, { ATLAS_PAYMENTS_E2E_SECRET: secret }, "localhost:3100"), false);
  assert.equal(isE2eEntitlementGrant(secret, env, "aiusecaseatlas.com"), false);
  assert.equal(isE2eEntitlementGrant("self-granted", env, "localhost:3100"), false);
  assert.equal(isE2eEntitlementGrant(secret, { ...env, ATLAS_PAYMENTS_E2E_SECRET: "short" }, "localhost"), false);
  assert.equal(isE2eEntitlementGrant(secret, env, "localhost:3100"), true);
});

test("the entitlement migration lets the owner read and blocks client writes", () => {
  const sql = readFileSync(
    "supabase/migrations/20261010044500_create_entitlements.sql",
    "utf8",
  );
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /force row level security/i);
  assert.match(sql, /unique \(user_id, product_slug\)/);
  assert.match(sql, /references auth\.users/);
  assert.match(sql, /for select/i);
  assert.match(sql, /grant select on table public\.entitlements to authenticated/i);
  assert.match(sql, /grant select, insert, update on table public\.entitlements to service_role/i);
  assert.doesNotMatch(sql, /for\s+insert/i);
  assert.doesNotMatch(sql, /for\s+update/i);
  assert.doesNotMatch(sql, /for\s+delete/i);
  assert.doesNotMatch(sql, /grant\s+[^;]*\binsert\b[^;]*to\s+authenticated/i);
  assert.doesNotMatch(sql, /drop\s+table/i);
});

test("secret keys stay on the server and the success page cannot grant access", () => {
  const allowed = new Set([
    path.normalize("src/lib/stripe/server.ts"),
    path.normalize("src/lib/supabase/admin.ts"),
    path.normalize("app/api/stripe/webhook/route.ts"),
  ]);
  const offenders: string[] = [];
  for (const file of [...sourceFiles("app"), ...sourceFiles("components"), ...sourceFiles("src")]) {
    const text = readFileSync(file, "utf8");
    const relative = path.normalize(path.relative(process.cwd(), file));
    if (SECRET_ENV.test(text) && !allowed.has(relative)) offenders.push(relative);
    if (text.includes('"use client"') || text.includes("'use client'")) {
      assert.doesNotMatch(text, /stripe\/server|supabase\/admin|STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
    }
    assert.doesNotMatch(text, /NEXT_PUBLIC_STRIPE|NEXT_PUBLIC_SUPABASE_SERVICE/);
  }
  assert.deepEqual(offenders, []);

  for (const file of allowed) {
    const text = readFileSync(file, "utf8");
    if (file.endsWith("route.ts")) continue;
    assert.match(text, /import "server-only"/);
  }

  const success = readFileSync(
    "app/blueprints/ai-collections-assistant/checkout/success/page.tsx",
    "utf8",
  );
  assert.match(success, /hasActiveEntitlement/);
  assert.doesNotMatch(success, /upsertEntitlement|SERVICE_ROLE|checkout\.sessions|grantCheckoutSession/);

  const kit = readFileSync("app/blueprints/ai-collections-assistant/kit/page.tsx", "utf8");
  assert.match(kit, /hasActiveEntitlement/);
  assert.doesNotMatch(kit, /upsertEntitlement|SERVICE_ROLE/);

  const checkout = readFileSync("src/lib/payments/checkout-session.ts", "utf8");
  assert.match(checkout, /line_items: \[\{ price, quantity: 1 \}\]/);
  assert.match(checkout, /void input\.clientPriceId/);

  const e2e = readFileSync("e2e/support/payments-e2e.ts", "utf8");
  const grant = readFileSync("src/lib/payments/e2e-grant.ts", "utf8");
  assert.match(e2e, /x-atlas-e2e-entitlement/);
  assert.match(grant, /x-atlas-e2e-entitlement/);
});

test("daily inbox stays a free starter and collections stays premium in the catalog", () => {
  const starter = getBlueprintById("daily-inbox-briefing-starter-kit");
  const premium = getBlueprintById("ai-collections-assistant");
  assert.ok(starter);
  assert.ok(premium);
  assert.equal(starter.access, "free-authenticated");
  assert.equal(canAccessBlueprint(USER_ID, starter), true);
  assert.equal(starter.href, "/blueprints/daily-inbox-briefing/starter-kit");
  assert.equal(premium.access, "premium");
  assert.equal(premium.productSlug, COLLECTIONS_PRODUCT_SLUG);
  assert.equal(canAccessBlueprint(USER_ID, premium), false);
  assert.equal(premium.href, "/blueprints/ai-collections-assistant/kit");
  assert.equal(premium.purchaseHref, "/blueprints/ai-collections-assistant");
});
