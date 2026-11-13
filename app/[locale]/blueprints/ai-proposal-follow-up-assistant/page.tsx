import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProposalPublicView } from "@/components/premium/ai-proposal-follow-up-assistant/public-view";
import { isUiLocale, proposalPaths } from "@/src/lib/i18n/locale";
import { proposalCopy } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = proposalCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: proposalPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleProposalPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <ProposalPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
