import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UseCaseCatalog } from "@/components/use-case-catalog";
import { loadPublishedContent } from "@/src/content/load-published";
import { siteCopy } from "@/src/lib/i18n/copy";
import { isUiLocale, localizedHref } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isUiLocale(locale)) return {};
  const copy = siteCopy(locale).catalog;
  return {
    title: copy.title,
    description: copy.body,
    alternates: { canonical: `/${locale}/use-cases` },
    robots: { index: false, follow: false },
  };
}

export default async function LocaleUseCasesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale)) notFound();
  const copy = siteCopy(locale).catalog;
  const { useCases } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">{copy.eyebrow(useCases.length)}</p>
        <h1 className="mt-1 text-2xl font-bold">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted">{copy.body}</p>
        <p className="mt-2 text-xs text-muted">
          <Link href={locale === "ja" ? "/ja/business-areas" : "/business-areas"} className="text-accent hover:underline">
            {siteCopy(locale).nav.businessAreas}
          </Link>
          {" · "}
          <Link href={localizedHref(locale, "/blueprints/ai-collections-assistant")} className="text-accent hover:underline">
            AI Collections Assistant
          </Link>
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
          <UseCaseCatalog catalogPath={localizedHref(locale, "/use-cases")} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
