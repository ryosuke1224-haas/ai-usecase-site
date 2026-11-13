import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProposalKitView } from "@/components/premium/ai-proposal-follow-up-assistant/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-proposal-follow-up-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, proposalPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { proposalCopy } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: proposalCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: proposalPaths(locale).kit },
  };
}

export default async function LocaleProposalKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = proposalPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "ai-proposal-follow-up-assistant");
  if (!entitled) {
    const copy = proposalCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="ai-proposal-follow-up-assistant"
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
  return <ProposalKitView locale={locale} pathLocale={locale} />;
}
