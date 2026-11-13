import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PayrollPublicView } from "@/components/premium/ai-payroll-forecasting/public-view";
import { isUiLocale, payrollPaths } from "@/src/lib/i18n/locale";
import { payrollCopy } from "@/src/lib/premium/ai-payroll-forecasting/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = payrollCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: payrollPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocalePayrollPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <PayrollPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
