import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PayrollKitView } from "@/components/premium/ai-payroll-forecasting/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-payroll-forecasting/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, payrollPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { payrollCopy } from "@/src/lib/premium/ai-payroll-forecasting/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: payrollCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: payrollPaths(locale).kit },
  };
}

export default async function LocalePayrollKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = payrollPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "ai-payroll-forecasting");
  if (!entitled) {
    const copy = payrollCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="ai-payroll-forecasting"
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
  return <PayrollKitView locale={locale} pathLocale={locale} />;
}
