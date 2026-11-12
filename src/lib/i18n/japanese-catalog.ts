import { blueprintCatalog } from "@/src/lib/blueprints";

/**
 * A published use case is listed in the Japanese public catalog when it has a
 * shipped user-facing implementation: a blueprint in the product catalog, or
 * an experience-v2 template. Metadata-only records stay in source data and
 * remain available at their direct route.
 */
const implementedSlugs = new Set(
  blueprintCatalog.flatMap((item) => [item.id, item.productSlug].filter((slug): slug is string => Boolean(slug))),
);

export function isPublicJapaneseCatalogUseCase(useCase: {
  slug: string;
  templateVersion?: string;
  experience?: unknown;
}): boolean {
  if (useCase.templateVersion === "experience-v2" && useCase.experience) return true;
  return implementedSlugs.has(useCase.slug);
}
