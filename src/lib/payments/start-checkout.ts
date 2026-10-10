import "server-only";

import { getStripe } from "@/src/lib/stripe/server";
import {
  buildCheckoutSessionCreateParams,
  serverPriceForProduct,
} from "./checkout-session";

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
  const built = buildCheckoutSessionCreateParams({
    userId: input.userId,
    email: input.email,
    productSlug: input.productSlug,
    origin: input.origin,
    serverPriceId: serverPriceForProduct(input.productSlug),
    clientPriceId: input.clientPriceId,
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
