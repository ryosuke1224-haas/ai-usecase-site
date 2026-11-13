import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UseCaseCatalog } from "@/components/use-case-catalog";
import { loadPublishedContent } from "@/src/content/load-published";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { isPublicJapaneseCatalogUseCase } from "@/src/lib/i18n/japanese-catalog";
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
  const listed = locale === "ja" ? useCases.filter(isPublicJapaneseCatalogUseCase) : useCases;

  return (
    <div className="launch-canvas mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <header className="border-b border-border/70 pb-6">
        <p className="text-xs font-semibold tracking-wide text-accent">{copy.eyebrow(listed.length)}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href={locale === "ja" ? "/ja/business-areas" : "/business-areas"} className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            {siteCopy(locale).nav.businessAreas}
          </Link>
          <Link href={localizedHref(locale, "/blueprints/ai-collections-assistant")} className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
            {locale === "ja" ? japaneseUseCase("ai-collections-assistant")?.title : "AI Collections Assistant"}
          </Link>
        </p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
          <UseCaseCatalog catalogPath={localizedHref(locale, "/use-cases")} locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}
