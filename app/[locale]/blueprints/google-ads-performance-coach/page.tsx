import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdsPublicView } from "@/components/premium/google-ads-performance-coach/public-view";
import { googleAdsPaths, isUiLocale } from "@/src/lib/i18n/locale";
import { adsCopy } from "@/src/lib/premium/google-ads-performance-coach/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = adsCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: googleAdsPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleGoogleAdsPerformanceCoachPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <AdsPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
