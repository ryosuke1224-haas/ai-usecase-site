export type StripeRuntimeMode = "live" | "sandbox";

export function stripeRuntimeMode(env: NodeJS.ProcessEnv = process.env): StripeRuntimeMode {
  return env.ATLAS_STRIPE_MODE?.trim().toLowerCase() === "live" ? "live" : "sandbox";
}

/** The live Stripe API client accepts a secret or restricted live key. Test keys cannot enter this path. */
export function isLiveStripeKey(key: string): boolean {
  const value = key.trim();
  return value.startsWith("sk_live_") || value.startsWith("rk_live_");
}

/**
 * A live credential selects the live registry when the mode is unset.
 * An explicit sandbox mode stays on sandbox and never receives that live key.
 */
export function envForStripeCredential(env: NodeJS.ProcessEnv, secret: string): NodeJS.ProcessEnv {
  const explicit = env.ATLAS_STRIPE_MODE?.trim().toLowerCase();
  if (explicit === "sandbox") return env;
  if (explicit === "live" || isLiveStripeKey(secret)) return { ...env, ATLAS_STRIPE_MODE: "live" };
  return env;
}
