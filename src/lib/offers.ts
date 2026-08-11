/**
 * Destinations for the commercial offers on experience-led use-case pages.
 *
 * No authentication, gated download, or payment flow exists yet, so each offer
 * resolves in one of two ways:
 *
 * - An operator sets the matching NEXT_PUBLIC_* variable to a real URL
 *   (signup route, Stripe payment link, Tally form) and the CTA becomes live.
 * - Nothing is configured, and the CTA falls back to the existing /contact
 *   route so it always leads somewhere real instead of a broken checkout.
 *
 * The Free Starter Kit CTA is deliberately structured the same way so the next
 * task can point NEXT_PUBLIC_STARTER_KIT_URL at an authenticated download or
 * signup flow without redesigning the page.
 *
 * Sections with no meaningful fallback (the full sample briefing) resolve to
 * `undefined` so the UI can render a disabled "coming soon" state.
 */

export type OfferKey = "starter" | "local" | "app";

const CONTACT_ROUTE = "/contact";

/** Same validation approach as the configured Tally form URL on the homepage. */
function readConfiguredUrl(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  // Allow site-relative paths as well as absolute URLs.
  if (trimmed.startsWith("/")) return trimmed;

  try {
    return new URL(trimmed).toString();
  } catch {
    return undefined;
  }
}

export type OfferDestination = {
  href: string;
  /** True when falling back to /contact because no product URL is configured. */
  isFallback: boolean;
};

export function getOfferDestination(key: OfferKey): OfferDestination {
  const configured = readConfiguredUrl(
    {
      // Prefer the starter-kit URL; accept the older manual env var during transition.
      starter:
        process.env.NEXT_PUBLIC_STARTER_KIT_URL ??
        process.env.NEXT_PUBLIC_MANUAL_PLAYBOOK_URL,
      local: process.env.NEXT_PUBLIC_LOCAL_PILOT_URL,
      app: process.env.NEXT_PUBLIC_APP_WAITLIST_URL,
    }[key],
  );

  return configured
    ? { href: configured, isFallback: false }
    : { href: CONTACT_ROUTE, isFallback: true };
}

/** Convenience alias used by mid-page and final Starter Kit CTAs. */
export function getStarterKitDestination(): OfferDestination {
  return getOfferDestination("starter");
}

/** Full sample briefing document. Undefined until a real file exists. */
export function getSampleBriefingUrl(): string | undefined {
  return readConfiguredUrl(process.env.NEXT_PUBLIC_SAMPLE_BRIEFING_URL);
}
