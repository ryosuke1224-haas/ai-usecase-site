import "server-only";

import { getStripe } from "@/src/lib/stripe/server";
import { buildCheckoutSessionCreateParams } from "./checkout-session";
import { loadRegistryProducts } from "./load-registry";
import { resolveTrustedPriceId } from "./registry";

export class CheckoutUnavailable extends Error {
  constructor() {
    super("Premium checkout is unavailable.");
  }
}

export async function createHostedCheckoutUrl(input: {
  userId: string;
  email?: string;
  productSlug: string;
  origin: string;
  clientPriceId?: string;
}): Promise<string> {
  const products = await loadRegistryProducts();
  const resolved = resolveTrustedPriceId(input.productSlug, { products, env: process.env });
  if (!resolved.ok) throw new CheckoutUnavailable();
  const row = products.find((item) => item.product_slug === input.productSlug);
  const built = buildCheckoutSessionCreateParams({
    userId: input.userId,
    email: input.email,
    productSlug: input.productSlug,
    origin: input.origin,
    serverPriceId: resolved.priceId,
    clientPriceId: input.clientPriceId,
    registryStatus: row?.status ?? null,
  });
  if (!built.ok) throw new CheckoutUnavailable();

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(built.params);
    if (!session.url) throw new CheckoutUnavailable();
    return session.url;
  } catch (error) {
    if (error instanceof CheckoutUnavailable) throw error;
    throw new CheckoutUnavailable();
  }
}
