export type SiteMode = "coming-soon" | "live";

/**
 * Server-side site mode. Evaluated only from SITE_MODE (not NEXT_PUBLIC_*).
 * Defaults to "live" when unset so local/preview work keeps the full app.
 */
export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === "coming-soon" ? "coming-soon" : "live";
}

export function isComingSoonMode(): boolean {
  return getSiteMode() === "coming-soon";
}

export function isLiveMode(): boolean {
  return getSiteMode() === "live";
}
