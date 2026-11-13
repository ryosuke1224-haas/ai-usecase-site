import {
  COLLECTIONS_DEMO_PATH,
  COLLECTIONS_KIT_PATH,
} from "@/src/lib/premium/ai-collections-assistant/demo-data";
import { LAUNCH_PRODUCTS } from "./launch-catalog";

export { COLLECTIONS_DEMO_PATH, COLLECTIONS_KIT_PATH };

export const COLLECTIONS_PRODUCT_SLUG = "ai-collections-assistant";
export const SECURITY_READINESS_PRODUCT_SLUG = "security-readiness-action-pack";

export const COLLECTIONS_SUCCESS_PATH =
  "/blueprints/ai-collections-assistant/checkout/success";

export type PaidProduct = {
  slug: string;
  accessType: "lifetime";
  priceEnv?: "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT";
  successPath: string;
  cancelPath: string;
};

function launchPaidProduct(slug: string): PaidProduct {
  return {
    slug,
    accessType: "lifetime",
    successPath: `/blueprints/${slug}/checkout/success`,
    cancelPath: `/blueprints/${slug}`,
  };
}

const PAID_PRODUCTS: Record<string, PaidProduct> = {
  [COLLECTIONS_PRODUCT_SLUG]: {
    slug: COLLECTIONS_PRODUCT_SLUG,
    accessType: "lifetime",
    priceEnv: "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT",
    successPath: COLLECTIONS_SUCCESS_PATH,
    cancelPath: COLLECTIONS_DEMO_PATH,
  },
};

for (const item of LAUNCH_PRODUCTS) {
  PAID_PRODUCTS[item.slug] = launchPaidProduct(item.slug);
}

export function getPaidProduct(slug: string): PaidProduct | undefined {
  return PAID_PRODUCTS[slug];
}

/** Unprefixed paths stay English. `/ja` and `/en` keep the same product slug. */
export function productCommercePaths(
  slug: string,
  locale: "ja" | "en" | null,
): { demo: string; kit: string; success: string } | null {
  const product = getPaidProduct(slug);
  if (!product) return null;
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}${product.cancelPath}`,
    kit: `${prefix}/blueprints/${product.slug}/kit`,
    success: `${prefix}${product.successPath}`,
  };
}
