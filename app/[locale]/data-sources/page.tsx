import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReferenceDirectory } from "@/components/discovery/reference-directory";
import { loadPublishedContent } from "@/src/content/load-published";
import { japaneseCatalogLabel, japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { isPublicJapaneseCatalogUseCase, japaneseCatalogHref, useCasesForReference } from "@/src/lib/i18n/japanese-catalog";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "データソース",
  robots: { index: false, follow: false },
};

export default async function LocaleDataSourcesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const { dataSources, useCases } = loadPublishedContent();
  const visible = useCases.filter(isPublicJapaneseCatalogUseCase);
  const items = dataSources.flatMap((source) => {
    const products = useCasesForReference(visible, "requiredDataSources", source.slug).flatMap((useCase) => {
      const label = japaneseUseCase(useCase.slug);
      if (!label) return [];
      return [{ slug: useCase.slug, title: label.title, href: japaneseCatalogHref(useCase) }];
    });
    if (products.length === 0) return [];
    return [{
      slug: source.slug,
      name: japaneseCatalogLabel(source.name),
      filterHref: `/ja/use-cases?dataSource=${encodeURIComponent(source.slug)}`,
      products,
    }];
  });

  return (
    <ReferenceDirectory
      title="データソース"
      intro="公開中のテンプレートが使う業務データだけを表示しています。各項目から、そのデータを使うテンプレートを開けます。"
      items={items}
    />
  );
}
