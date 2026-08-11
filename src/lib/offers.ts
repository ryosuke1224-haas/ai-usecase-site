/**
 * Destinations for the commercial offers on experience-led use-case pages.
 *
 * Free Starter Kit CTAs always point at the protected starter-kit route.
 * That route verifies the session server-side and sends logged-out visitors
 * into /auth while preserving `next`.
 *
 * Local / App still fall back to /contact until their real destinations exist.
 */

import { DAILY_INBOX_STARTER_KIT_PATH } from "@/src/lib/blueprints";

export type OfferKey = "starter" | "local" | "app";

const CONTACT_ROUTE = "/contact";

function readConfiguredUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("/")) return trimmed;

  try {
    return new URL(trimmed).toString();
  } catch {
    return undefined;
  }
}

export type OfferDestination = {
  href: string;
  /** True when falling back because no product URL is configured. */
  isFallback: boolean;
};

/** Protected Starter Kit path — auth gate lives on that route. */
export function getStarterKitHref(): string {
  return DAILY_INBOX_STARTER_KIT_PATH;
}

export function getOfferDestination(key: OfferKey): OfferDestination {
  if (key === "starter") {
    return {
      href: getStarterKitHref(),
      isFallback: false,
    };
  }

  const configured = readConfiguredUrl(
    {
      local: process.env.NEXT_PUBLIC_LOCAL_PILOT_URL,
      app: process.env.NEXT_PUBLIC_APP_WAITLIST_URL,
    }[key],
  );

  return configured
    ? { href: configured, isFallback: false }
    : { href: CONTACT_ROUTE, isFallback: true };
}

/** Full sample briefing document. Undefined until a real file exists. */
export function getSampleBriefingUrl(): string | undefined {
  return readConfiguredUrl(process.env.NEXT_PUBLIC_SAMPLE_BRIEFING_URL);
}
