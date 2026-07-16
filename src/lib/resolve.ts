import type { PublishedContent } from "@/src/content/load-published";

export function createContentResolver(content: PublishedContent) {
  const useCaseTitles = new Map(
    content.useCases.map((uc) => [uc.slug, uc.title]),
  );
  const apiNames = new Map(content.apis.map((api) => [api.slug, api.name]));
  const dataSourceNames = new Map(
    content.dataSources.map((ds) => [ds.slug, ds.name]),
  );

  return {
    resolveUseCaseTitle: (slug: string) => useCaseTitles.get(slug) ?? slug,
    resolveApiName: (slug: string) => apiNames.get(slug) ?? slug,
    resolveDataSourceName: (slug: string) => dataSourceNames.get(slug) ?? slug,
  };
}
