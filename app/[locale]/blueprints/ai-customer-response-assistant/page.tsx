import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReplyPublicView } from "@/components/premium/ai-customer-response-assistant/public-view";
import { isUiLocale, replyPaths } from "@/src/lib/i18n/locale";
import { replyCopy } from "@/src/lib/premium/ai-customer-response-assistant/copy";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = replyCopy(locale);
  return {
    title: copy.publicTitle,
    description: copy.publicBody,
    alternates: { canonical: replyPaths(locale).demo },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleReplyPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isUiLocale(locale)) notFound();
  return <ReplyPublicView locale={locale} pathLocale={locale} checkoutUnavailable={query.checkout === "unavailable"} />;
}
