import fs from "node:fs";
import path from "node:path";

export const REGISTRY_PATH = path.join("atlas-memory", "product-registry.json");
export const REGISTRY_SCHEMA = "atlas-product-registry-v1";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type RegistryProduct = {
  product_slug: string;
  name: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_amount: number | null;
  suggested_price_amount: number | null;
  approved_price_amount: number | null;
  currency: "usd";
  payment_type: "ONE_TIME";
  stripe_environment: "SANDBOX";
  status: ProductStatus;
  commercial_rationale: string;
  created_at: string;
  updated_at: string;
};

type RegistryFile = {
  schema_version: typeof REGISTRY_SCHEMA;
  products: RegistryProduct[];
};

export function readRegistryFile(file = REGISTRY_PATH): RegistryProduct[] {
  if (!fs.existsSync(file)) return [];
  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<RegistryFile>;
  return Array.isArray(parsed.products) ? parsed.products : [];
}

export function writeRegistryFile(products: RegistryProduct[], file = REGISTRY_PATH): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body: RegistryFile = { schema_version: REGISTRY_SCHEMA, products };
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(body, null, 2)}\n`);
  fs.renameSync(temp, file);
}

export function upsertRegistryProduct(products: RegistryProduct[], row: RegistryProduct): RegistryProduct[] {
  const next = products.filter((item) => item.product_slug !== row.product_slug);
  next.push(row);
  next.sort((a, b) => a.product_slug.localeCompare(b.product_slug));
  return next;
}

export type PriceResolution =
  | { ok: true; priceId: string; source: "registry" | "legacy_env" }
  | { ok: false; error: "unknown_product" | "inactive_product" | "missing_price" };

const PRICE_ID = /^price_[A-Za-z0-9]+$/;

/**
 * Registry first. The Collections environment variable is used only when that
 * product has no registry row yet. An inactive row never falls back to the env var.
 * clientPriceId is not an argument: the browser cannot choose the price.
 */
export function resolveTrustedPriceId(
  slug: string,
  options: {
    products: RegistryProduct[];
    env?: NodeJS.ProcessEnv;
    legacyPriceEnv?: string;
    legacySlug?: string;
  },
): PriceResolution {
  const row = options.products.find((item) => item.product_slug === slug);
  if (row) {
    if (row.status !== "ACTIVE" || row.stripe_environment !== "SANDBOX" || row.payment_type !== "ONE_TIME") {
      return { ok: false, error: "inactive_product" };
    }
    const priceId = row.stripe_price_id?.trim() ?? "";
    if (!PRICE_ID.test(priceId)) return { ok: false, error: "missing_price" };
    return { ok: true, priceId, source: "registry" };
  }

  const legacySlug = options.legacySlug ?? "ai-collections-assistant";
  const legacyEnv = options.legacyPriceEnv ?? "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT";
  if (slug === legacySlug) {
    const priceId = options.env?.[legacyEnv]?.trim() ?? "";
    if (PRICE_ID.test(priceId)) return { ok: true, priceId, source: "legacy_env" };
    return { ok: false, error: "missing_price" };
  }

  return { ok: false, error: "unknown_product" };
}
