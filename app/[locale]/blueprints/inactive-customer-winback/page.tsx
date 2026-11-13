import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WinbackPublicView } from "@/components/premium/inactive-customer-winback/public-view";
import { isUiLocale, winbackPaths } from "@/src/lib/i18n/locale";
import { winbackCopy } from "@/src/lib/premium/inactive-customer-winback/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = winbackCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: winbackPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleWinbackPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <WinbackPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
