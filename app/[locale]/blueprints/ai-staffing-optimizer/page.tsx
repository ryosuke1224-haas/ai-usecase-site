import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffingPublicView } from "@/components/premium/ai-staffing-optimizer/public-view";
import { isUiLocale, staffingPaths } from "@/src/lib/i18n/locale";
import { staffingCopy } from "@/src/lib/premium/ai-staffing-optimizer/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = staffingCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: staffingPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleStaffingPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <StaffingPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
