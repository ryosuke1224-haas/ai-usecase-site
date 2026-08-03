/**
 * Destinations for the commercial offers on experience-led use-case pages.
 *
 * No checkout, waitlist backend, or payment flow exists yet, so each offer
 * resolves in one of two ways:
 *
 * - An operator sets the matching NEXT_PUBLIC_* variable to a real URL
 *   (Stripe payment link, Tally form, Gumroad page) and the CTA becomes live.
 * - Nothing is configured, and the CTA falls back to the existing /contact
 *   route so it always leads somewhere real instead of a broken checkout.
 *
 * Sections with no meaningful fallback (the setup walkthrough, the full sample
 * briefing) resolve to `undefined` so the UI can render a disabled
 * "coming soon" state rather than inventing a destination.
 */

export type OfferKey = "manual" | "local" | "app";

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
      manual: process.env.NEXT_PUBLIC_MANUAL_PLAYBOOK_URL,
      local: process.env.NEXT_PUBLIC_LOCAL_PILOT_URL,
      app: process.env.NEXT_PUBLIC_APP_WAITLIST_URL,
    }[key],
  );

  return configured
    ? { href: configured, isFallback: false }
    : { href: CONTACT_ROUTE, isFallback: true };
}

/**
 * Interactive setup walkthrough (Supademo or similar). Returns undefined until
 * configured so the section can render as an explicit preview placeholder.
 */
export function getSetupPreviewUrl(): string | undefined {
  return readConfiguredUrl(process.env.NEXT_PUBLIC_SETUP_PREVIEW_URL);
}

/** Full sample briefing document. Undefined until a real file exists. */
export function getSampleBriefingUrl(): string | undefined {
  return readConfiguredUrl(process.env.NEXT_PUBLIC_SAMPLE_BRIEFING_URL);
}
