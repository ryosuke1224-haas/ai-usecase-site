/**
 * Catalog of Atlas blueprints shown on My Blueprints.
 * Free Starter Kits are unlocked for every signed-in user.
 * Premium cards use the entitlement lookup in src/lib/payments/access.ts.
 */

export type BlueprintAccess = "free-authenticated" | "premium";

export type BlueprintDefinition = {
  id: string;
  title: string;
  badge: string;
  /** Protected resource path. Used when the blueprint is unlocked. */
  href: string;
  access: BlueprintAccess;
  summary: string;
  /** Matches entitlements.product_slug for a paid blueprint. */
  productSlug?: string;
  /** Signed-in users without access start here. */
  purchaseHref?: string;
};

export const DAILY_INBOX_STARTER_KIT_PATH =
  "/blueprints/daily-inbox-briefing/starter-kit";

export const MY_BLUEPRINTS_PATH = "/my-blueprints";

export const blueprintCatalog: BlueprintDefinition[] = [
{
    id: "daily-inbox-briefing-starter-kit",
    title: "AI Daily Inbox Briefing",
    badge: "FREE STARTER",
    href: DAILY_INBOX_STARTER_KIT_PATH,
    access: "free-authenticated",
    summary:
      "Prompts, setup guides, worksheets, and review tools for the free starter workflow.",
  },
{
    id: "ai-collections-assistant",
    title: "AI Collections Assistant",
    badge: "PREMIUM",
    href: "/blueprints/ai-collections-assistant/kit",
    purchaseHref: "/blueprints/ai-collections-assistant",
    productSlug: "ai-collections-assistant",
    access: "premium",
    summary:
      "A weekly collections queue you review yourself before anything is sent.",
  },
{
    id: "security-readiness-action-pack",
    title: "Security Readiness Action Pack",
    badge: "PREMIUM",
    href: "/blueprints/security-readiness-action-pack/kit",
    purchaseHref: "/blueprints/security-readiness-action-pack",
    productSlug: "security-readiness-action-pack",
    access: "premium",
    summary:
      "A quarterly readiness queue you review yourself. The kit does not scan, certify, or change accounts.",
  },
{
    id: "google-ads-performance-coach",
    title: "Google Ads Performance Coach",
    badge: "PREMIUM",
    href: "/blueprints/google-ads-performance-coach/kit",
    purchaseHref: "/blueprints/google-ads-performance-coach",
    productSlug: "google-ads-performance-coach",
    access: "premium",
    summary:
      "A measurement-first review you run yourself before any budget move. The kit does not edit Google Ads.",
  },
{
    id: "quote-request-assistant",
    title: "Quote Request Assistant",
    badge: "PREMIUM",
    href: "/blueprints/quote-request-assistant/kit",
    purchaseHref: "/blueprints/quote-request-assistant",
    productSlug: "quote-request-assistant",
    access: "premium",
    summary:
      "Paste a quote request, extract labelled scope against your written rules, and review a draft. You price and send.",
  },
{
    id: "ai-expense-watchdog",
    title: "AI Expense Watchdog",
    badge: "PREMIUM",
    href: "/blueprints/ai-expense-watchdog/kit",
    purchaseHref: "/blueprints/ai-expense-watchdog",
    productSlug: "ai-expense-watchdog",
    access: "premium",
    summary:
      "A recurring-charge ledger from a card or accounting CSV. You decide what to cancel. The kit never cancels or connects to a bank.",
  },
{
    id: "no-show-recovery-assistant",
    title: "No-show Recovery Assistant",
    badge: "PREMIUM",
    href: "/blueprints/no-show-recovery-assistant/kit",
    purchaseHref: "/blueprints/no-show-recovery-assistant",
    productSlug: "no-show-recovery-assistant",
    access: "premium",
    summary:
      "Labelled no-show drafts with real open times and a consent check. You review and send. The kit never texts, emails, or books.",
  },
{
    id: "unbilled-work-review-queue",
    title: "Unbilled Work Review Queue",
    badge: "PREMIUM",
    href: "/blueprints/unbilled-work-review-queue/kit",
    purchaseHref: "/blueprints/unbilled-work-review-queue",
    productSlug: "unbilled-work-review-queue",
    access: "premium",
    summary:
      "A skip-ruled unbilled queue from a job export. You create the invoice. Nothing is sent or collected.",
  },
{
    id: "ai-customer-response-assistant",
    title: "On-brand Reply Review Queue",
    badge: "PREMIUM",
    href: "/blueprints/ai-customer-response-assistant/kit",
    purchaseHref: "/blueprints/ai-customer-response-assistant",
    productSlug: "ai-customer-response-assistant",
    access: "premium",
    summary:
      "Paste one inbound message, stop drafts on the owner's escalate list, and answer only from pasted FAQ facts. The owner reviews and sends. The kit never emails a customer.",
  },
{
    id: "ai-pipeline-risk-detector",
    title: "Stalled Deal Rescue Queue",
    badge: "PREMIUM",
    href: "/blueprints/ai-pipeline-risk-detector/kit",
    purchaseHref: "/blueprints/ai-pipeline-risk-detector",
    productSlug: "ai-pipeline-risk-detector",
    access: "premium",
    summary:
      "A skip-ruled stall queue from an open-deals export. You send the recovery note. Nothing is sent or written to the CRM.",
  },
{
    id: "ai-payroll-forecasting",
    title: "Next-Pay Labor Check",
    badge: "PREMIUM",
    href: "/blueprints/ai-payroll-forecasting/kit",
    purchaseHref: "/blueprints/ai-payroll-forecasting",
    productSlug: "ai-payroll-forecasting",
    access: "premium",
    summary:
      "Loaded payroll from the posted schedule with visible formulas. You edit the schedule. The kit changes nothing.",
  },
{
    id: "ai-proposal-follow-up-assistant",
    title: "Quiet Proposal Chase Queue",
    badge: "PREMIUM",
    href: "/blueprints/ai-proposal-follow-up-assistant/kit",
    purchaseHref: "/blueprints/ai-proposal-follow-up-assistant",
    productSlug: "ai-proposal-follow-up-assistant",
    access: "premium",
    summary:
      "A skip-ruled silence queue from a sent-proposal export. You send the follow-up. Nothing is sent automatically.",
  },
{
    id: "ai-staffing-optimizer",
    title: "Shift Coverage vs Demand Check",
    badge: "PREMIUM",
    href: "/blueprints/ai-staffing-optimizer/kit",
    purchaseHref: "/blueprints/ai-staffing-optimizer",
    productSlug: "ai-staffing-optimizer",
    access: "premium",
    summary:
      "Hourly POS demand against clocked hours under owner minimums and a 3-of-4-weeks rule. You edit the schedule. The kit changes nothing.",
  },
  {
    id: "inactive-customer-winback",
    title: "Lapsed Customer Return Queue",
    badge: "PREMIUM",
    href: "/blueprints/inactive-customer-winback/kit",
    purchaseHref: "/blueprints/inactive-customer-winback",
    productSlug: "inactive-customer-winback",
    access: "premium",
    summary:
      "A consent-filtered, VIP-first winback queue from a stripped customer export. You review and send. Nothing is sent automatically, and the kit never invents a discount.",
  },
];

export function authPath(nextPath: string, locale?: "ja" | "en"): string {
  const params = new URLSearchParams({ next: nextPath });
  const base = locale ? `/${locale}/auth` : "/auth";
  return `${base}?${params.toString()}`;
}

/**
 * Free Starter Kits are available to every signed-in user.
 * Premium Blueprints stay closed here. Kit pages call hasActiveEntitlement.
 */
export function canAccessBlueprint(
  userId: string | null | undefined,
  blueprint: BlueprintDefinition,
): boolean {
  if (!userId) return false;
  if (blueprint.access === "free-authenticated") return true;
  return false;
}

export function getBlueprintById(id: string): BlueprintDefinition | undefined {
  return blueprintCatalog.find((item) => item.id === id);
}

export function listUnlockedBlueprints(userId: string): BlueprintDefinition[] {
  return blueprintCatalog.filter((item) => canAccessBlueprint(userId, item));
}

/** Safe internal redirect target — only same-origin relative paths. */
export function sanitizeNextPath(
  candidate: string | null | undefined,
  fallback = MY_BLUEPRINTS_PATH,
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("://")) return fallback;
  return candidate;
}
