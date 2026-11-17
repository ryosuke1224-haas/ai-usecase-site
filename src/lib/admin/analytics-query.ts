import { rangeStart, type DashboardRange } from "./range";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRODUCT_PATH = /^\/(?:(?:ja|en)\/)?blueprints\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export const ADMIN_EXCLUSION_FILTER = "not (requestPath eq '/admin' or startswith(requestPath, '/admin/'))";

export type AnalyticsPageRow = { path: string; pageViews: number };
export type AnalyticsReferrerRow = { host: string; pageViews: number };

export type AnalyticsRead =
  | { state: "not_available"; detail: string }
  | {
      state: "value";
      visitors: number;
      pageViews: number;
      productPageViews: number | null;
      topPages: AnalyticsPageRow[] | null;
      referrers: AnalyticsReferrerRow[] | null;
      productPageViewsBySlug: Record<string, number> | null;
    };

type AnalyticsResponse = { ok: boolean; body: unknown };

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
  dimension: "requestPath" | "referrerHostname",
): { rows: { key: string; pageViews: number }[]; groupedRemainder: boolean } | null {
  if (!value || typeof value !== "object") return null;
  const data = (value as { data?: unknown }).data;
  if (!Array.isArray(data)) return null;
  const rows: { key: string; pageViews: number }[] = [];
  let groupedRemainder = false;
  for (const item of data) {
    if (!item || typeof item !== "object") return null;
    const record = item as Record<string, unknown>;
    const key = record[dimension];
    const pageViews = record.pageviews;
    if (typeof key !== "string" || !isCount(pageViews)) return null;
    if (key === "Others") {
      groupedRemainder = true;
      continue;
    }
    rows.push({ key, pageViews });
  }
  return { rows, groupedRemainder };
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

export function analyticsRequestUrl(input: {
  endpoint: "count" | "aggregate";
  projectId: string;
  teamId: string | null;
  teamSlug: string | null;
  since: string;
  until: string;
  filter: string;
  by?: "requestPath" | "referrerHostname";
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
    const [pagesResponse, referrerResponse] = await Promise.all([
      input.request(analyticsRequestUrl({ ...shared, endpoint: "aggregate", by: "requestPath", limit: 100 }), token),
      input.request(analyticsRequestUrl({ ...shared, endpoint: "aggregate", by: "referrerHostname", limit: 8 }), token),
    ]);
    const pages = pagesResponse.ok ? parseDimensionRows(pagesResponse.body, "requestPath") : null;
    const referrers = referrerResponse.ok ? parseDimensionRows(referrerResponse.body, "referrerHostname") : null;
    const summary = pages ? summarizePages(pages.rows, slugs, pages.groupedRemainder) : null;
    return {
      state: "value",
      visitors: totals.visitors,
      pageViews: totals.pageViews,
      productPageViews: summary ? summary.productPageViews : null,
      topPages: summary ? summary.topPages : null,
      referrers: referrers
        ? referrers.rows
            .slice()
            .sort((a, b) => b.pageViews - a.pageViews || a.key.localeCompare(b.key))
            .slice(0, 8)
            .map((row) => ({ host: row.key, pageViews: row.pageViews }))
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
