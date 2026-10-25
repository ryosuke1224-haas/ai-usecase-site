import fs from "node:fs";
import path from "node:path";

export const REGISTRY_PATH = path.join("atlas-memory", "product-registry.json");
export const REGISTRY_SCHEMA = "atlas-product-registry-v1";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type MarketCode = "US" | "JP";
export type LocaleCode = "en" | "ja";
export type RegistryCurrency = "usd" | "jpy";
export type StripeEnvironment = "SANDBOX" | "LIVE";

/** Preview Checkout stays on the existing Collections US Sandbox price. */
export const PREVIEW_PRICE_SCOPE: {
  market: MarketCode;
  locale: LocaleCode;
  currency: RegistryCurrency;
  stripe_environment: StripeEnvironment;
} = {
  market: "US",
  locale: "en",
  currency: "usd",
  stripe_environment: "SANDBOX",
};

export type RegistryProduct = {
  product_slug: string;
  name: string;
  market: MarketCode;
  locale: LocaleCode;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_amount: number | null;
  suggested_price_amount: number | null;
  approved_price_amount: number | null;
  currency: RegistryCurrency;
  payment_type: "ONE_TIME";
  stripe_environment: StripeEnvironment;
  status: ProductStatus;
  commercial_rationale: string;
  created_at: string;
  updated_at: string;
};

type RegistryFile = {
  schema_version: typeof REGISTRY_SCHEMA;
  products: RegistryProduct[];
};

export type MappingQuery = {
  product_slug: string;
  market?: MarketCode;
  locale?: LocaleCode;
  currency?: RegistryCurrency;
  stripe_environment?: StripeEnvironment;
};

export function mappingKey(
  row: Pick<RegistryProduct, "product_slug" | "market" | "locale" | "currency" | "stripe_environment">,
): string {
  return [row.product_slug, row.market, row.locale, row.currency, row.stripe_environment].join(":");
}

/** Legacy rows without market or locale are the US Sandbox mapping. Stripe ids are copied through. */
export function normalizeRegistryProduct(row: Partial<RegistryProduct>): RegistryProduct | null {
  if (!row.product_slug || !row.name || !row.status) return null;
  if (row.status !== "DRAFT" && row.status !== "ACTIVE" && row.status !== "ARCHIVED") return null;
  const market = row.market ?? "US";
  const locale = row.locale ?? "en";
  const currency = row.currency ?? "usd";
  const stripeEnvironment = row.stripe_environment ?? "SANDBOX";
  if (market !== "US" && market !== "JP") return null;
  if (locale !== "en" && locale !== "ja") return null;
  if (currency !== "usd" && currency !== "jpy") return null;
  if (stripeEnvironment !== "SANDBOX" && stripeEnvironment !== "LIVE") return null;
  if (row.payment_type && row.payment_type !== "ONE_TIME") return null;
  return {
    product_slug: row.product_slug,
    name: row.name,
    market,
    locale,
    stripe_product_id: row.stripe_product_id ?? null,
    stripe_price_id: row.stripe_price_id ?? null,
    price_amount: row.price_amount ?? null,
    suggested_price_amount: row.suggested_price_amount ?? null,
    approved_price_amount: row.approved_price_amount ?? null,
    currency,
    payment_type: "ONE_TIME",
    stripe_environment: stripeEnvironment,
    status: row.status,
    commercial_rationale: row.commercial_rationale ?? "",
    created_at: row.created_at ?? "1970-01-01T00:00:00.000Z",
    updated_at: row.updated_at ?? "1970-01-01T00:00:00.000Z",
  };
}

export function readRegistryFile(file = REGISTRY_PATH): RegistryProduct[] {
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<RegistryFile>;
  if (!Array.isArray(parsed.products)) return [];
  return parsed.products.flatMap((row) => {
    const product = normalizeRegistryProduct(row);
    return product ? [product] : [];
  });
}

export function writeRegistryFile(products: RegistryProduct[], file = REGISTRY_PATH): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body: RegistryFile = { schema_version: REGISTRY_SCHEMA, products };
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(body, null, 2)}\n`);
  fs.renameSync(temp, file);
}

export function mergeRegistryProducts(
  local: Array<Partial<RegistryProduct>>,
  remote: Array<Partial<RegistryProduct>> | null,
): RegistryProduct[] {
  const merged = new Map<string, RegistryProduct>();
  for (const row of local) {
    const product = normalizeRegistryProduct(row);
    if (product) merged.set(mappingKey(product), product);
  }
  if (remote) {
    for (const row of remote) {
      const product = normalizeRegistryProduct(row);
      if (product) merged.set(mappingKey(product), product);
    }
  }
  return [...merged.values()].sort((a, b) => mappingKey(a).localeCompare(mappingKey(b)));
}

export function upsertRegistryProduct(products: Array<Partial<RegistryProduct>>, row: RegistryProduct): RegistryProduct[] {
  const next = mergeRegistryProducts(products, null).filter((item) => mappingKey(item) !== mappingKey(row));
  next.push(row);
  next.sort((a, b) => mappingKey(a).localeCompare(mappingKey(b)));
  return next;
}

export function findRegistryMapping(
  products: Array<Partial<RegistryProduct>>,
  query: MappingQuery,
): RegistryProduct | null {
  const wanted = mappingKey({
    product_slug: query.product_slug,
    market: query.market ?? PREVIEW_PRICE_SCOPE.market,
    locale: query.locale ?? PREVIEW_PRICE_SCOPE.locale,
    currency: query.currency ?? PREVIEW_PRICE_SCOPE.currency,
    stripe_environment: query.stripe_environment ?? PREVIEW_PRICE_SCOPE.stripe_environment,
  });
  return mergeRegistryProducts(products, null).find((row) => mappingKey(row) === wanted) ?? null;
}

export type PriceResolution =
  | { ok: true; priceId: string; source: "registry" | "legacy_env" }
  | { ok: false; error: "unknown_product" | "inactive_product" | "missing_price" };

const PRICE_ID = /^price_[A-Za-z0-9]+$/;

/**
 * Registry first, scoped by market, locale, currency, and environment.
 * The Collections environment variable is only the US Sandbox fallback when that
 * mapping has no registry row yet. The browser cannot choose the price.
 */
export function resolveTrustedPriceId(
  slug: string,
  options: {
    products: Array<Partial<RegistryProduct>>;
    env?: NodeJS.ProcessEnv;
    legacyPriceEnv?: string;
    legacySlug?: string;
    market?: MarketCode;
    locale?: LocaleCode;
    currency?: RegistryCurrency;
    environment?: StripeEnvironment;
  },
): PriceResolution {
  const market = options.market ?? PREVIEW_PRICE_SCOPE.market;
  const locale = options.locale ?? PREVIEW_PRICE_SCOPE.locale;
  const currency = options.currency ?? PREVIEW_PRICE_SCOPE.currency;
  const environment = options.environment ?? PREVIEW_PRICE_SCOPE.stripe_environment;
  const row = findRegistryMapping(options.products, {
    product_slug: slug,
    market,
    locale,
    currency,
    stripe_environment: environment,
  });
  if (row) {
    if (row.status !== "ACTIVE" || row.payment_type !== "ONE_TIME" || row.stripe_environment !== environment) {
      return { ok: false, error: "inactive_product" };
    }
    const priceId = row.stripe_price_id?.trim() ?? "";
    if (!PRICE_ID.test(priceId) || row.currency !== currency) return { ok: false, error: "missing_price" };
    return { ok: true, priceId, source: "registry" };
  }

  const legacySlug = options.legacySlug ?? "ai-collections-assistant";
  const legacyScope =
    market === "US" && locale === "en" && currency === "usd" && environment === "SANDBOX" && slug === legacySlug;
  if (!legacyScope) {
    return { ok: false, error: slug === legacySlug ? "missing_price" : "unknown_product" };
  }

  const legacyEnv = options.legacyPriceEnv ?? "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT";
  const priceId = options.env?.[legacyEnv]?.trim() ?? "";
  if (PRICE_ID.test(priceId)) return { ok: true, priceId, source: "legacy_env" };
  return { ok: false, error: "missing_price" };
}
