import {
  COLLECTIONS_DEMO_PATH,
  COLLECTIONS_KIT_PATH,
} from "@/src/lib/premium/ai-collections-assistant/demo-data";

export { COLLECTIONS_DEMO_PATH, COLLECTIONS_KIT_PATH };

export const COLLECTIONS_PRODUCT_SLUG = "ai-collections-assistant";

export const COLLECTIONS_SUCCESS_PATH =
  "/blueprints/ai-collections-assistant/checkout/success";

export type PaidProduct = {
  slug: string;
  accessType: "lifetime";
  priceEnv: "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT";
  successPath: string;
  cancelPath: string;
};

const PAID_PRODUCTS: Record<string, PaidProduct> = {
  [COLLECTIONS_PRODUCT_SLUG]: {
    slug: COLLECTIONS_PRODUCT_SLUG,
    accessType: "lifetime",
    priceEnv: "STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT",
    successPath: COLLECTIONS_SUCCESS_PATH,
    cancelPath: COLLECTIONS_DEMO_PATH,
  },
};

export function getPaidProduct(slug: string): PaidProduct | undefined {
  return PAID_PRODUCTS[slug];
}
