/**
 * Catalog of Atlas blueprints a signed-in user can access from My Blueprints.
 * Free Starter Kit access is granted to every authenticated user for now.
 * Paid entitlement rules can be added later without redesigning this list.
 */

export type BlueprintAccess = "free-authenticated" | "premium";

export type BlueprintDefinition = {
  id: string;
  title: string;
  badge: string;
  /** Protected resource path. */
  href: string;
  access: BlueprintAccess;
  summary: string;
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
];

export function authPath(nextPath: string): string {
  const params = new URLSearchParams({ next: nextPath });
  return `/auth?${params.toString()}`;
}

/**
 * Entitlement check. Today authentication alone unlocks free starters.
 * Premium products can add purchase/entitlement lookups here later.
 */
export function canAccessBlueprint(
  userId: string | null | undefined,
  blueprint: BlueprintDefinition,
): boolean {
  if (!userId) return false;
  if (blueprint.access === "free-authenticated") return true;
  // Future: look up purchases / entitlements for premium blueprints.
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
