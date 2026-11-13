import "server-only";

import Stripe from "stripe";
import type { MarketCode } from "@/src/lib/payments/registry";
import { isLiveStripeKey, stripeRuntimeMode } from "@/src/lib/payments/stripe-mode";
import { selectProvisioningAccount } from "@/scripts/atlas-commerce/stripe-accounts";

/**
 * Server-only Stripe client. The key is never logged.
 * Live mode uses one Japanese account for both currencies.
 * Sandbox mode keeps the existing market-specific test accounts.
 */
export function getStripe(market: MarketCode = "US"): Stripe {
  if (stripeRuntimeMode() === "live") {
    const key = process.env.STRIPE_SECRET_KEY_JP_LIVE?.trim() ?? "";
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
