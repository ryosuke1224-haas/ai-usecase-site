import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PipelineKitView } from "@/components/premium/ai-pipeline-risk-detector/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-pipeline-risk-detector/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, pipelinePaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { pipelineCopy } from "@/src/lib/premium/ai-pipeline-risk-detector/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: pipelineCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: pipelinePaths(locale).kit },
  };
}

export default async function LocalePipelineKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = pipelinePaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "ai-pipeline-risk-detector");
  if (!entitled) {
    const copy = pipelineCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="ai-pipeline-risk-detector"
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
  return <PipelineKitView locale={locale} pathLocale={locale} />;
}
