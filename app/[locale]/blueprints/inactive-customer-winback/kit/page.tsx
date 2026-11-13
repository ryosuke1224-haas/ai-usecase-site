import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WinbackKitView } from "@/components/premium/inactive-customer-winback/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/inactive-customer-winback/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, winbackPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { winbackCopy } from "@/src/lib/premium/inactive-customer-winback/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: winbackCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: winbackPaths(locale).kit },
  };
}

export default async function LocaleWinbackKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = winbackPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "inactive-customer-winback");
  if (!entitled) {
    const copy = winbackCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="inactive-customer-winback"
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
  return <WinbackKitView locale={locale} pathLocale={locale} />;
}
