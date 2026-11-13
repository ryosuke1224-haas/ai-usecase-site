export const JAPANESE_FEATURED_SLUGS = [
  "quote-request-assistant",
  "ai-expense-watchdog",
  "google-ads-performance-coach",
  "ai-daily-inbox-briefing",
] as const;

export function japaneseFeaturedCta(slug: string): string {
  return slug === "ai-daily-inbox-briefing" ? "無料で試す" : "テンプレートを見る";
}
