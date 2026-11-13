import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExpensePublicView } from "@/components/premium/ai-expense-watchdog/public-view";
import { expensePaths, isUiLocale } from "@/src/lib/i18n/locale";
import { expenseCopy } from "@/src/lib/premium/ai-expense-watchdog/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = expenseCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: expensePaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleExpensePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <ExpensePublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
