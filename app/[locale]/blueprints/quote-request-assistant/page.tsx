import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuotePublicView } from "@/components/premium/quote-request-assistant/public-view";
import { isUiLocale, quotePaths } from "@/src/lib/i18n/locale";
import { quoteCopy } from "@/src/lib/premium/quote-request-assistant/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = quoteCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: quotePaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleQuotePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <QuotePublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
