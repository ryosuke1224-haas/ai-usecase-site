import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import type { EntitlementWrite } from "./entitlement";

/** Upserts one lifetime entitlement. The unique user/product key keeps retries idempotent. */
export async function upsertEntitlement(row: EntitlementWrite): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("entitlements").upsert(
    {
      user_id: row.user_id,
      product_slug: row.product_slug,
      access_type: row.access_type,
      status: row.status,
      stripe_customer_id: row.stripe_customer_id,
      stripe_checkout_session_id: row.stripe_checkout_session_id,
      stripe_payment_intent_id: row.stripe_payment_intent_id,
      stripe_subscription_id: row.stripe_subscription_id,
      purchased_at: row.purchased_at,
    },
    { onConflict: "user_id,product_slug" },
  );
  if (error) {
    throw new Error("Could not save the entitlement.");
  }
}
