import "server-only";
import {
  assertValidPublishedContent,
  validatePublishedContent,
} from "./validate";
import type { ApiTool, DataSource, UseCase, WorkflowIdea } from "./schemas";

export type PublishedContent = {
  useCases: UseCase[];
  apis: ApiTool[];
  dataSources: DataSource[];
  workflowIdeas: WorkflowIdea[];
};

let cached: PublishedContent | null = null;

function sortByTitle<T extends { title?: string; name?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aKey = ("title" in a && a.title) || ("name" in a && a.name) || "";
    const bKey = ("title" in b && b.title) || ("name" in b && b.name) || "";
    return aKey.localeCompare(bKey);
  });
}

export function loadPublishedContent(): PublishedContent {
  if (cached) return cached;

  assertValidPublishedContent();
  const validated = validatePublishedContent();

  cached = {
    useCases: sortByTitle(validated.useCases.data),
    apis: sortByTitle(validated.apis.data),
    dataSources: sortByTitle(validated.dataSources.data),
    workflowIdeas: sortByTitle(validated.workflowIdeas.data),
  };

  return cached;
}

export function getUseCaseBySlug(slug: string): UseCase | undefined {
  return loadPublishedContent().useCases.find((uc) => uc.slug === slug);
}

export function getAllUseCaseSlugs(): string[] {
  return loadPublishedContent().useCases.map((uc) => uc.slug);
}

export function getFeaturedUseCases(): UseCase[] {
  return loadPublishedContent().useCases.filter((uc) => uc.featured);
}

export function getApiBySlug(slug: string): ApiTool | undefined {
  return loadPublishedContent().apis.find((api) => api.slug === slug);
}

export function getAllApiSlugs(): string[] {
  return loadPublishedContent().apis.map((api) => api.slug);
}

export function getDataSourceBySlug(slug: string): DataSource | undefined {
  return loadPublishedContent().dataSources.find((ds) => ds.slug === slug);
}

export function getAllDataSourceSlugs(): string[] {
  return loadPublishedContent().dataSources.map((ds) => ds.slug);
}

export function getWorkflowIdeaBySlug(slug: string): WorkflowIdea | undefined {
  return loadPublishedContent().workflowIdeas.find((wf) => wf.slug === slug);
}

export const useCaseCategories = () =>
  [...new Set(loadPublishedContent().useCases.map((uc) => uc.category))];

export const useCaseIndustries = () =>
  [
    ...new Set(loadPublishedContent().useCases.flatMap((uc) => uc.industries)),
  ];

export const useCaseBusinessFunctions = () =>
  [
    ...new Set(
      loadPublishedContent().useCases.flatMap((uc) => uc.businessFunctions),
    ),
  ];
