import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { UnbilledKitView } from "@/components/premium/unbilled-work-review-queue/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/unbilled-work-review-queue/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, unbilledPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { unbilledCopy } from "@/src/lib/premium/unbilled-work-review-queue/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: unbilledCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: unbilledPaths(locale).kit },
  };
}

export default async function LocaleUnbilledKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = unbilledPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "unbilled-work-review-queue");
  if (!entitled) {
    const copy = unbilledCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="unbilled-work-review-queue"
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
  return <UnbilledKitView locale={locale} pathLocale={locale} />;
}
