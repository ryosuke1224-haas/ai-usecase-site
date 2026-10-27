import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUseCaseBySlug, loadPublishedContent } from "@/src/content/load-published";
import { japaneseCatalogLabel, japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { japaneseBusinessArea, japaneseProcessName } from "@/src/lib/i18n/business-areas";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const copy = locale === "ja" ? japaneseUseCase(slug) : undefined;
  if (!copy) return {};
  return {
    title: copy.title,
    description: copy.summary,
    robots: { index: false, follow: false },
  };
}

export default async function LocaleUseCasePage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const useCase = getUseCaseBySlug(slug);
  const copy = japaneseUseCase(slug);
  if (!useCase || !copy) notFound();
  const content = loadPublishedContent();
  const area = useCase.businessArea ? japaneseBusinessArea(useCase.businessArea) : undefined;
  const process =
    useCase.businessArea && useCase.primaryBusinessProcess
      ? japaneseProcessName(useCase.businessArea, useCase.primaryBusinessProcess)
      : "この業務の手順";
  const data = useCase.requiredDataSources.map((item) => {
    const source = content.dataSources.find((entry) => entry.slug === item);
    return japaneseCatalogLabel(source?.name ?? item);
  });
  const tools = useCase.requiredApis.map((item) => content.apis.find((entry) => entry.slug === item)?.name ?? item);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/ja/use-cases" className="text-xs font-medium text-muted hover:text-accent">
        AI活用テンプレート
      </Link>
      <p className="mt-5 text-xs font-medium text-accent">{japaneseCatalogLabel(useCase.category)}</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{copy.summary}</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card px-4 py-4">
          <dt className="text-xs font-medium text-muted">業務領域</dt>
          <dd className="mt-1 text-sm">
            {area && useCase.businessArea ? (
              <Link href={`/ja/business-areas/${useCase.businessArea}`} className="font-medium text-accent hover:underline">
                {area.title}
              </Link>
            ) : (
              "業務領域"
            )}
          </dd>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-4">
          <dt className="text-xs font-medium text-muted">業務</dt>
          <dd className="mt-1 text-sm">{process}</dd>
        </div>
      </dl>
      <section className="mt-8">
        <h2 className="text-sm font-semibold">必要なデータ</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.map((item) => (
            <li key={item} className="rounded-md bg-surface px-2.5 py-1 text-sm text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-sm font-semibold">使うツール</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {tools.map((item) => (
            <li key={item} className="rounded-md bg-surface px-2.5 py-1 text-sm text-foreground">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        {slug === "ai-collections-assistant" ? (
          <Link href="/ja/blueprints/ai-collections-assistant" className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            このテンプレートを見る
          </Link>
        ) : null}
        {slug === "ai-daily-inbox-briefing" ? (
          <Link href="/ja/my-blueprints" className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            無料テンプレートを開く
          </Link>
        ) : null}
        <Link href="/ja/use-cases" className="inline-flex rounded-lg border border-border/60 px-4 py-2 text-sm font-medium">
          一覧に戻る
        </Link>
      </div>
    </div>
  );
}
