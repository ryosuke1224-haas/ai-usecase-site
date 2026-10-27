import Link from "next/link";
import { PRIMARY_BUTTON } from "@/components/premium/ai-collections-assistant/styles";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { collectionsPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { japanPurchaseDisclosure } from "@/src/lib/japan-launch/legal";
import {
  COLLECTIONS_KIT_PATH,
  COLLECTIONS_PRODUCT_SLUG,
} from "@/src/lib/payments/products";

export function PremiumAccessPanel({
  mode,
  checkoutUnavailable = false,
  priceLabel = null,
  uiLocale = null,
}: {
  mode: "sign-in" | "buy" | "open";
  checkoutUnavailable?: boolean;
  priceLabel?: string | null;
  uiLocale?: UiLocale | null;
}) {
  const paths = collectionsPaths(uiLocale);
  const copy = uiLocale ? siteCopy(uiLocale).purchase : null;
  const oneTime = copy?.oneTime ?? "One-time access. Stripe confirms the payment before this Blueprint opens.";
  const unavailable = copy?.unavailable ?? "Premium payment is unavailable right now. Try again in a moment.";
  const signIn = copy?.signIn ?? "Sign in to purchase";
  const buy = copy?.buy ?? "Buy Premium";
  const open = copy?.open ?? "Open Premium Kit";

  return (
    <section
      aria-label={uiLocale === "ja" ? "プレミアムAI活用テンプレート" : "Premium access"}
      className="mt-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6"
    >
      {uiLocale === "ja" ? (
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{japanPurchaseDisclosure.price}</p>
          <p className="mt-1 text-sm text-muted">買い切り</p>
        </div>
      ) : (
        <>
          {priceLabel ? (
            <p className="text-2xl font-semibold tracking-tight text-foreground">{priceLabel}</p>
          ) : null}
          <p className={`text-sm leading-relaxed text-muted ${priceLabel ? "mt-2" : ""}`}>
            {oneTime}
          </p>
          {copy?.handoff ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">{copy.handoff}</p>
          ) : null}
        </>
      )}
      {checkoutUnavailable ? (
        <p role="status" className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          {unavailable}
        </p>
      ) : null}
      <div className="mt-4">
        {mode === "sign-in" ? (
          <Link href={authPath(paths.demo, uiLocale ?? undefined)} className={PRIMARY_BUTTON}>
            {signIn}
          </Link>
        ) : null}
        {mode === "buy" ? (
          <form action="/api/stripe/checkout" method="post">
            <input type="hidden" name="productSlug" value={COLLECTIONS_PRODUCT_SLUG} />
            {uiLocale ? <input type="hidden" name="uiLocale" value={uiLocale} /> : null}
            <button type="submit" className={PRIMARY_BUTTON}>
              {buy}
            </button>
          </form>
        ) : null}
        {mode === "open" && uiLocale === "ja" ? (
          <p className="mt-3 text-sm font-medium text-foreground">購入済み</p>
        ) : null}
        {mode === "open" ? (
          <Link href={uiLocale ? paths.kit : COLLECTIONS_KIT_PATH} className={PRIMARY_BUTTON}>
            {open}
          </Link>
        ) : null}
      </div>
      {uiLocale === "ja" && mode !== "open" ? (
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <p>{japanPurchaseDisclosure.availability}</p>
          <p>{japanPurchaseDisclosure.refundNotice}</p>
          <p>支払いはStripeの決済画面で完了します。</p>
          <nav aria-label="購入前の確認" className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {japanPurchaseDisclosure.links.map((link) => (
              <Link key={link.href} href={link.href} className="font-medium text-accent hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </section>
  );
}
