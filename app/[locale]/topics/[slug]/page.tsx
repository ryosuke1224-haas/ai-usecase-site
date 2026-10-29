import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicPageView } from "@/components/topics/topic-page";
import { isUiLocale } from "@/src/lib/i18n/locale";
import { getTopic, topicPath } from "@/src/lib/topics";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isUiLocale(locale)) return {};
  const topic = getTopic(slug);
  if (!topic) return {};
  return {
    title: topic.headline[locale],
    description: topic.purpose[locale],
    alternates: { canonical: topicPath(locale, topic.slug) },
    robots: { index: false, follow: false },
  };
}

export default async function TopicSlugPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isUiLocale(locale)) notFound();
  const topic = getTopic(slug);
  if (!topic) notFound();
  return <TopicPageView locale={locale} topic={topic} />;
}
