import "server-only";

import { getStripe } from "@/src/lib/stripe/server";
import { buildCheckoutSessionCreateParams } from "./checkout-session";
import { loadRegistryProducts } from "./load-registry";
import { formatCheckoutPrice, previewCommerceScope } from "./preview-market";
import { findRegistryMapping, resolveTrustedPriceId } from "./registry";

export class CheckoutUnavailable extends Error {
  constructor() {
    super("Premium checkout is unavailable.");
  }
}

export async function loadPreviewPriceLabel(productSlug: string): Promise<string | null> {
  const scope = previewCommerceScope();
  if (!scope) return null;
  const products = await loadRegistryProducts();
  const row = findRegistryMapping(products, { product_slug: productSlug, ...scope });
  if (!row || row.status !== "ACTIVE" || row.price_amount == null || row.currency !== scope.currency) return null;
  const label = formatCheckoutPrice(row.price_amount, row.currency);
  return label || null;
}

export async function createHostedCheckoutUrl(input: {
  userId: string;
  email?: string;
  productSlug: string;
  origin: string;
  clientPriceId?: string;
}): Promise<string> {
  const scope = previewCommerceScope();
  if (!scope) throw new CheckoutUnavailable();
  const products = await loadRegistryProducts();
  const resolved = resolveTrustedPriceId(input.productSlug, {
    products,
    env: process.env,
    market: scope.market,
    locale: scope.locale,
    currency: scope.currency,
    environment: scope.stripe_environment,
  });
  if (!resolved.ok) throw new CheckoutUnavailable();
  const row = findRegistryMapping(products, {
    product_slug: input.productSlug,
    ...scope,
  });
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
    const stripe = getStripe(scope.market);
    const session = await stripe.checkout.sessions.create(built.params);
    if (!session.url) throw new CheckoutUnavailable();
    return session.url;
  } catch (error) {
    if (error instanceof CheckoutUnavailable) throw error;
    throw new CheckoutUnavailable();
  }
}
