import type { RegistryProduct } from "./registry";

/** Approved flat launch price. USD is cents. JPY is yen. */
export const LAUNCH_USD_CENTS = 4900;
export const LAUNCH_JPY_AMOUNT = 7980;

export const LAUNCH_PRODUCTS = [
  { slug: "google-ads-performance-coach", name: "Google Ads Performance Coach" },
  { slug: "quote-request-assistant", name: "Quote Request Assistant" },
  { slug: "ai-expense-watchdog", name: "AI Expense Watchdog" },
  { slug: "no-show-recovery-assistant", name: "No-show Recovery Assistant" },
  { slug: "unbilled-work-review-queue", name: "Unbilled Work Review Queue" },
  { slug: "ai-customer-response-assistant", name: "On-brand Reply Review Queue" },
  { slug: "ai-pipeline-risk-detector", name: "Stalled Deal Rescue Queue" },
  { slug: "inactive-customer-winback", name: "Lapsed Customer Return Queue" },
  { slug: "ai-staffing-optimizer", name: "Shift Coverage vs Demand Check" },
  { slug: "ai-proposal-follow-up-assistant", name: "Quiet Proposal Chase Queue" },
  { slug: "ai-payroll-forecasting", name: "Next-Pay Labor Check" },
] as const;

export type LaunchProductSlug = (typeof LAUNCH_PRODUCTS)[number]["slug"];

const STAMP = "2026-11-10T00:00:00.000Z";

export function isLaunchProduct(slug: string): slug is LaunchProductSlug {
  return LAUNCH_PRODUCTS.some((item) => item.slug === slug);
}

function row(
  item: (typeof LAUNCH_PRODUCTS)[number],
  market: RegistryProduct["market"],
  locale: RegistryProduct["locale"],
  currency: RegistryProduct["currency"],
  amount: number,
): RegistryProduct {
  return {
    product_slug: item.slug,
    name: item.name,
    market,
    locale,
    stripe_product_id: null,
    stripe_price_id: null,
    price_amount: amount,
    suggested_price_amount: amount,
    approved_price_amount: amount,
    currency,
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    status: "ACTIVE",
    commercial_rationale: "Approved flat one-time launch price. Sandbox only.",
    created_at: STAMP,
    updated_at: STAMP,
  };
}

/** Local catalog rows. A saved registry mapping with the same key replaces these. */
export function launchRegistryRows(): RegistryProduct[] {
  return LAUNCH_PRODUCTS.flatMap((item) => [
    row(item, "US", "en", "usd", LAUNCH_USD_CENTS),
    row(item, "JP", "ja", "jpy", LAUNCH_JPY_AMOUNT),
  ]);
}
