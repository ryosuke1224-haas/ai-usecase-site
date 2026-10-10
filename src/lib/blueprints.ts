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
];

export function authPath(nextPath: string): string {
  const params = new URLSearchParams({ next: nextPath });
  return `/auth?${params.toString()}`;
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
