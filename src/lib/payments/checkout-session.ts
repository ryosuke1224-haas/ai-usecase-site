import { isUuid } from "./ids";
import { getPaidProduct } from "./products";

export type CheckoutSessionParams = {
  mode: "payment";
  line_items: [{ price: string; quantity: 1 }];
  success_url: string;
  cancel_url: string;
  client_reference_id: string;
  customer_email?: string;
  metadata: {
    atlas_user_id: string;
    product_slug: string;
  };
};

export type CheckoutBuildResult =
  | { ok: true; params: CheckoutSessionParams }
  | { ok: false; error: "unknown_product" | "missing_price" | "invalid_origin" | "invalid_user" };

const PRICE_ID = /^price_[A-Za-z0-9]+$/;

export function serverPriceForProduct(
  slug: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const product = getPaidProduct(slug);
  if (!product) return undefined;
  return env[product.priceEnv]?.trim();
}

function safeEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function httpOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Builds a hosted Checkout Session from the server-side price.
 * clientPriceId is accepted so callers can pass browser input through and drop it.
 */
export function buildCheckoutSessionCreateParams(input: {
  userId: string;
  email?: string;
  productSlug: string;
  origin: string;
  serverPriceId: string | undefined;
  clientPriceId?: string;
}): CheckoutBuildResult {
  void input.clientPriceId;

  const product = getPaidProduct(input.productSlug);
  if (!product) return { ok: false, error: "unknown_product" };
  if (!isUuid(input.userId)) return { ok: false, error: "invalid_user" };

  const origin = httpOrigin(input.origin);
  if (!origin) return { ok: false, error: "invalid_origin" };

  const price = input.serverPriceId?.trim() ?? "";
  if (!PRICE_ID.test(price)) return { ok: false, error: "missing_price" };

  const email = safeEmail(input.email);
  return {
    ok: true,
    params: {
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}${product.successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${product.cancelPath}`,
      client_reference_id: input.userId,
      ...(email ? { customer_email: email } : {}),
      metadata: {
        atlas_user_id: input.userId,
        product_slug: product.slug,
      },
    },
  };
}
