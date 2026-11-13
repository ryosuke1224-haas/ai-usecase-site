import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ExpenseKitView } from "@/components/premium/ai-expense-watchdog/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-expense-watchdog/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { expensePaths, isUiLocale } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { expenseCopy } from "@/src/lib/premium/ai-expense-watchdog/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: expenseCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: expensePaths(locale).kit },
  };
}

export default async function LocaleExpenseKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = expensePaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "ai-expense-watchdog");
  if (!entitled) {
    const copy = expenseCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="ai-expense-watchdog"
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
  return <ExpenseKitView locale={locale} pathLocale={locale} />;
}
