import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  DraftReviewChecklistSection,
  NextWeekPromptSection,
  OutcomeLogTemplateSection,
  QueuePromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleAgingReportSection,
  SetupChecklistSection,
} from "@/components/premium/ai-collections-assistant/kit-sections";
import { PremiumAccessPanel } from "@/components/premium/ai-collections-assistant/premium-access-panel";
import { FOCUS_RING } from "@/components/premium/ai-collections-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { collectionsPaths, isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { displayPriceForUi } from "@/src/lib/payments/preview-market";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";
import { loadPreviewPriceLabel } from "@/src/lib/payments/start-checkout";
import { KIT_SECTIONS } from "@/src/lib/premium/ai-collections-assistant/kit-content";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: siteCopy(locale).kit.openTitle,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = collectionsPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const copy = siteCopy(locale).kit;
  const entitled = await hasActiveEntitlement(user.id, COLLECTIONS_PRODUCT_SLUG);
  if (!entitled) {
    const priceLabel = displayPriceForUi(locale, await loadPreviewPriceLabel(COLLECTIONS_PRODUCT_SLUG, locale));
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
          {copy.lockedEyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{copy.lockedTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.lockedBody}</p>
        <PremiumAccessPanel mode="buy" uiLocale={locale} priceLabel={priceLabel} />
        <Link href={paths.demo} className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}>
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        {copy.openEyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{copy.openTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.openBody}</p>
      {copy.englishNote ? <p className="mt-3 text-sm leading-relaxed text-muted">{copy.englishNote}</p> : null}
      <nav aria-label="Kit contents" className="mt-8 rounded-2xl border border-border/60 bg-surface p-4 sm:p-5">
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {KIT_SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className={`inline-block rounded text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}>
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-6">
        <SetupChecklistSection />
        <QueuePromptSection />
        <NextWeekPromptSection />
        <RulesWorksheetSection />
        <OutcomeLogTemplateSection />
        <DraftReviewChecklistSection />
        <SampleAgingReportSection />
        <SafetyGuidanceSection />
      </div>
      <Link href={paths.demo} className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}>
        {copy.back}
      </Link>
    </div>
  );
}
