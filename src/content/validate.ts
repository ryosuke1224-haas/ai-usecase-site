import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  apiToolSchema,
  dataSourceSchema,
  sourceRegistrySchema,
  useCaseSchema,
  workflowIdeaSchema,
  type ApiTool,
  type DataSource,
  type SourceRegistryItem,
  type UseCase,
  type WorkflowIdea,
} from "./schemas";
import { PUBLISHED_DIRS, SOURCES_REGISTRY_PATH } from "./paths";

export type ValidationIssue = {
  file: string;
  message: string;
};

export type ValidationResult<T> = {
  data: T[];
  issues: ValidationIssue[];
};

function readJsonFiles(dir: string): { file: string; raw: unknown }[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const file = path.join(dir, name);
      const contents = fs.readFileSync(file, "utf-8");
      return { file, raw: JSON.parse(contents) as unknown };
    });
}

function validateCollection<T>(
  dir: string,
  schema: z.ZodType<T>,
  label: string,
): ValidationResult<T> {
  const data: T[] = [];
  const issues: ValidationIssue[] = [];

  for (const { file, raw } of readJsonFiles(dir)) {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      issues.push({
        file,
        message: `${label} validation failed: ${parsed.error.message}`,
      });
      continue;
    }

    const basename = path.basename(file, ".json");
    const item = parsed.data as { slug?: string };
    if (item.slug && item.slug !== basename) {
      issues.push({
        file,
        message: `${label} slug "${item.slug}" does not match filename "${basename}"`,
      });
      continue;
    }

    data.push(parsed.data);
  }

  return { data, issues };
}

export function validatePublishedContent(): {
  useCases: ValidationResult<UseCase>;
  apis: ValidationResult<ApiTool>;
  dataSources: ValidationResult<DataSource>;
  workflowIdeas: ValidationResult<WorkflowIdea>;
  allIssues: ValidationIssue[];
} {
  const useCases = validateCollection(
    PUBLISHED_DIRS.useCases,
    useCaseSchema,
    "UseCase",
  );
  const apis = validateCollection(PUBLISHED_DIRS.apis, apiToolSchema, "ApiTool");
  const dataSources = validateCollection(
    PUBLISHED_DIRS.dataSources,
    dataSourceSchema,
    "DataSource",
  );
  const workflowIdeas = validateCollection(
    PUBLISHED_DIRS.workflowIdeas,
    workflowIdeaSchema,
    "WorkflowIdea",
  );

  const allIssues = [
    ...useCases.issues,
    ...apis.issues,
    ...dataSources.issues,
    ...workflowIdeas.issues,
  ];

  return { useCases, apis, dataSources, workflowIdeas, allIssues };
}

export function validateSourceRegistry(): {
  sources: SourceRegistryItem[];
  issues: ValidationIssue[];
} {
  if (!fs.existsSync(SOURCES_REGISTRY_PATH)) {
    return {
      sources: [],
      issues: [
        {
          file: SOURCES_REGISTRY_PATH,
          message: "Source registry file not found",
        },
      ],
    };
  }

  const raw = JSON.parse(fs.readFileSync(SOURCES_REGISTRY_PATH, "utf-8"));
  const parsed = sourceRegistrySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      sources: [],
      issues: [
        {
          file: SOURCES_REGISTRY_PATH,
          message: parsed.error.message,
        },
      ],
    };
  }

  return { sources: parsed.data, issues: [] };
}

export function assertValidPublishedContent(): void {
  const { allIssues } = validatePublishedContent();
  const registry = validateSourceRegistry();

  const issues = [...allIssues, ...registry.issues];
  if (issues.length > 0) {
    const detail = issues.map((i) => `  ${i.file}: ${i.message}`).join("\n");
    throw new Error(`Content validation failed:\n${detail}`);
  }
}
