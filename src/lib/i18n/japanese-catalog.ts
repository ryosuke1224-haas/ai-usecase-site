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

/**
 * Japanese catalog cards open the shipped experience.
 * Premium products use the blueprint purchase page. The free starter uses its kit.
 * Records without a shipped experience stay on the metadata page.
 */
export function useCaseMatchesProcess(
  useCase: {
    primaryBusinessProcess?: string;
    relatedBusinessProcesses?: string[];
    businessProcesses?: string[];
  },
  process: string,
): boolean {
  if (!process) return true;
  const primary = useCase.primaryBusinessProcess ?? useCase.businessProcesses?.[0];
  const related = (useCase.relatedBusinessProcesses ?? useCase.businessProcesses?.slice(1) ?? []).filter(
    (name) => name !== primary,
  );
  return primary === process || related.includes(process);
}

export function japaneseCatalogHref(useCase: { slug: string; accessTier?: string }): string {
  const product = blueprintCatalog.find((item) => item.productSlug === useCase.slug || item.id === useCase.slug);
  if (product?.purchaseHref) return `/ja${product.purchaseHref}`;
  if (product?.access === "free-authenticated") return product.href;
  if (useCase.accessTier === "free") {
    const starter = blueprintCatalog.find((item) => item.access === "free-authenticated");
    if (starter) return starter.href;
  }
  return `/ja/use-cases/${useCase.slug}`;
}

export function facetsUsedByCatalog<TData extends { slug: string }, TApi extends { slug: string }>(
  useCases: {
    requiredDataSources: string[];
    requiredApis: string[];
    difficulty: string;
    automationLevel: string;
  }[],
  dataSources: TData[],
  apis: TApi[],
  difficulties: readonly string[],
  automationLevels: readonly string[],
): { dataSources: TData[]; apis: TApi[]; difficulties: string[]; automationLevels: string[] } {
  const dataSlugs = new Set(useCases.flatMap((item) => item.requiredDataSources));
  const apiSlugs = new Set(useCases.flatMap((item) => item.requiredApis));
  const difficultyValues = new Set(useCases.map((item) => item.difficulty));
  const automationValues = new Set(useCases.map((item) => item.automationLevel));
  return {
    dataSources: dataSources.filter((item) => dataSlugs.has(item.slug)),
    apis: apis.filter((item) => apiSlugs.has(item.slug)),
    difficulties: difficulties.filter((item) => difficultyValues.has(item)),
    automationLevels: automationLevels.filter((item) => automationValues.has(item)),
  };
}

export function useCasesForReference<T extends { requiredApis: string[]; requiredDataSources: string[] }>(
  useCases: T[],
  field: "requiredApis" | "requiredDataSources",
  slug: string,
): T[] {
  return useCases.filter((useCase) => useCase[field].includes(slug));
}
