import Link from "next/link";
import { PRIMARY_BUTTON } from "@/components/premium/shared/styles";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { japanPurchaseDisclosure } from "@/src/lib/japan-launch/legal";
import { englishPurchaseLinks, englishPurchaseRefundNotice } from "@/src/lib/legal/english";
import { getCurrentUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { isLaunchProduct, LAUNCH_JPY_AMOUNT, LAUNCH_USD_CENTS } from "@/src/lib/payments/launch-catalog";
import { displayPriceForUi, formatCheckoutPrice, type UiCommerceLocale } from "@/src/lib/payments/preview-market";
import { getPaidProduct, productCommercePaths } from "@/src/lib/payments/products";
import { loadPreviewPriceLabel } from "@/src/lib/payments/start-checkout";

export async function LaunchPurchasePanel({
  slug,
  uiLocale = null,
  checkoutUnavailable = false,
}: {
  slug: string;
  uiLocale?: UiCommerceLocale | null;
  checkoutUnavailable?: boolean;
}) {
  if (!isLaunchProduct(slug) || !getPaidProduct(slug)) return null;
  const paths = productCommercePaths(slug, uiLocale);
  if (!paths) return null;

  const user = await getCurrentUser();
  const entitled = user ? await hasActiveEntitlement(user.id, slug) : false;
  const mode = !user ? "sign-in" : entitled ? "open" : "buy";
  const copy = siteCopy(uiLocale === "ja" ? "ja" : "en").purchase;
  const fallback =
    uiLocale === "ja"
      ? formatCheckoutPrice(LAUNCH_JPY_AMOUNT, "jpy")
      : formatCheckoutPrice(LAUNCH_USD_CENTS, "usd");
  const loaded = await loadPreviewPriceLabel(slug, uiLocale);
  const priceLabel = (uiLocale ? displayPriceForUi(uiLocale, loaded) : loaded) || fallback;
  const oneTime = uiLocale === "ja" ? `${priceLabel}の買い切りです。` : copy.oneTime;

  return (
    <section
      aria-label={uiLocale === "ja" ? "プレミアムAI活用テンプレート" : "Premium access"}
      className="mt-8 rounded-2xl border border-accent/25 bg-card p-5 ring-1 ring-accent/10 sm:p-6"
    >
      <p className="text-2xl font-semibold tracking-tight text-foreground">{priceLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{oneTime}</p>
      {uiLocale === "ja" && mode !== "open" ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-muted">{japanPurchaseDisclosure.availability}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{japanPurchaseDisclosure.refundNotice}</p>
        </>
      ) : null}
      {uiLocale === "ja" && copy.handoff ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{copy.handoff}</p>
      ) : null}
      {checkoutUnavailable ? (
        <p role="status" className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          {copy.unavailable}
        </p>
      ) : null}
      <div className="mt-4">
        {mode === "sign-in" ? (
          <Link href={authPath(paths.demo, uiLocale ?? undefined)} className={PRIMARY_BUTTON}>
            {copy.signIn}
          </Link>
        ) : null}
        {mode === "buy" ? (
          <form action="/api/stripe/checkout" method="post">
            <input type="hidden" name="productSlug" value={slug} />
            {uiLocale ? <input type="hidden" name="uiLocale" value={uiLocale} /> : null}
            <button type="submit" className={PRIMARY_BUTTON}>
              {copy.buy}
            </button>
          </form>
        ) : null}
        {mode === "open" ? (
          <>
            {uiLocale === "ja" ? <p className="text-sm font-medium text-foreground">購入済み</p> : null}
            <Link href={paths.kit} className={mode === "open" && uiLocale === "ja" ? `mt-3 ${PRIMARY_BUTTON}` : PRIMARY_BUTTON}>
              {copy.open}
            </Link>
          </>
        ) : null}
      </div>
      {uiLocale === "ja" && mode !== "open" ? (
        <nav aria-label="購入前の確認" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {japanPurchaseDisclosure.links.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-accent hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
      {uiLocale !== "ja" && mode !== "open" ? (
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <p>{englishPurchaseRefundNotice}</p>
          <nav aria-label="Purchase terms" className="flex flex-wrap gap-x-4 gap-y-2">
            {englishPurchaseLinks.map((link) => (
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
