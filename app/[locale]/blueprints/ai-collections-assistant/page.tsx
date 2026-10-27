import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FactLabel } from "@/components/premium/ai-collections-assistant/fact-label";
import { GuidedDemo } from "@/components/premium/ai-collections-assistant/guided-demo";
import { PremiumAccessPanel } from "@/components/premium/ai-collections-assistant/premium-access-panel";
import { getCurrentUser } from "@/src/lib/auth";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { displayPriceForUi } from "@/src/lib/payments/preview-market";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";
import { loadPreviewPriceLabel } from "@/src/lib/payments/start-checkout";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkout?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = siteCopy(locale).collections;
  return {
    title: copy.title,
    description: copy.body,
    alternates: { canonical: `/${locale}/blueprints/ai-collections-assistant` },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleCollectionsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const query = await searchParams;
  const copy = siteCopy(locale);
  const user = await getCurrentUser();
  const priceLabel = displayPriceForUi(locale, await loadPreviewPriceLabel(COLLECTIONS_PRODUCT_SLUG, locale));
  let mode: "sign-in" | "buy" | "open" = "sign-in";
  if (user) {
    const entitled = await hasActiveEntitlement(user.id, COLLECTIONS_PRODUCT_SLUG);
    mode = entitled ? "open" : "buy";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        {copy.collections.eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{copy.collections.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.collections.body}</p>
      {locale === "ja" ? (
        <section className="mt-6" aria-label={copy.collections.labelsTitle}>
          <h2 className="text-sm font-semibold text-foreground">このテンプレートでは、情報を3つに分けて整理します。</h2>
          <dl className="mt-3 space-y-3 text-sm leading-relaxed">
            <div>
              <dt className="font-medium text-foreground">事実</dt>
              <dd className="text-muted">{copy.collections.confirmed}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">AIによる整理</dt>
              <dd className="text-muted">{copy.collections.interpretation}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">提案</dt>
              <dd className="text-muted">{copy.collections.recommended}</dd>
            </div>
          </dl>
        </section>
      ) : (
      <ul aria-label={copy.collections.labelsTitle} className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground">
        <li>
          <FactLabel kind="CONFIRMED" /> {copy.collections.confirmed}
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" /> {copy.collections.interpretation}
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" /> {copy.collections.recommended}
        </li>
      </ul>
      )}
      <p role="note" className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
        {copy.collections.fictional}
      </p>
      <PremiumAccessPanel
        mode={mode}
        priceLabel={priceLabel}
        checkoutUnavailable={query.checkout === "unavailable"}
        uiLocale={locale}
      />
      {locale === "en" ? (
        <div className="mt-6">
          <GuidedDemo />
        </div>
      ) : null}
    </div>
  );
}
