import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NoShowPublicView } from "@/components/premium/no-show-recovery-assistant/public-view";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { isUiLocale, noShowPaths } from "@/src/lib/i18n/locale";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = noShowCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: noShowPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleNoShowPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <NoShowPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
