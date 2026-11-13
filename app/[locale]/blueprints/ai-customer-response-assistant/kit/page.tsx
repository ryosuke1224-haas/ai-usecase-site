import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReplyKitView } from "@/components/premium/ai-customer-response-assistant/kit-view";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-customer-response-assistant/styles";
import { getCurrentUser } from "@/src/lib/auth";
import { authPath } from "@/src/lib/blueprints";
import { isUiLocale, replyPaths } from "@/src/lib/i18n/locale";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { replyCopy } from "@/src/lib/premium/ai-customer-response-assistant/copy";

export const dynamic = "force-dynamic";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  return {
    title: replyCopy(locale).kitTitle,
    robots: { index: false, follow: false },
    alternates: { canonical: replyPaths(locale).kit },
  };
}

export default async function LocaleReplyKitPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const paths = replyPaths(locale);
  const user = await getCurrentUser();
  if (!user) redirect(authPath(paths.kit, locale));
  const entitled = await hasActiveEntitlement(user.id, "ai-customer-response-assistant");
  if (!entitled) {
    const copy = replyCopy(locale);
    return (
      <PremiumKitLocked
        productSlug="ai-customer-response-assistant"
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
  return <ReplyKitView locale={locale} pathLocale={locale} />;
}
