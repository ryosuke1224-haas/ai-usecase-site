import { getPaidProduct } from "@/src/lib/payments/products";

export const PRIVATE_PREVIEW_CTA_LABEL = "Private preview";
export const PURCHASE_CTA_LABEL = "Available to purchase";

/** Locked Premium cards without a checkout price use private-preview wording. */
export function lockedBlueprintCtaLabel(productSlug: string | undefined): string {
  if (productSlug && getPaidProduct(productSlug)) return PURCHASE_CTA_LABEL;
  return PRIVATE_PREVIEW_CTA_LABEL;
}
