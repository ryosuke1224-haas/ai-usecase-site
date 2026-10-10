import Link from "next/link";
import { PRIMARY_BUTTON } from "@/components/premium/ai-collections-assistant/styles";
import { authPath } from "@/src/lib/blueprints";
import {
  COLLECTIONS_DEMO_PATH,
  COLLECTIONS_KIT_PATH,
  COLLECTIONS_PRODUCT_SLUG,
} from "@/src/lib/payments/products";

export function PremiumAccessPanel({
  mode,
  checkoutUnavailable = false,
}: {
  mode: "sign-in" | "buy" | "open";
  checkoutUnavailable?: boolean;
}) {
  return (
    <section
      aria-label="Premium access"
      className="mt-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
    >
      <p className="text-sm leading-relaxed text-muted">
        One-time access. Stripe confirms the payment before this Blueprint opens.
      </p>
      {checkoutUnavailable ? (
        <p role="status" className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          Premium payment is unavailable right now. Try again in a moment.
        </p>
      ) : null}
      <div className="mt-4">
        {mode === "sign-in" ? (
          <Link href={authPath(COLLECTIONS_DEMO_PATH)} className={PRIMARY_BUTTON}>
            Sign in to purchase
          </Link>
        ) : null}
        {mode === "buy" ? (
          <form action="/api/stripe/checkout" method="post">
            <input type="hidden" name="productSlug" value={COLLECTIONS_PRODUCT_SLUG} />
            <button type="submit" className={PRIMARY_BUTTON}>
              Buy Premium
            </button>
          </form>
        ) : null}
        {mode === "open" ? (
          <Link href={COLLECTIONS_KIT_PATH} className={PRIMARY_BUTTON}>
            Open Premium Kit
          </Link>
        ) : null}
      </div>
    </section>
  );
}
