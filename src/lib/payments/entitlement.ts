import { isUuid } from "./ids";
import { getPaidProduct } from "./products";

export type EntitlementWrite = {
  user_id: string;
  product_slug: string;
  access_type: "lifetime";
  status: "active";
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: null;
  purchased_at: string;
};

export type EntitlementStore = {
  upsert(row: EntitlementWrite): Promise<void>;
};

export type CheckoutCompletion = {
  id: string;
  payment_status: string | null;
  status: string | null;
  client_reference_id: string | null;
  customer: unknown;
  payment_intent: unknown;
  metadata: Record<string, string> | null;
};

export type GrantResult =
  | { granted: true }
  | {
      granted: false;
      reason: "unpaid" | "unknown_product" | "missing_user" | "mismatched_user" | "invalid_session";
    };

const CHECKOUT_SESSION_ID = /^cs_[A-Za-z0-9_]+$/;

function stripeId(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return null;
}

export function entitlementFromCheckout(
  session: CheckoutCompletion,
  now = new Date(),
): { ok: true; entitlement: EntitlementWrite } | GrantResult {
  if (session.payment_status !== "paid") return { granted: false, reason: "unpaid" };
  if (session.status !== "complete") return { granted: false, reason: "invalid_session" };
  if (!CHECKOUT_SESSION_ID.test(session.id)) return { granted: false, reason: "invalid_session" };

  const userId = session.metadata?.atlas_user_id?.trim() ?? "";
  const productSlug = session.metadata?.product_slug?.trim() ?? "";
  if (!isUuid(userId)) return { granted: false, reason: "missing_user" };
  if (session.client_reference_id !== userId) return { granted: false, reason: "mismatched_user" };

  const product = getPaidProduct(productSlug);
  if (!product || product.accessType !== "lifetime") {
    return { granted: false, reason: "unknown_product" };
  }

  return {
    ok: true,
    entitlement: {
      user_id: userId,
      product_slug: product.slug,
      access_type: "lifetime",
      status: "active",
      stripe_customer_id: stripeId(session.customer),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: stripeId(session.payment_intent),
      stripe_subscription_id: null,
      purchased_at: now.toISOString(),
    },
  };
}

export async function grantCheckoutSession(
  session: CheckoutCompletion,
  store: EntitlementStore,
  now = new Date(),
): Promise<GrantResult> {
  const mapped = entitlementFromCheckout(session, now);
  if (!("ok" in mapped)) return mapped;
  await store.upsert(mapped.entitlement);
  return { granted: true };
}
