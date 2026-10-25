import { LIVE_STRIPE_PROVISIONING_BLOCKED, assertSandboxStripeKey } from "../../src/lib/payments/provision";
import type { MarketCode, StripeEnvironment } from "../../src/lib/payments/registry";

/** Server-side Stripe account names. Values stay in the environment and are never printed. */
export const STRIPE_ACCOUNT_ENV = {
  US_SANDBOX: "STRIPE_SECRET_KEY_US_SANDBOX",
  US_SANDBOX_LEGACY: "STRIPE_SECRET_KEY",
  JP_SANDBOX: "STRIPE_SECRET_KEY_JP_SANDBOX",
  JP_LIVE: "STRIPE_SECRET_KEY_JP_LIVE",
} as const;

export const JAPAN_COLLECTIONS_SANDBOX = {
  product_slug: "ai-collections-assistant",
  name: "AI Collections Assistant",
  market: "JP",
  locale: "ja",
  currency: "jpy",
  amount: 4900,
  environment: "SANDBOX",
} as const;

export type AccountKeyResult =
  | { ok: true; key: string; envName: string }
  | { ok: false; code: typeof LIVE_STRIPE_PROVISIONING_BLOCKED | "STRIPE_NOT_CONFIGURED"; envName: string };

/** US Sandbox prefers its own key and otherwise keeps the existing secret. */
export function usSandboxSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env[STRIPE_ACCOUNT_ENV.US_SANDBOX]?.trim() || env[STRIPE_ACCOUNT_ENV.US_SANDBOX_LEGACY]?.trim() || "";
}

/**
 * Picks the secret for one account. Japan never falls back to the US key.
 * LIVE returns a block and does not return the key.
 */
export function selectProvisioningAccount(
  input: { market: MarketCode; environment: StripeEnvironment; env?: NodeJS.ProcessEnv },
): AccountKeyResult {
  const env = input.env ?? process.env;
  if (input.environment === "LIVE") {
    return {
      ok: false,
      code: LIVE_STRIPE_PROVISIONING_BLOCKED,
      envName: input.market === "JP" ? STRIPE_ACCOUNT_ENV.JP_LIVE : "STRIPE_SECRET_KEY_US_LIVE",
    };
  }
  if (input.market === "JP") {
    const key = env[STRIPE_ACCOUNT_ENV.JP_SANDBOX]?.trim() ?? "";
    if (!key) return { ok: false, code: "STRIPE_NOT_CONFIGURED", envName: STRIPE_ACCOUNT_ENV.JP_SANDBOX };
    if (!assertSandboxStripeKey(key).ok) {
      return { ok: false, code: LIVE_STRIPE_PROVISIONING_BLOCKED, envName: STRIPE_ACCOUNT_ENV.JP_SANDBOX };
    }
    return { ok: true, key, envName: STRIPE_ACCOUNT_ENV.JP_SANDBOX };
  }
  const named = env[STRIPE_ACCOUNT_ENV.US_SANDBOX]?.trim() ?? "";
  const key = named || env[STRIPE_ACCOUNT_ENV.US_SANDBOX_LEGACY]?.trim() || "";
  const envName = named ? STRIPE_ACCOUNT_ENV.US_SANDBOX : STRIPE_ACCOUNT_ENV.US_SANDBOX_LEGACY;
  if (!key) return { ok: false, code: "STRIPE_NOT_CONFIGURED", envName };
  if (!assertSandboxStripeKey(key).ok) return { ok: false, code: LIVE_STRIPE_PROVISIONING_BLOCKED, envName };
  return { ok: true, key, envName };
}

export function parseJapanSandboxCommand(flags: {
  slug?: string;
  market?: string;
  locale?: string;
  currency?: string;
  amount?: string;
  environment?: string;
}): { ok: true; environment: "SANDBOX" | "LIVE" } | { ok: false; code: "UNSUPPORTED_PROVISION" } {
  const slug = flags.slug ?? JAPAN_COLLECTIONS_SANDBOX.product_slug;
  const market = (flags.market ?? JAPAN_COLLECTIONS_SANDBOX.market).toUpperCase();
  const locale = (flags.locale ?? JAPAN_COLLECTIONS_SANDBOX.locale).toLowerCase();
  const currency = (flags.currency ?? JAPAN_COLLECTIONS_SANDBOX.currency).toLowerCase();
  const amount = flags.amount ?? String(JAPAN_COLLECTIONS_SANDBOX.amount);
  const environment = (flags.environment ?? "SANDBOX").toUpperCase();
  const matches =
    slug === JAPAN_COLLECTIONS_SANDBOX.product_slug &&
    market === JAPAN_COLLECTIONS_SANDBOX.market &&
    locale === JAPAN_COLLECTIONS_SANDBOX.locale &&
    currency === JAPAN_COLLECTIONS_SANDBOX.currency &&
    amount === String(JAPAN_COLLECTIONS_SANDBOX.amount) &&
    (environment === "SANDBOX" || environment === "LIVE");
  if (!matches) return { ok: false, code: "UNSUPPORTED_PROVISION" };
  return { ok: true, environment };
}
