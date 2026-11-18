import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ADMIN_EXCLUSION_FILTER,
  analyticsRange,
  analyticsRequestUrl,
  countryLabel,
  isAdminPath,
  normalizeBrowserLabel,
  normalizeDeviceLabel,
  normalizeOsLabel,
  normalizeReferrerHost,
  productSlugFromPath,
  readVercelAnalytics,
  summarizeCountries,
  summarizeNamedCounts,
  summarizePages,
  summarizeReferrers,
} from "./analytics-query";
import { rangeStart } from "./range";

const NOW = new Date("2026-11-16T03:00:00.000Z");
const TOKEN = "server-analytics-token";
const SLUGS = ["quote-request-assistant", "ai-expense-watchdog"];

function emptyAggregates(url: string) {
  if (url.includes("/visits/count")) return { ok: true, body: { data: { visitors: 0, pageviews: 0 } } };
  return { ok: true, body: { data: [] } };
}

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
      return emptyAggregates(url);
    },
  });
  assert.equal(read.state, "value");
  if (read.state !== "value") return;
  assert.equal(read.visitors, 0);
  assert.equal(read.pageViews, 0);
  assert.equal(read.productPageViews, 0);
  assert.deepEqual(read.topPages, []);
  assert.deepEqual(read.referrers, []);
  assert.deepEqual(read.countries, []);
  assert.deepEqual(read.devices, [
    { label: "Desktop", visitors: 0 },
    { label: "Mobile", visitors: 0 },
    { label: "Tablet", visitors: 0 },
    { label: "Other", visitors: 0 },
  ]);
  assert.deepEqual(read.productPageViewsBySlug, {
    "quote-request-assistant": 0,
    "ai-expense-watchdog": 0,
  });
  assert.equal(urls.every((url) => new URL(url).searchParams.get("filter") === ADMIN_EXCLUSION_FILTER && !url.includes(TOKEN)), true);
  assert.equal(urls.some((url) => url.includes("by=country")), true);
  assert.equal(urls.some((url) => url.includes("by=deviceType")), true);
  assert.equal(urls.some((url) => url.includes("by=browserName")), true);
  assert.equal(urls.some((url) => url.includes("by=osName")), true);
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

test("individual breakdown failures stay Not available without dropping KPI totals", async () => {
  const read = await readVercelAnalytics({
    range: "30d",
    now: NOW,
    productSlugs: SLUGS,
    env: { VERCEL_WEB_ANALYTICS_TOKEN: TOKEN, VERCEL_PROJECT_ID: "prj_test", VERCEL_TEAM_ID: "team_test" },
    request: async (url) => {
      if (url.includes("/visits/count")) return { ok: true, body: { data: { visitors: 11, pageviews: 20 } } };
      if (url.includes("by=country")) return { ok: false, body: { data: [{ country: "US", visitors: 99, pageviews: 99 }] } };
      if (url.includes("by=referrerHostname")) {
        return { ok: true, body: { data: [{ referrerHostname: "www.google.com", pageviews: 4, visitors: 3 }] } };
      }
      if (url.includes("by=deviceType")) {
        return { ok: true, body: { data: [{ deviceType: "desktop", pageviews: 8, visitors: 5 }] } };
      }
      if (url.includes("by=requestPath")) {
        return { ok: true, body: { data: [{ requestPath: "/ja", pageviews: 6, visitors: 4 }] } };
      }
      return { ok: false, body: { data: [] } };
    },
  });
  assert.equal(read.state, "value");
  if (read.state !== "value") return;
  assert.equal(read.visitors, 11);
  assert.equal(read.pageViews, 20);
  assert.equal(read.countries, null);
  assert.deepEqual(read.referrers, [{ label: "Google", pageViews: 4 }]);
  assert.equal(read.devices?.[0]?.label, "Desktop");
  assert.equal(read.devices?.[0]?.visitors, 5);
  assert.equal(read.browsers, null);
  assert.equal(read.operatingSystems, null);
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

test("country codes become readable labels with visitor share", () => {
  assert.equal(countryLabel("US"), "United States");
  assert.equal(countryLabel("JP"), "Japan");
  assert.equal(countryLabel("sg"), "Singapore");
  const rows = summarizeCountries(
    [
      { key: "US", pageViews: 10, visitors: 7 },
      { key: "JP", pageViews: 4, visitors: 3 },
      { key: "SG", pageViews: 1, visitors: 1 },
    ],
    11,
  );
  assert.deepEqual(rows.map((row) => row.label), ["United States", "Japan", "Singapore"]);
  assert.equal(rows[0]?.visitors, 7);
  assert.equal(rows[0]?.share, 63.6);
  assert.equal(rows.every((row) => row.share === null || row.share <= 100), true);
});

test("country share is omitted when country counts are incompatible with the Visitors KPI", () => {
  const incompatible = summarizeCountries(
    [
      { key: "US", pageViews: 20, visitors: 13 },
      { key: "JP", pageViews: 4, visitors: 2 },
    ],
    11,
  );
  assert.equal(incompatible[0]?.visitors, 13);
  assert.equal(incompatible[0]?.share, null);
  assert.equal(incompatible.every((row) => row.share === null || row.share <= 100), true);

  const pageViewOnly = summarizeCountries(
    [{ key: "US", pageViews: 13, visitors: null }],
    11,
  );
  assert.equal(pageViewOnly[0]?.visitors, 13);
  assert.equal(pageViewOnly[0]?.share, null);
});

test("referrer hosts normalize into useful traffic sources", () => {
  assert.equal(normalizeReferrerHost(""), "Direct");
  assert.equal(normalizeReferrerHost("www.google.com"), "Google");
  assert.equal(normalizeReferrerHost("google.co.jp"), "Google");
  assert.equal(normalizeReferrerHost("bing.com"), "Bing");
  assert.equal(normalizeReferrerHost("chat.openai.com"), "ChatGPT");
  assert.equal(normalizeReferrerHost("reddit.com"), "Reddit");
  assert.equal(normalizeReferrerHost("lnkd.in"), "LinkedIn");
  assert.equal(normalizeReferrerHost("t.co"), "X / Twitter");
  assert.equal(normalizeReferrerHost("x.com"), "X / Twitter");
  assert.deepEqual(
    summarizeReferrers([
      { key: "www.google.com", pageViews: 3, visitors: 2 },
      { key: "google.co.jp", pageViews: 2, visitors: 1 },
      { key: "news.ycombinator.com", pageViews: 1, visitors: 1 },
    ]),
    [
      { label: "Google", pageViews: 5 },
      { label: "news.ycombinator.com", pageViews: 1 },
    ],
  );
});

test("device browser and OS values group into stable labels", () => {
  assert.equal(normalizeDeviceLabel("desktop"), "Desktop");
  assert.equal(normalizeDeviceLabel("mobile"), "Mobile");
  assert.equal(normalizeDeviceLabel("tablet"), "Tablet");
  assert.equal(normalizeDeviceLabel("tv"), "Other");
  assert.equal(normalizeBrowserLabel("Chrome Mobile"), "Chrome");
  assert.equal(normalizeBrowserLabel("Mobile Safari"), "Safari");
  assert.equal(normalizeBrowserLabel("Edge"), "Edge");
  assert.equal(normalizeBrowserLabel("Firefox"), "Firefox");
  assert.equal(normalizeOsLabel("Mac OS X"), "macOS");
  assert.equal(normalizeOsLabel("iOS"), "iOS");
  assert.equal(normalizeOsLabel("Android"), "Android");
  assert.deepEqual(
    summarizeNamedCounts(
      [
        { key: "desktop", pageViews: 8, visitors: 5 },
        { key: "mobile", pageViews: 4, visitors: 3 },
      ],
      normalizeDeviceLabel,
      ["Desktop", "Mobile", "Tablet", "Other"],
    ),
    [
      { label: "Desktop", visitors: 5 },
      { label: "Mobile", visitors: 3 },
      { label: "Tablet", visitors: 0 },
      { label: "Other", visitors: 0 },
    ],
  );
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
  assert.match(readFileSync("components/admin/monitor-sections.tsx", "utf8"), /Visitors by country/);
  assert.match(readFileSync("components/admin/monitor-sections.tsx", "utf8"), /Top referrers/);
  assert.match(readFileSync("components/admin/monitor-sections.tsx", "utf8"), /Devices/);
});
