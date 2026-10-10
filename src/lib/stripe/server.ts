import "server-only";

import Stripe from "stripe";

function isTestSecretKey(key: string): boolean {
  return key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

/** Server-only Stripe client. Uses the test secret key and never logs it. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key) {
    throw new Error("Stripe is not configured.");
  }
  if (!isTestSecretKey(key)) {
    throw new Error("Stripe is not configured for test mode.");
  }
  return new Stripe(key);
}
