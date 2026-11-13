import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { QuoteKitView } from "@/components/premium/quote-request-assistant/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/quote-request-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, quotePaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { quoteCopy } from "@/src/lib/premium/quote-request-assistant/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: quoteCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: quotePaths(locale).kit },
  };
}

export default async function LocaleQuoteKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = quotePaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "quote-request-assistant");
  if (!entitled) {
    const copy = quoteCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="quote-request-assistant"
        demoPath={paths.demo}
        className={PAGE}
        linkClassName={FOCUS_RING}
        copy={{
          eyebrow: copy.lockedEyebrow,
          title: copy.lockedTitle,
          body: copy.lockedBody,
          back: copy.backToDemo,
        }}
      />
    );
  }
  return <QuoteKitView locale={locale} pathLocale={locale} />;
}
