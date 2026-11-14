import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PROJECT_STATUSES, projectOperations } from "@/ops/operations";
import { blueprintCatalog } from "@/src/lib/blueprints";
import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { ADMIN_PROJECT_PATH, adminAccessDecision, parseAdminAllowlist } from "./access";
import { performanceProducts, premiumBlueprintCount, vercelAnalyticsInstalled } from "./catalog";
import {
  auditAnalytics,
  buildOperationsDashboard,
  entitlementFact,
  toCheckoutFact,
  type CheckoutFact,
  type DashboardInput,
  type DashboardModel,
} from "./dashboard-model";
import { parseDashboardRange, rangeStart, startOfTokyoDay } from "./range";

const NOW = new Date("2026-11-13T16:00:00.000Z");
const TODAY = Math.floor(Date.parse("2026-11-13T15:30:00.000Z") / 1000);
const YESTERDAY = Math.floor(Date.parse("2026-11-13T14:00:00.000Z") / 1000);
const USER_A = "user_should_not_leak_aaaa";
const USER_B = "user_should_not_leak_bbbb";
const USER_C = "user_should_not_leak_cccc";
const USER_D = "user_should_not_leak_dddd";
const IN_RANGE = "2026-11-13T15:30:00.000Z";
const OLD = "2026-10-01T00:00:00.000Z";

function paid(partial: Partial<CheckoutFact> = {}): CheckoutFact {
  return {
    created: TODAY,
    livemode: true,
    paymentStatus: "paid",
    status: "complete",
    amount: 7980,
    currency: "jpy",
    productSlug: "quote-request-assistant",
    ...partial,
  };
}

function input(overrides: Partial<DashboardInput> = {}): DashboardInput {
  return {
    now: NOW,
    range: "today",
    viewerEmail: "Owner@Example.com",
    siteMode: "live",
    stripe: { state: "not_connected", detail: "Stripe is not configured on this server." },
    customers: { state: "not_connected", detail: "Customer records are not configured on this server." },
    analytics: auditAnalytics({ gaCollectionConfigured: false, vercelAnalyticsInstalled: false }),
    blog: { state: "not_connected", detail: "Article storage is not available." },
    newsletter: { state: "not_connected", detail: "Subscriber storage is not available." },
    products: [
      { slug: "quote-request-assistant", titleJa: "見積依頼レビュー", live: true },
      { slug: "ai-expense-watchdog", titleJa: "経費の定期点検", live: true },
    ],
    premiumBlueprintCount: 13,
    ...overrides,
  };
}

function must<T>(value: T | null): T {
  assert.ok(value);
  return value;
}

function walk(value: unknown, bannedKeys: readonly string[]) {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, bannedKeys);
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert.equal(bannedKeys.includes(key), false, key);
      walk(child, bannedKeys);
    }
  }
}

function kpi(model: DashboardModel, id: string) {
  const card = model.kpis.find((item) => item.id === id);
  assert.ok(card);
  return card;
}

test("the admin allowlist fails closed", () => {
  assert.deepEqual(parseAdminAllowlist(undefined), []);
  assert.deepEqual(parseAdminAllowlist(" owner@example.com, Owner@Example.com, not-an-email "), ["owner@example.com"]);
  assert.equal(adminAccessDecision(null, ["owner@example.com"]), "anonymous");
  assert.equal(adminAccessDecision({ email: undefined }, ["owner@example.com"]), "forbidden");
  assert.equal(adminAccessDecision({ email: "other@example.com" }, ["owner@example.com"]), "forbidden");
  assert.equal(adminAccessDecision({ email: "Owner@Example.com" }, []), "forbidden");
  assert.equal(adminAccessDecision({ email: "Owner@Example.com" }, ["owner@example.com"]), "allow");
  assert.equal(ADMIN_PROJECT_PATH, "/admin/project");
});

test("reporting ranges use Japan time and include today", () => {
  assert.equal(startOfTokyoDay(NOW).toISOString(), "2026-11-13T15:00:00.000Z");
  assert.equal(rangeStart("today", NOW).toISOString(), "2026-11-13T15:00:00.000Z");
  assert.equal(rangeStart("7d", NOW).toISOString(), "2026-11-07T15:00:00.000Z");
  assert.equal(rangeStart("30d", NOW).toISOString(), "2026-10-15T15:00:00.000Z");
  assert.equal(parseDashboardRange("today"), "today");
  assert.equal(parseDashboardRange("30d"), "30d");
  assert.equal(parseDashboardRange("bogus"), "7d");
  assert.equal(parseDashboardRange(undefined), "7d");
});

test("checkout facts drop card and customer fields", () => {
  const raw = {
    created: TODAY,
    livemode: false,
    payment_status: "paid",
    status: "complete",
    amount_total: 1111,
    currency: "JPY",
    metadata: { product_slug: "javascript:alert(1)" },
    payment_method: "pm_secret_should_not_leak",
    card: "4242424242424242",
    customer_details: { email: "hidden@example.com", address: "1 Secret Street" },
  };
  const fact = must(toCheckoutFact(raw));
  assert.equal(fact.livemode, false);
  assert.equal(fact.currency, "jpy");
  assert.equal(fact.productSlug, null);
  const json = JSON.stringify(fact);
  assert.equal(json.includes("4242"), false);
  assert.equal(json.includes("pm_secret"), false);
  assert.equal(json.includes("hidden@example.com"), false);
  assert.equal(json.includes("Secret Street"), false);
  assert.equal(json.includes("javascript"), false);
});

test("entitlements count only live checkout ids and do not keep the session id", () => {
  const live = must(
    entitlementFact(
      {
        user_id: USER_A,
        product_slug: "quote-request-assistant",
        status: "active",
        purchased_at: IN_RANGE,
        stripe_checkout_session_id: "cs_live_should_not_leak",
      },
      "Buyer@Example.com",
    ),
  );
  const sandbox = must(
    entitlementFact(
      {
        user_id: USER_C,
        product_slug: "quote-request-assistant",
        status: "active",
        purchased_at: IN_RANGE,
        stripe_checkout_session_id: "cs_test_should_not_leak",
      },
      "sandbox@example.com",
    ),
  );
  assert.equal(live.checkout, "live");
  assert.equal(live.email, "Buyer@Example.com");
  assert.equal(sandbox.checkout, "sandbox");
  assert.equal(
    entitlementFact(
      {
        user_id: USER_D,
        product_slug: "quote-request-assistant",
        status: "active",
        purchased_at: IN_RANGE,
        stripe_checkout_session_id: null,
      },
      "mystery@example.com",
    )?.checkout,
    "unclassified",
  );
  assert.equal(entitlementFact({ user_id: USER_A, product_slug: "bad slug", status: "active" }, null), null);
  assert.equal(JSON.stringify(live).includes("cs_live_"), false);
  assert.equal(JSON.stringify(sandbox).includes("cs_test_"), false);
});

test("a disconnected dashboard shows Not connected and does not invent traffic", () => {
  const model = buildOperationsDashboard(input());
  for (const id of ["visitors", "page-views", "checkout-starts", "purchases", "revenue", "customers"]) {
    assert.equal(kpi(model, id).display, "Not connected");
  }
  assert.equal(model.analytics.state, "not_connected");
  assert.match(model.analytics.providerNeeded, /Google Analytics Data API/);
  assert.match(model.analytics.detail, /Vercel Web Analytics is not installed/);
  assert.equal(model.products.every((product) => product.pageViews === "Not connected"), true);
  assert.equal(model.products.every((product) => product.purchases === "Not connected"), true);
  assert.equal(model.products.every((product) => product.conversion === "Not connected"), true);
  assert.equal(model.revenue.purchaseCount, null);
  assert.equal(JSON.stringify(model).includes("G-TESTID"), false);
});

test("configured Google Analytics collection is still not readable", () => {
  const analytics = auditAnalytics({ gaCollectionConfigured: true, vercelAnalyticsInstalled: false });
  const model = buildOperationsDashboard(input({ analytics }));
  assert.equal(analytics.state, "not_connected");
  assert.match(analytics.providerNeeded, /Google Analytics Data API \(GA4\)/);
  assert.match(analytics.detail, /cannot read/);
  assert.equal(kpi(model, "visitors").display, "Not connected");
  assert.equal(kpi(model, "page-views").display, "Not connected");
});

test("sandbox Stripe payments stay out of production revenue", () => {
  const model = buildOperationsDashboard(
    input({
      stripe: {
        state: "sandbox",
        truncated: false,
        sessions: [paid({ livemode: false, amount: 1111, currency: "jpy" }), paid({ livemode: true, amount: 7980 })],
      },
    }),
  );
  assert.equal(kpi(model, "purchases").display, "Not available");
  assert.equal(kpi(model, "revenue").display, "Not available");
  assert.equal(kpi(model, "checkout-starts").display, "Not available");
  assert.equal(model.revenue.purchaseCount, null);
  assert.deepEqual(model.revenue.byCurrency, []);
  assert.deepEqual(model.revenue.recent, []);
  const json = JSON.stringify(model);
  assert.equal(json.includes("1,111"), false);
  assert.equal(json.includes("1111"), false);
  assert.equal(json.includes("¥7,980"), false);
  assert.match(model.revenue.detail, /sandbox key/);
  assert.match(model.revenue.detail, /not included in production totals/);
});

test("production revenue keeps live paid sessions and separates currencies", () => {
  const sessions = [
    paid({ livemode: false, amount: 1111, currency: "jpy" }),
    paid({ livemode: true, amount: 2222, currency: "jpy", paymentStatus: "unpaid", status: "expired" }),
    paid({ livemode: true, amount: 7980, currency: "jpy" }),
    paid({ livemode: true, amount: 4900, currency: "usd" }),
    paid({ created: YESTERDAY, livemode: true, amount: 7980, currency: "jpy" }),
  ];
  const model = buildOperationsDashboard(input({ stripe: { state: "live", sessions, truncated: false } }));
  assert.equal(kpi(model, "purchases").display, "2");
  assert.equal(kpi(model, "checkout-starts").display, "3");
  assert.equal(kpi(model, "revenue").display, "¥7,980 · $49");
  assert.deepEqual(
    model.revenue.byCurrency.map((row) => [row.label, row.amountLabel, row.count]),
    [
      ["JPY", "¥7,980", 1],
      ["USD", "$49", 1],
    ],
  );
  assert.equal(model.revenue.purchaseCount, 2);
  assert.match(model.revenue.detail, /Sandbox payments excluded: 1/);
  assert.match(model.revenue.detail, /Unpaid or incomplete live checkouts excluded: 1/);
  const quote = model.products.find((product) => product.slug === "quote-request-assistant");
  const expense = model.products.find((product) => product.slug === "ai-expense-watchdog");
  assert.ok(quote && expense);
  assert.equal(quote.pageViews, "Not connected");
  assert.equal(quote.checkoutStarts, "3");
  assert.equal(quote.purchases, "2");
  assert.equal(quote.revenue, "¥7,980 · $49");
  assert.equal(quote.conversion, "2/3 (66.7%)");
  assert.equal(expense.checkoutStarts, "0");
  assert.equal(expense.purchases, "0");
  assert.equal(expense.revenue, "No revenue in this range");
  assert.equal(expense.conversion, "Not enough data");
  const json = JSON.stringify(model);
  assert.equal(json.includes("1,111"), false);
  assert.equal(json.includes("2,222"), false);

  const week = buildOperationsDashboard(input({ range: "7d", stripe: { state: "live", sessions, truncated: false } }));
  assert.equal(kpi(week, "purchases").display, "3");
  assert.equal(kpi(week, "revenue").display, "¥15,960 · $49");
});

test("live checkout with no payments is a real zero, while visitors stay Not connected", () => {
  const model = buildOperationsDashboard(input({ stripe: { state: "live", sessions: [], truncated: false } }));
  assert.equal(kpi(model, "visitors").state, "not_connected");
  assert.equal(kpi(model, "page-views").display, "Not connected");
  assert.equal(kpi(model, "purchases").display, "0");
  assert.equal(kpi(model, "revenue").display, "No revenue in this range");
  assert.equal(kpi(model, "checkout-starts").display, "0");
  assert.equal(model.products[0]?.conversion, "Not enough data");
});

test("customer metrics ignore sandbox entitlements and payment identifiers", () => {
  const rows = [
    must(entitlementFact({ user_id: USER_A, product_slug: "quote-request-assistant", status: "active", purchased_at: IN_RANGE, stripe_checkout_session_id: "cs_live_aaa" }, "buyer@example.com")),
    must(entitlementFact({ user_id: USER_A, product_slug: "ai-expense-watchdog", status: "active", purchased_at: OLD, stripe_checkout_session_id: "cs_live_aab" }, "buyer@example.com")),
    must(entitlementFact({ user_id: USER_B, product_slug: "quote-request-assistant", status: "revoked", purchased_at: IN_RANGE, stripe_checkout_session_id: "cs_live_bbb" }, "second@example.com")),
    must(entitlementFact({ user_id: USER_C, product_slug: "quote-request-assistant", status: "active", purchased_at: IN_RANGE, stripe_checkout_session_id: "cs_test_ccc" }, "sandbox@example.com")),
    must(entitlementFact({ user_id: USER_D, product_slug: "quote-request-assistant", status: "active", purchased_at: IN_RANGE, stripe_checkout_session_id: null }, "mystery@example.com")),
  ];
  const model = buildOperationsDashboard(
    input({
      customers: { state: "value", rows, truncated: false, emailsIncomplete: false },
    }),
  );
  assert.equal(model.customers.uniqueInRange, 2);
  assert.equal(model.customers.ownedInRange, 1);
  assert.equal(model.customers.uniqueAllTime, 2);
  assert.equal(model.customers.ownedAllTime, 2);
  assert.equal(kpi(model, "customers").display, "2");
  assert.deepEqual(
    model.customers.recent.map((customer) => customer.email),
    ["buyer@example.com", "second@example.com"],
  );
  assert.equal(model.customers.recent[0]?.products.length, 2);
  assert.equal(model.customers.recent[1]?.products[0]?.status, "revoked");
  assert.match(model.customers.detail, /Sandbox entitlements excluded: 1/);
  const json = JSON.stringify(model);
  walk(model, ["userId", "stripe_checkout_session_id", "payment_method", "card", "client_secret", "address", "phone"]);
  for (const secret of [USER_A, USER_B, USER_C, USER_D, "cs_live_", "cs_test_", "sandbox@example.com", "mystery@example.com"]) {
    assert.equal(json.includes(secret), false, secret);
  }
});

test("the project record is the dashboard source for status, roadmap, and changes", () => {
  const model = buildOperationsDashboard(input());
  assert.deepEqual(
    model.statusGroups.find((group) => group.status === "LIVE")?.areas.map((area) => area.name),
    [
      "Japanese site",
      "English site",
      "Stripe live checkout",
      "Auth",
      "My Blueprints",
      "Premium Blueprints",
      "Collections",
      "Daily Inbox",
      "Operations Dashboard",
      "Vercel Analytics",
      "Blog foundation",
      "Newsletter signup",
      "Review queue",
    ],
  );
  assert.deepEqual(
    model.statusGroups.find((group) => group.status === "IN_PROGRESS")?.areas.map((area) => area.name),
    [],
  );
  assert.deepEqual(
    model.statusGroups.find((group) => group.status === "PLANNED")?.areas.map((area) => area.name),
    [
      "Newsletter sending",
      "Atlas weekly",
      "News research automation",
      "Blog and newsletter draft generation",
      "Controlled publish",
      "Scheduling",
      "Analytics dashboard API",
      "CS automation",
      "SNS automation",
      "Broader product automation",
    ],
  );
  assert.deepEqual(model.roadmap.now.map((item) => item.name), [
    "Atlas Weekly Automation",
    "News research automation",
    "Blog/newsletter draft generation",
  ]);
  assert.deepEqual(model.roadmap.next.map((item) => item.name), [
    "Controlled Publish",
    "Newsletter sending",
    "Scheduling",
    "Analytics dashboard API integration",
  ]);
  assert.deepEqual(model.roadmap.later.map((item) => item.name), [
    "SNS automation",
    "CS automation",
    "Broader product automation",
  ]);
  assert.equal(model.recentChanges[0]?.date, "2026-11-14");
  assert.match(model.recentChanges[0]?.title ?? "", /production growth and admin status/i);
  assert.equal(model.pipeline.some((item) => item.name === "Atlas weekly"), true);
  assert.equal(model.pipeline.some((item) => item.name === "Review queue"), false);
  assert.equal(model.pipeline.some((item) => item.name === "Blog foundation"), false);
  assert.equal(model.pipeline.some((item) => item.name === "Operations Dashboard"), false);
  assert.deepEqual(model.overview.find((card) => card.id === "collections")?.value, "LIVE");
  assert.deepEqual(model.overview.find((card) => card.id === "blog")?.value, "LIVE");
  assert.match(model.overview.find((card) => card.id === "newsletter")?.value ?? "", /^LIVE \/ PLANNED$/);
  assert.doesNotMatch(model.overview.find((card) => card.id === "blog")?.detail ?? "", /Apply the Atlas/);
  assert.doesNotMatch(model.overview.find((card) => card.id === "newsletter")?.detail ?? "", /Apply the Atlas/);
  assert.equal(model.viewerEmail, "Owner@Example.com");

  const ids = projectOperations.areas.map((area) => area.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const area of projectOperations.areas) assert.ok(PROJECT_STATUSES.includes(area.status));
  for (const change of projectOperations.recentChanges) assert.match(change.date, /^\d{4}-\d{2}-\d{2}$/);
});

test("launch products have Japanese titles and shipped pages, without invented analytics", () => {
  const products = performanceProducts();
  for (const item of LAUNCH_PRODUCTS) {
    assert.ok(products.some((product) => product.slug === item.slug && product.live && product.titleJa !== item.slug));
  }
  assert.ok(products.some((product) => product.slug === "ai-collections-assistant" && product.live));
  assert.equal(products.some((product) => product.slug === "security-readiness-action-pack"), false);
  assert.equal(premiumBlueprintCount(), blueprintCatalog.filter((item) => item.access === "premium").length);
  assert.equal(vercelAnalyticsInstalled(), true);
});

test("installed Vercel Analytics stays pending until a read token exists", () => {
  const model = buildOperationsDashboard(
    input({
      analytics: auditAnalytics({ gaCollectionConfigured: false, vercelAnalyticsInstalled: true }),
      blog: { state: "value", published: 1, drafts: 2, readyForReview: 3, approved: 0, needsChanges: 0, rejected: 0, archived: 4, total: 10 },
      newsletter: { state: "value", active: 5, recent: 1, unsubscribed: 2 },
    }),
  );
  assert.equal(model.analytics.state, "collecting");
  assert.equal(model.analytics.headline, "Analytics collecting / dashboard integration pending");
  assert.equal(kpi(model, "visitors").display, model.analytics.headline);
  assert.equal(kpi(model, "page-views").display, model.analytics.headline);
  assert.equal(model.blog.state === "value" && model.blog.published, 1);
  assert.equal(model.newsletter.state === "value" && model.newsletter.active, 5);
  assert.equal("email" in model.newsletter, false);
});

test("the admin route is private in source and does not publish secrets", () => {
  const page = readFileSync("app/admin/project/page.tsx", "utf8");
  const dashboard = readFileSync("components/admin/project-dashboard.tsx", "utf8");
  const loader = readFileSync("src/lib/admin/load-dashboard.ts", "utf8");
  assert.match(page, /adminAccessDecision/);
  assert.match(page, /redirect\(authPath\(adminProjectHref\(section, range\)\)\)/);
  assert.ok(page.indexOf("notFound()") < page.indexOf("loadOperationsDashboard("));
  assert.match(page, /index:\s*false/);
  assert.doesNotMatch(page, /use client/);
  assert.doesNotMatch(dashboard, /use client/);
  assert.doesNotMatch(dashboard, /Japanese site/);
  assert.doesNotMatch(dashboard, /stripe\/server|supabase\/admin/);
  assert.match(loader, /import "server-only"/);
  assert.match(loader, /checkout\.sessions\.list/);
  assert.doesNotMatch(loader, /checkout\.sessions\.create|paymentIntents\.create|refunds\.create/);

  const secretNames = ["STRIPE_" + "SECRET_KEY", "SUPABASE_" + "SERVICE_ROLE_KEY", "STRIPE_" + "WEBHOOK_SECRET"];
  for (const file of [
    "app/admin/project/page.tsx",
    "components/admin/project-dashboard.tsx",
    "src/lib/admin/load-dashboard.ts",
    "src/lib/admin/dashboard-model.ts",
    "src/lib/admin/access.ts",
    "ops/operations.ts",
  ]) {
    const text = readFileSync(file, "utf8");
    for (const name of secretNames) assert.equal(text.includes(name), false, file);
    assert.doesNotMatch(text, /sk_live_|sk_test_|rk_live_|whsec_/);
  }

  assert.match(readFileSync("app/robots.ts", "utf8"), /\/admin/);
  assert.doesNotMatch(readFileSync("components/header.tsx", "utf8"), /\/admin/);
  assert.doesNotMatch(readFileSync("components/footer.tsx", "utf8"), /\/admin/);
  assert.doesNotMatch(readFileSync("app/sitemap.ts", "utf8"), /\/admin/);
});
