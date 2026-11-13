import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PipelinePublicView } from "@/components/premium/ai-pipeline-risk-detector/public-view";
import { isUiLocale, pipelinePaths } from "@/src/lib/i18n/locale";
import { pipelineCopy } from "@/src/lib/premium/ai-pipeline-risk-detector/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = pipelineCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: pipelinePaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocalePipelinePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <PipelinePublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
