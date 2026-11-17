import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_EXCLUSION_FILTER,
  analyticsRange,
  analyticsRequestUrl,
  isAdminPath,
  productSlugFromPath,
  readVercelAnalytics,
  summarizePages,
} from "./analytics-query";
import { rangeStart } from "./range";

const NOW = new Date("2026-11-16T03:00:00.000Z");
const TOKEN = "server-analytics-token";
const SLUGS = ["quote-request-assistant", "ai-expense-watchdog"];

test("analytics ranges use the Tokyo reporting window", () => {
  for (const range of ["today", "7d", "30d"] as const) {
    const window = analyticsRange(range, NOW);
    assert.equal(window.since, String(rangeStart(range, NOW).getTime()));
    assert.equal(window.until, String(NOW.getTime()));
  }
  const today = Number(analyticsRange("today", NOW).since);
  const week = Number(analyticsRange("7d", NOW).since);
  const month = Number(analyticsRange("30d", NOW).since);
  assert.equal(today - week, 6 * 24 * 60 * 60 * 1000);
  assert.equal(today - month, 29 * 24 * 60 * 60 * 1000);
});

test("an empty analytics response is zero, not a fabricated list", async () => {
  const urls: string[] = [];
  const read = await readVercelAnalytics({
    range: "7d",
    now: NOW,
    productSlugs: SLUGS,
    env: { VERCEL_WEB_ANALYTICS_TOKEN: TOKEN, VERCEL_PROJECT_ID: "prj_test", VERCEL_TEAM_ID: "team_test" },
    request: async (url) => {
      urls.push(url);
      if (url.includes("/visits/count")) return { ok: true, body: { data: { visitors: 0, pageviews: 0 } } };
      return { ok: true, body: { data: [] } };
    },
  });
  assert.equal(read.state, "value");
  if (read.state !== "value") return;
  assert.equal(read.visitors, 0);
  assert.equal(read.pageViews, 0);
  assert.equal(read.productPageViews, 0);
  assert.deepEqual(read.topPages, []);
  assert.deepEqual(read.referrers, []);
  assert.deepEqual(read.productPageViewsBySlug, {
    "quote-request-assistant": 0,
    "ai-expense-watchdog": 0,
  });
  assert.equal(urls.every((url) => new URL(url).searchParams.get("filter") === ADMIN_EXCLUSION_FILTER && !url.includes(TOKEN)), true);
});

test("a failed analytics response stays Not available and ignores any numbers in the body", async () => {
  const read = await readVercelAnalytics({
    range: "today",
    now: NOW,
    productSlugs: SLUGS,
    env: { VERCEL_WEB_ANALYTICS_TOKEN: TOKEN, VERCEL_PROJECT_ID: "prj_test" },
    request: async () => ({ ok: false, body: { data: { visitors: 99, pageviews: 99 } } }),
  });
  assert.equal(read.state, "not_available");
  assert.equal(JSON.stringify(read).includes("99"), false);
});

test("admin routes are excluded from pages and product counts", () => {
  assert.equal(isAdminPath("/admin"), true);
  assert.equal(isAdminPath("/admin/project"), true);
  assert.equal(isAdminPath("/ja/blog"), false);
  assert.equal(productSlugFromPath("/admin/blueprints/quote-request-assistant", SLUGS), null);
  const summary = summarizePages(
    [
      { key: "/admin/project", pageViews: 50 },
      { key: "/admin", pageViews: 5 },
      { key: "/ja", pageViews: 8 },
      { key: "/blueprints/quote-request-assistant", pageViews: 4 },
    ],
    SLUGS,
    false,
  );
  assert.deepEqual(summary.topPages.map((row) => row.path), ["/ja", "/blueprints/quote-request-assistant"]);
  assert.equal(summary.productPageViews, 4);
});

test("product page views add locale pages and skip kit or unknown paths", () => {
  const summary = summarizePages(
    [
      { key: "/blueprints/quote-request-assistant", pageViews: 4 },
      { key: "/ja/blueprints/quote-request-assistant", pageViews: 3 },
      { key: "/en/blueprints/ai-expense-watchdog", pageViews: 2 },
      { key: "/blueprints/quote-request-assistant/kit", pageViews: 9 },
      { key: "/blueprints/not-a-product", pageViews: 6 },
    ],
    SLUGS,
    false,
  );
  assert.equal(summary.productPageViews, 9);
  assert.equal(summary.productPageViewsBySlug?.["quote-request-assistant"], 7);
  assert.equal(summary.productPageViewsBySlug?.["ai-expense-watchdog"], 2);
  const incomplete = summarizePages([{ key: "/blueprints/quote-request-assistant", pageViews: 4 }], SLUGS, true);
  assert.equal(incomplete.productPageViews, null);
  assert.equal(incomplete.topPages[0]?.path, "/blueprints/quote-request-assistant");
});

test("the analytics request keeps the token out of the URL and the client bundle", () => {
  const url = analyticsRequestUrl({
    endpoint: "count",
    projectId: "prj_test",
    teamId: "team_test",
    teamSlug: null,
    since: "1",
    until: "2",
    filter: ADMIN_EXCLUSION_FILTER,
  });
  assert.equal(url.startsWith("https://api.vercel.com/v1/query/web-analytics/visits/count?"), true);
  assert.equal(url.includes(TOKEN), false);
  const source = [
    "src/lib/admin/analytics-query.ts",
    "src/lib/admin/load-dashboard.ts",
    "components/admin/monitor-sections.tsx",
    "components/admin/project-dashboard.tsx",
  ].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.match(source, /VERCEL_WEB_ANALYTICS_TOKEN/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_VERCEL|NEXT_PUBLIC_.*ANALYTICS/);
});
