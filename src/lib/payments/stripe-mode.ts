export type StripeRuntimeMode = "live" | "sandbox";

export function stripeRuntimeMode(env: NodeJS.ProcessEnv = process.env): StripeRuntimeMode {
  return env.ATLAS_STRIPE_MODE?.trim().toLowerCase() === "live" ? "live" : "sandbox";
}

/** The live Stripe API client accepts only a live secret. Test keys cannot enter this path. */
export function isLiveStripeKey(key: string): boolean {
  const value = key.trim();
  return value.startsWith("sk_live_") || value.startsWith("rk_live_");
}
