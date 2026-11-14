export type AnalyticsEvent = {
  type: "pageview" | "event";
  url: string;
};

/** Drops private operations routes. Other paths, including /business-areas, are kept. */
export function analyticsBeforeSend<T extends AnalyticsEvent>(event: T): T | null {
  let pathname = "";
  try {
    pathname = new URL(event.url, "https://aiusecaseatlas.com").pathname;
  } catch {
    return null;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return event;
}
