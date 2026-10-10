import "server-only";

import { headers } from "next/headers";
import { blueprintCatalog, type BlueprintDefinition } from "@/src/lib/blueprints";
import { createClient } from "@/src/lib/supabase/server";
import { E2E_ENTITLEMENT_HEADER, isE2eEntitlementGrant } from "./e2e-grant";
import { COLLECTIONS_PRODUCT_SLUG } from "./products";

export type BlueprintCard = BlueprintDefinition & { unlocked: boolean };

async function e2eGrantedSlug(): Promise<string | null> {
  const headerList = await headers();
  const granted = isE2eEntitlementGrant(
    headerList.get(E2E_ENTITLEMENT_HEADER),
    process.env,
    headerList.get("host") ?? headerList.get("x-forwarded-host"),
  );
  return granted ? COLLECTIONS_PRODUCT_SLUG : null;
}

/** Active product slugs for this user. Missing table or query errors fail closed. */
export async function listActiveProductSlugs(userId: string): Promise<Set<string>> {
  const slugs = new Set<string>();
  const e2eSlug = await e2eGrantedSlug();
  if (e2eSlug) slugs.add(e2eSlug);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entitlements")
      .select("product_slug")
      .eq("user_id", userId)
      .eq("status", "active");
    if (error || !data) return slugs;
    for (const row of data) {
      if (row && typeof row.product_slug === "string") slugs.add(row.product_slug);
    }
  } catch {
    return slugs;
  }
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
