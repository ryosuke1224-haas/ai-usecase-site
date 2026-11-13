import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdsKitView } from "@/components/premium/google-ads-performance-coach/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/google-ads-performance-coach/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { googleAdsPaths, isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { adsCopy } from "@/src/lib/premium/google-ads-performance-coach/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: adsCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: googleAdsPaths(locale).kit },
  };
}

export default async function LocaleGoogleAdsPerformanceCoachKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = googleAdsPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "google-ads-performance-coach");
  if (!entitled) {
    const copy = adsCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="google-ads-performance-coach"
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
  return <AdsKitView locale={locale} pathLocale={locale} />;
}
