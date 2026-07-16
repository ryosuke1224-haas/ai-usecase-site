import { z } from "zod";

export const difficultySchema = z.enum([
  "Beginner",
  "Intermediate",
  "Advanced",
]);

export const automationLevelSchema = z.enum([
  "Manual trigger",
  "Semi-automated",
  "Fully automated",
]);

export const valuePotentialSchema = z.enum(["High", "Medium", "Emerging"]);

export const privacyLevelSchema = z.enum([
  "Public",
  "Internal",
  "Sensitive",
  "PII",
]);

export const useCaseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    category: z.string().min(1),
    tagline: z.string().optional(),
    industries: z.array(z.string()).min(1),
    businessFunctions: z.array(z.string()).min(1),
    summary: z.string().min(1),
    businessProblem: z.string().min(1),
    outcome: z.string().min(1),
    whoItsFor: z.string().min(1),
    requiredDataSources: z.array(z.string()),
    aiInputs: z.array(z.string()).min(1),
    aiOutputs: z.array(z.string()).min(1),
    requiredApis: z.array(z.string()).min(1),
    noCodeTools: z.array(z.string()).min(1),
    lowCodeTools: z.array(z.string()).min(1),
    customBuildStack: z.array(z.string()).min(1),
    implementationSteps: z.array(z.string()).min(1),
    systemBehavior: z.array(z.string()).min(1),
    risks: z.array(z.string()).min(1),
    difficulty: difficultySchema,
    automationLevel: automationLevelSchema,
    valuePotential: valuePotentialSchema,
    relatedUseCases: z.array(z.string()),
    tags: z.array(z.string()),
    featured: z.boolean(),
  })
  .strict();

export const apiToolSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    provider: z.string().min(1),
    category: z.string().min(1),
    summary: z.string().min(1),
    whatItDoes: z.string().min(1),
    dataAvailable: z.array(z.string()).min(1),
    actionsSupported: z.array(z.string()).min(1),
    authenticationType: z.string().min(1),
    commonUseCases: z.array(z.string()),
    relatedDataSources: z.array(z.string()),
    difficulty: difficultySchema,
    privacyNotes: z.string().min(1),
    documentationUrlPlaceholder: z.string().min(1),
    tags: z.array(z.string()),
  })
  .strict();

export const dataSourceSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    examples: z.array(z.string()).min(1),
    category: z.string().min(1),
    summary: z.string().min(1),
    whatItContains: z.string().min(1),
    whatAiCanDoWithIt: z.array(z.string()).min(1),
    relatedUseCases: z.array(z.string()),
    relatedApis: z.array(z.string()),
    privacyLevel: privacyLevelSchema,
    accessMethod: z.string().min(1),
    tags: z.array(z.string()),
  })
  .strict();

export const workflowIdeaSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    apiCombination: z.array(z.string()).min(1),
    dataSources: z.array(z.string()).min(1),
    possibleUseCases: z.array(z.string()).min(1),
    exampleWorkflow: z.string().min(1),
    businessValue: z.string().min(1),
    implementationDifficulty: difficultySchema,
    recommendedFor: z.array(z.string()).min(1),
    risks: z.array(z.string()).min(1),
  })
  .strict();

export const sourceTypeSchema = z.enum([
  "documentation",
  "blog",
  "templates",
  "api-reference",
]);

export const sourceRegistryItemSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    url: z.string().url(),
    type: sourceTypeSchema,
    focus: z.string().min(1),
    priority: z.enum(["high", "medium", "low"]),
    checkFrequency: z.enum(["daily", "weekly", "monthly"]),
    notes: z.string(),
  })
  .strict();

export const sourceRegistrySchema = z.array(sourceRegistryItemSchema);

export type Difficulty = z.infer<typeof difficultySchema>;
export type AutomationLevel = z.infer<typeof automationLevelSchema>;
export type ValuePotential = z.infer<typeof valuePotentialSchema>;
export type PrivacyLevel = z.infer<typeof privacyLevelSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;

export type UseCase = z.infer<typeof useCaseSchema>;
export type ApiTool = z.infer<typeof apiToolSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type WorkflowIdea = z.infer<typeof workflowIdeaSchema>;
export type SourceRegistryItem = z.infer<typeof sourceRegistryItemSchema>;

/** @deprecated Use ApiTool */
export type Api = ApiTool;
