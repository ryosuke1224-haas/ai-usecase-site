import { rangeStart, type DashboardRange } from "./range";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_PATH = /^\/(?:(?:ja|en)\/)?blueprints\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;
const REGION_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

export const ADMIN_EXCLUSION_FILTER = "not (requestPath eq '/admin' or startswith(requestPath, '/admin/'))";

export type AnalyticsDimension =
  | "requestPath"
  | "referrerHostname"
  | "country"
  | "deviceType"
  | "browserName"
  | "osName";

export type AnalyticsPageRow = { path: string; pageViews: number };
export type AnalyticsReferrerRow = { label: string; pageViews: number };
export type AnalyticsCountryRow = { code: string; label: string; visitors: number; share: number | null };
export type AnalyticsNamedCountRow = { label: string; visitors: number };

export type AnalyticsRead =
  | { state: "not_available"; detail: string }
  | {
      state: "value";
      visitors: number;
      pageViews: number;
      productPageViews: number | null;
      topPages: AnalyticsPageRow[] | null;
      referrers: AnalyticsReferrerRow[] | null;
      countries: AnalyticsCountryRow[] | null;
      devices: AnalyticsNamedCountRow[] | null;
      browsers: AnalyticsNamedCountRow[] | null;
      operatingSystems: AnalyticsNamedCountRow[] | null;
      productPageViewsBySlug: Record<string, number> | null;
    };

type AnalyticsResponse = { ok: boolean; body: unknown };
type DimensionRow = { key: string; pageViews: number; visitors: number | null };

export function analyticsRange(range: DashboardRange, now: Date): { since: string; until: string } {
  return {
    since: String(rangeStart(range, now).getTime()),
    until: String(now.getTime()),
  };
}

export function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

export function productSlugFromPath(path: string, slugs: readonly string[]): string | null {
  if (isAdminPath(path)) return null;
  const match = PRODUCT_PATH.exec(path);
  const slug = match?.[1];
  if (!slug || !slugs.includes(slug)) return null;
  return slug;
}

export function parseVisitCount(value: unknown): { visitors: number; pageViews: number } | null {
  if (!value || typeof value !== "object") return null;
  const data = (value as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const visitors = (data as { visitors?: unknown }).visitors;
  const pageViews = (data as { pageviews?: unknown }).pageviews;
  if (!isCount(visitors) || !isCount(pageViews)) return null;
  return { visitors, pageViews };
}

export function parseDimensionRows(
  value: unknown,
  dimension: AnalyticsDimension,
): { rows: DimensionRow[]; groupedRemainder: boolean } | null {
  if (!value || typeof value !== "object") return null;
  const data = (value as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const rows: DimensionRow[] = [];
  let groupedRemainder = false;
  for (const item of data) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const key = record[dimension];
    const pageViews = record.pageviews;
    const visitors = record.visitors;
    if (typeof key !== "string" || !isCount(pageViews)) return null;
    if (visitors !== undefined && !isCount(visitors)) return null;
    if (key === "Others") {
      groupedRemainder = true;
      continue;
    }
    rows.push({ key, pageViews, visitors: isCount(visitors) ? visitors : null });
  }
  return { rows, groupedRemainder };
}

export function countryLabel(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return code.trim() || "Unknown";
  try {
    return REGION_NAMES.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

export function normalizeReferrerHost(host: string): string {
  const raw = host.trim().toLowerCase().replace(/^www\./, "");
  if (!raw || raw === "-" || raw === "(direct)" || raw === "direct") return "Direct";
  if (raw === "google.com" || raw.endsWith(".google.com") || /^google\.[a-z.]+$/.test(raw)) return "Google";
  if (raw === "bing.com" || raw.endsWith(".bing.com")) return "Bing";
  if (raw === "chatgpt.com" || raw === "chat.openai.com" || raw.endsWith(".chatgpt.com")) return "ChatGPT";
  if (raw === "reddit.com" || raw.endsWith(".reddit.com")) return "Reddit";
  if (raw === "linkedin.com" || raw.endsWith(".linkedin.com") || raw === "lnkd.in") return "LinkedIn";
  if (raw === "x.com" || raw === "twitter.com" || raw === "t.co" || raw.endsWith(".twitter.com") || raw.endsWith(".x.com")) {
    return "X / Twitter";
  }
  return raw;
}

export function normalizeDeviceLabel(value: string): string {
  const key = value.trim().toLowerCase();
  if (key === "desktop") return "Desktop";
  if (key === "mobile") return "Mobile";
  if (key === "tablet") return "Tablet";
  return "Other";
}

export function normalizeBrowserLabel(value: string): string {
  const key = value.trim().toLowerCase();
  if (key.includes("chrome") && !key.includes("edge")) return "Chrome";
  if (key.includes("safari") && !key.includes("chrome")) return "Safari";
  if (key.includes("edge")) return "Edge";
  if (key.includes("firefox")) return "Firefox";
  return "Other";
}

export function normalizeOsLabel(value: string): string {
  const key = value.trim().toLowerCase().replace(/\s+/g, "");
  if (key.includes("windows")) return "Windows";
  if (key.includes("mac") || key.includes("darwin")) return "macOS";
  if (key.includes("ios") || key === "iphone" || key === "ipad") return "iOS";
  if (key.includes("android")) return "Android";
  if (key.includes("linux")) return "Linux";
  return "Other";
}

export function summarizePages(
  rows: readonly { key: string; pageViews: number }[],
  slugs: readonly string[],
  groupedRemainder: boolean,
): {
  topPages: AnalyticsPageRow[];
  productPageViews: number | null;
  productPageViewsBySlug: Record<string, number> | null;
} {
  const visible = rows.filter((row) => !isAdminPath(row.key));
  const topPages = visible
    .slice()
    .sort((a, b) => b.pageViews - a.pageViews || a.key.localeCompare(b.key))
    .slice(0, 8)
    .map((row) => ({ path: row.key, pageViews: row.pageViews }));
  if (groupedRemainder) {
    return { topPages, productPageViews: null, productPageViewsBySlug: null };
  }
  const bySlug: Record<string, number> = {};
  for (const slug of slugs) bySlug[slug] = 0;
  for (const row of visible) {
    const slug = productSlugFromPath(row.key, slugs);
    if (!slug) continue;
    bySlug[slug] = (bySlug[slug] ?? 0) + row.pageViews;
  }
  const productPageViews = Object.values(bySlug).reduce((sum, count) => sum + count, 0);
  return { topPages, productPageViews, productPageViewsBySlug: bySlug };
}

export function summarizeReferrers(rows: readonly DimensionRow[], limit = 8): AnalyticsReferrerRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const label = normalizeReferrerHost(row.key);
    totals.set(label, (totals.get(label) ?? 0) + row.pageViews);
  }
  return [...totals.entries()]
    .map(([label, pageViews]) => ({ label, pageViews }))
    .sort((a, b) => b.pageViews - a.pageViews || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function summarizeCountries(
  rows: readonly DimensionRow[],
  totalVisitors: number,
  limit = 10,
): AnalyticsCountryRow[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const code = row.key.trim().toUpperCase() || "ZZ";
    const count = row.visitors ?? row.pageViews;
    totals.set(code, (totals.get(code) ?? 0) + count);
  }
  return [...totals.entries()]
    .map(([code, visitors]) => ({
      code,
      label: countryLabel(code),
      visitors,
      share: totalVisitors > 0 ? Math.round((visitors / totalVisitors) * 1000) / 10 : null,
    }))
    .sort((a, b) => b.visitors - a.visitors || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function summarizeNamedCounts(
  rows: readonly DimensionRow[],
  normalize: (value: string) => string,
  order: readonly string[],
): AnalyticsNamedCountRow[] {
  const totals = new Map<string, number>();
  for (const label of order) totals.set(label, 0);
  for (const row of rows) {
    const label = normalize(row.key);
    const count = row.visitors ?? row.pageViews;
    totals.set(label, (totals.get(label) ?? 0) + count);
  }
  return order.map((label) => ({ label, visitors: totals.get(label) ?? 0 }));
}

export function analyticsRequestUrl(input: {
  endpoint: "count" | "aggregate";
  projectId: string;
  teamId: string | null;
  teamSlug: string | null;
  since: string;
  until: string;
  filter: string;
  by?: AnalyticsDimension;
  limit?: number;
}): string {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/visits/${input.endpoint}`);
  url.searchParams.set("projectId", input.projectId);
  if (input.teamId) url.searchParams.set("teamId", input.teamId);
  else if (input.teamSlug) url.searchParams.set("slug", input.teamSlug);
  url.searchParams.set("since", input.since);
  url.searchParams.set("until", input.until);
  url.searchParams.set("filter", input.filter);
  if (input.by) url.searchParams.set("by", input.by);
  if (input.limit) url.searchParams.set("limit", String(input.limit));
  return url.toString();
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function safeSlug(slug: string): boolean {
  return SLUG.test(slug);
}

async function readDimension(
  request: (url: string, token: string) => Promise<AnalyticsResponse>,
  token: string,
  shared: {
    projectId: string;
    teamId: string | null;
    teamSlug: string | null;
    since: string;
    until: string;
    filter: string;
  },
  by: AnalyticsDimension,
  limit: number,
): Promise<{ rows: DimensionRow[]; groupedRemainder: boolean } | null> {
  try {
    const response = await request(analyticsRequestUrl({ ...shared, endpoint: "aggregate", by, limit }), token);
    if (!response.ok) return null;
    return parseDimensionRows(response.body, by);
  } catch {
    return null;
  }
}

export async function readVercelAnalytics(input: {
  range: DashboardRange;
  now: Date;
  productSlugs: readonly string[];
  env: Record<string, string | undefined>;
  request: (url: string, token: string) => Promise<AnalyticsResponse>;
}): Promise<AnalyticsRead> {
  const token = input.env.VERCEL_WEB_ANALYTICS_TOKEN?.trim() ?? "";
  const projectId = input.env.VERCEL_PROJECT_ID?.trim() ?? "";
  const teamId = input.env.VERCEL_TEAM_ID?.trim() || null;
  const teamSlug = input.env.VERCEL_TEAM_SLUG?.trim() || null;
  if (!token) {
    return {
      state: "not_available",
      detail: "The server-only VERCEL_WEB_ANALYTICS_TOKEN is not set, so visitors and page views are not available.",
    };
  }
  if (!projectId) {
    return {
      state: "not_available",
      detail: "VERCEL_PROJECT_ID is not set on this server, so analytics cannot be read.",
    };
  }
  const window = analyticsRange(input.range, input.now);
  const slugs = input.productSlugs.filter(safeSlug);
  const shared = {
    projectId,
    teamId,
    teamSlug,
    since: window.since,
    until: window.until,
    filter: ADMIN_EXCLUSION_FILTER,
  };
  try {
    const countResponse = await input.request(
      analyticsRequestUrl({ ...shared, endpoint: "count" }),
      token,
    );
    if (!countResponse.ok) return unavailable();
    const totals = parseVisitCount(countResponse.body);
    if (!totals) return unavailable();
    const [pages, referrers, countries, devices, browsers, operatingSystems] = await Promise.all([
      readDimension(input.request, token, shared, "requestPath", 100),
      readDimension(input.request, token, shared, "referrerHostname", 20),
      readDimension(input.request, token, shared, "country", 10),
      readDimension(input.request, token, shared, "deviceType", 10),
      readDimension(input.request, token, shared, "browserName", 10),
      readDimension(input.request, token, shared, "osName", 10),
    ]);
    const summary = pages ? summarizePages(pages.rows, slugs, pages.groupedRemainder) : null;
    return {
      state: "value",
      visitors: totals.visitors,
      pageViews: totals.pageViews,
      productPageViews: summary ? summary.productPageViews : null,
      topPages: summary ? summary.topPages : null,
      referrers: referrers ? summarizeReferrers(referrers.rows) : null,
      countries: countries ? summarizeCountries(countries.rows, totals.visitors) : null,
      devices: devices ? summarizeNamedCounts(devices.rows, normalizeDeviceLabel, ["Desktop", "Mobile", "Tablet", "Other"]) : null,
      browsers: browsers ? summarizeNamedCounts(browsers.rows, normalizeBrowserLabel, ["Chrome", "Safari", "Edge", "Firefox", "Other"]) : null,
      operatingSystems: operatingSystems
        ? summarizeNamedCounts(operatingSystems.rows, normalizeOsLabel, ["Windows", "macOS", "iOS", "Android", "Linux", "Other"])
        : null,
      productPageViewsBySlug: summary ? summary.productPageViewsBySlug : null,
    };
  } catch {
    return unavailable();
  }
}

function unavailable(): AnalyticsRead {
  return {
    state: "not_available",
    detail: "Vercel Web Analytics could not be read. Check the server token, project, and VERCEL_TEAM_ID for a team project.",
  };
}
