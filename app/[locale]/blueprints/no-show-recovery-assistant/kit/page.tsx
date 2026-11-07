import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NoShowKitView } from "@/components/premium/no-show-recovery-assistant/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/no-show-recovery-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, noShowPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: noShowCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: noShowPaths(locale).kit },
  };
}

export default async function LocaleNoShowKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = noShowPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "no-show-recovery-assistant");
  if (!entitled) {
    const copy = noShowCopy(locale);
    return (
      <PremiumKitLocked
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
  return <NoShowKitView locale={locale} pathLocale={locale} />;
}
