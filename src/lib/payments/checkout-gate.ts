import { authPath } from "@/src/lib/blueprints";
import { productCommercePaths } from "./products";

export type CheckoutGate =
  | { kind: "start"; failureLocation: string }
  | { kind: "sign-in" | "owned" | "unavailable"; location: string };

/**
 * Logged-out buyers go to sign-in. An existing entitlement opens the kit
 * instead of starting another checkout for the same product.
 */
export function checkoutGate(input: {
  productSlug: string;
  uiLocale: "ja" | "en" | null;
  signedIn: boolean;
  alreadyOwned: boolean;
}): CheckoutGate {
  const paths = productCommercePaths(input.productSlug, input.uiLocale);
  const fallback = productCommercePaths("ai-collections-assistant", input.uiLocale);
  const destination = paths ?? fallback;
  const demo = destination?.demo ?? "/blueprints/ai-collections-assistant";
  if (!input.signedIn) {
    return { kind: "sign-in", location: authPath(demo, input.uiLocale ?? undefined) };
  }
  if (!paths) {
    return { kind: "unavailable", location: `${demo}?checkout=unavailable` };
  }
  if (input.alreadyOwned) return { kind: "owned", location: paths.kit };
  return { kind: "start", failureLocation: `${paths.demo}?checkout=unavailable` };
}
