import "server-only";

import Stripe from "stripe";
import type { MarketCode } from "@/src/lib/payments/registry";
import { selectProvisioningAccount } from "@/scripts/atlas-commerce/stripe-accounts";

/** Server-only Stripe client for one Sandbox account. The key is never logged. */
export function getStripe(market: MarketCode = "US"): Stripe {
  const selected = selectProvisioningAccount({ market, environment: "SANDBOX" });
  if (!selected.ok) {
    throw new Error("Stripe is not configured for test mode.");
  }
  return new Stripe(selected.key);
}
