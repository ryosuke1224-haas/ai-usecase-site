import path from "path";

export const CONTENT_ROOT = path.join(process.cwd(), "content");

export const PUBLISHED_ROOT = path.join(CONTENT_ROOT, "published");
export const SUGGESTIONS_ROOT = path.join(CONTENT_ROOT, "suggestions");
export const SOURCES_REGISTRY_PATH = path.join(
  CONTENT_ROOT,
  "sources",
  "sources.json",
);

export const PUBLISHED_DIRS = {
  useCases: path.join(PUBLISHED_ROOT, "use-cases"),
  apis: path.join(PUBLISHED_ROOT, "apis"),
  dataSources: path.join(PUBLISHED_ROOT, "data-sources"),
  workflowIdeas: path.join(PUBLISHED_ROOT, "workflow-ideas"),
} as const;
