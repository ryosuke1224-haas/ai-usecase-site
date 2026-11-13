import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReferenceDirectory } from "@/components/discovery/reference-directory";
import { loadPublishedContent } from "@/src/content/load-published";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { isPublicJapaneseCatalogUseCase, japaneseCatalogHref, useCasesForReference } from "@/src/lib/i18n/japanese-catalog";
import { isUiLocale } from "@/src/lib/i18n/locale";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "API・ツール",
  robots: { index: false, follow: false },
};

export default async function LocaleApisPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isUiLocale(locale) || locale !== "ja") notFound();
  const { apis, useCases } = loadPublishedContent();
  const visible = useCases.filter(isPublicJapaneseCatalogUseCase);
  const items = apis.flatMap((api) => {
    const products = useCasesForReference(visible, "requiredApis", api.slug).flatMap((useCase) => {
      const label = japaneseUseCase(useCase.slug);
      if (!label) return [];
      return [{ slug: useCase.slug, title: label.title, href: japaneseCatalogHref(useCase) }];
    });
    if (products.length === 0) return [];
    return [{
      slug: api.slug,
      name: api.name,
      filterHref: `/ja/use-cases?api=${encodeURIComponent(api.slug)}`,
      products,
    }];
  });

  return (
    <ReferenceDirectory
      title="API・ツール"
      intro="公開中のテンプレートが使うツールだけを表示しています。各項目から、そのツールを使うテンプレートを開けます。"
      items={items}
    />
  );
}
