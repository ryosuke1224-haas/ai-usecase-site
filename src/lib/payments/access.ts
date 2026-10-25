import "server-only";

import { headers } from "next/headers";
import { blueprintCatalog, type BlueprintDefinition } from "@/src/lib/blueprints";
import { createClient } from "@/src/lib/supabase/server";
import { E2E_ENTITLEMENT_HEADER, isE2eEntitlementDenied, isE2eEntitlementGrant } from "./e2e-grant";
import { COLLECTIONS_PRODUCT_SLUG } from "./products";

export type BlueprintCard = BlueprintDefinition & { unlocked: boolean };

async function e2eEntitlementOverride(): Promise<"grant" | "deny" | null> {
  const headerList = await headers();
  const host = headerList.get("host") ?? headerList.get("x-forwarded-host");
  const header = headerList.get(E2E_ENTITLEMENT_HEADER);
  if (isE2eEntitlementDenied(header, process.env, host)) return "deny";
  if (isE2eEntitlementGrant(header, process.env, host)) return "grant";
  return null;
}

/** Active product slugs for this user. Missing table or query errors fail closed. */
export async function listActiveProductSlugs(userId: string): Promise<Set<string>> {
  const slugs = new Set<string>();
  const override = await e2eEntitlementOverride();
  if (override === "grant") slugs.add(COLLECTIONS_PRODUCT_SLUG);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entitlements")
      .select("product_slug")
      .eq("user_id", userId)
      .eq("status", "active");
    if (!error && data) {
      for (const row of data) {
        if (row && typeof row.product_slug === "string") slugs.add(row.product_slug);
      }
    }
  } catch {
    // Fail closed for database access. A local test deny still applies below.
  }
  if (override === "deny") slugs.delete(COLLECTIONS_PRODUCT_SLUG);
  return slugs;
}

export async function hasActiveEntitlement(
  userId: string,
  productSlug: string,
): Promise<boolean> {
  const slugs = await listActiveProductSlugs(userId);
  return slugs.has(productSlug);
}

export async function listBlueprintCards(userId: string): Promise<BlueprintCard[]> {
  const slugs = await listActiveProductSlugs(userId);
  return blueprintCatalog.map((item) => ({
    ...item,
    unlocked:
      item.access === "free-authenticated" ||
      (item.productSlug ? slugs.has(item.productSlug) : false),
  }));
}
