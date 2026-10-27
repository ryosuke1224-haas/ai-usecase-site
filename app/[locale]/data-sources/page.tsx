import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPublishedContent } from "@/src/content/load-published";
import { japaneseCatalogLabel } from "@/src/lib/i18n/catalog-labels";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "データソース",
  robots: { index: false, follow: false },
};

export default async function LocaleDataSourcesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const { dataSources } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">{dataSources.length}件</p>
        <h1 className="mt-1 text-2xl font-bold">データソース</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          請求、メール、予約、口コミなど、テンプレートが前提にしている業務データです。
        </p>
      </header>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dataSources.map((source) => (
          <li key={source.slug} className="rounded-xl border border-border/60 bg-card px-4 py-4 text-sm font-medium">
            {japaneseCatalogLabel(source.name)}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm">
        <Link href="/ja/use-cases" className="font-medium text-accent hover:underline">
          このデータを使うテンプレートを探す
        </Link>
      </p>
    </div>
  );
}
