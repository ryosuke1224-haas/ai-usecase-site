import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UnbilledPublicView } from "@/components/premium/unbilled-work-review-queue/public-view";
import { isUiLocale, unbilledPaths } from "@/src/lib/i18n/locale";
import { unbilledCopy } from "@/src/lib/premium/unbilled-work-review-queue/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = unbilledCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: unbilledPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleUnbilledPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <UnbilledPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
