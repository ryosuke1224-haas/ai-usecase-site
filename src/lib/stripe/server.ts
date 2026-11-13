import "server-only";

import Stripe from "stripe";
import type { MarketCode } from "@/src/lib/payments/registry";
import { envForStripeCredential, isLiveStripeKey, stripeRuntimeMode } from "@/src/lib/payments/stripe-mode";
import { selectProvisioningAccount } from "@/scripts/atlas-commerce/stripe-accounts";

/**
 * Production stores the Japanese account key in STRIPE_SECRET_KEY.
 * A live secret or restricted key selects live mode. A test key stays in sandbox.
 */
export function serverCommerceEnv(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return envForStripeCredential(env, env.STRIPE_SECRET_KEY ?? "");
}

/**
 * Server-only Stripe client. The key is never logged.
 * Live mode uses one Japanese account for both currencies.
 * Sandbox mode keeps the existing market-specific test accounts.
 */
export function getStripe(market: MarketCode = "US"): Stripe {
  const env = serverCommerceEnv();
  if (stripeRuntimeMode(env) === "live") {
    const key = env.STRIPE_SECRET_KEY?.trim() ?? "";
    if (!isLiveStripeKey(key)) {
      throw new Error("Stripe is not configured for live mode.");
    }
    return new Stripe(key);
  }
  const selected = selectProvisioningAccount({ market, environment: "SANDBOX" });
  if (!selected.ok) {
    throw new Error("Stripe is not configured for test mode.");
  }
  return new Stripe(selected.key);
}
