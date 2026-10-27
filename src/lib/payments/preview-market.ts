import {
  PREVIEW_PRICE_SCOPE,
  type LocaleCode,
  type MarketCode,
  type RegistryCurrency,
  type StripeEnvironment,
} from "./registry";

export type PreviewCommerceScope = {
  market: MarketCode;
  locale: LocaleCode;
  currency: RegistryCurrency;
  stripe_environment: Extract<StripeEnvironment, "SANDBOX">;
};

/**
 * Preview market comes from the server environment.
 * Absent values stay on the US Sandbox mapping. The browser cannot choose it.
 */
export type UiCommerceLocale = "ja" | "en";

/** The browser may only select a registered locale. It cannot select a Stripe price. */
export function parseUiLocale(value: unknown): UiCommerceLocale | null {
  return value === "ja" || value === "en" ? value : null;
}

/**
 * Prefixed pages choose a server-owned Sandbox mapping.
 * Unprefixed pages keep the deployment environment.
 */
export function commerceScopeForUiLocale(
  locale: UiCommerceLocale | null,
  env: NodeJS.ProcessEnv = process.env,
): PreviewCommerceScope | null {
  if (locale === "ja") return { market: "JP", locale: "ja", currency: "jpy", stripe_environment: "SANDBOX" };
  if (locale === "en") return { market: "US", locale: "en", currency: "usd", stripe_environment: "SANDBOX" };
  return previewCommerceScope(env);
}

export function previewCommerceScope(env: NodeJS.ProcessEnv = process.env): PreviewCommerceScope | null {
  const market = env.ATLAS_COMMERCE_MARKET?.trim().toUpperCase() ?? "";
  const locale = env.ATLAS_COMMERCE_LOCALE?.trim().toLowerCase() ?? "";
  if (!market && !locale) return { ...PREVIEW_PRICE_SCOPE, stripe_environment: "SANDBOX" };
  if ((market === "" || market === "US") && (locale === "" || locale === "en")) {
    return { ...PREVIEW_PRICE_SCOPE, stripe_environment: "SANDBOX" };
  }
  if ((market === "JP" || market === "") && (locale === "ja" || locale === "") && (market === "JP" || locale === "ja")) {
    return { market: "JP", locale: "ja", currency: "jpy", stripe_environment: "SANDBOX" };
  }
  return null;
}

/** Japanese pages only show a yen label. English pages only show a dollar label. */
export function displayPriceForUi(locale: UiCommerceLocale, label: string | null): string | null {
  if (!label) return null;
  if (locale === "ja") return label.startsWith("¥") && !label.includes("$") ? label : null;
  return label.startsWith("$") && !label.includes("¥") ? label : null;
}

/** Stripe JPY amounts are yen. USD amounts are cents. */
export function formatCheckoutPrice(amount: number, currency: RegistryCurrency): string {
  if (!Number.isInteger(amount) || amount < 0) return "";
  if (currency === "jpy") return `¥${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  const dollars = amount / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
