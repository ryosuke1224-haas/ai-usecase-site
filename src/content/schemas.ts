import { z } from "zod";
import { BUSINESS_AREAS } from "@/src/lib/business-areas";
import { BUSINESS_PROBLEMS } from "@/src/lib/business-problems";

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

export const businessProblemSchema = z.enum(BUSINESS_PROBLEMS);

export const businessAreaSchema = z.enum(BUSINESS_AREAS);

/**
 * Optional plain-language guide shown above the technical sections of a
 * blueprint page. Written for a non-technical owner: no APIs, providers, or
 * integration details.
 */
const blueprintFindingSchema = z
  .object({
    label: z.string().min(1),
    finding: z.string().min(1),
    whyItMatters: z.string().min(1),
    nextAction: z.string().min(1),
  })
  .strict();

const blueprintStartOptionSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    ctaLabel: z.string().min(1),
    /** Omitted when the option is not available yet. */
    href: z.string().min(1).optional(),
  })
  .strict();

export const blueprintGuideSchema = z
  .object({
    businessProblem: z
      .object({
        summary: z.string().min(1),
        goodFitHeading: z.string().min(1),
        goodFitIf: z.array(z.string()).min(1),
      })
      .strict(),
    whatItDoes: z
      .object({
        summary: z.string().min(1),
        capabilities: z.array(z.string()).min(1),
        confidenceNote: z.string().min(1),
        confidenceLevels: z
          .array(
            z
              .object({
                label: z.string().min(1),
                description: z.string().min(1),
              })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    howItWorks: z
      .object({
        inputs: z.array(z.string()).min(1),
        stages: z.array(z.string()).min(1),
        note: z.string().min(1),
      })
      .strict(),
    whatYouNeed: z
      .object({
        items: z.array(z.string()).min(1),
        note: z.string().min(1).optional(),
      })
      .strict(),
    exampleOutput: z
      .object({
        disclaimer: z.string().min(1),
        findings: z.array(blueprintFindingSchema).min(1),
      })
      .strict(),
    manualApproach: z
      .object({
        effort: z.string().min(1),
        steps: z.array(z.string()).min(1),
        note: z.string().min(1),
      })
      .strict(),
    automatedApproach: z
      .object({
        effort: z.string().min(1),
        summary: z.string().min(1),
        capabilities: z.array(z.string()).min(1),
        note: z.string().min(1),
      })
      .strict(),
    gettingStarted: z.array(blueprintStartOptionSchema).min(1),
  })
  .strict();

/**
 * Opt-in page template. Absent means the long-standing blueprint template,
 * so existing use cases keep rendering exactly as before.
 */
export const templateVersionSchema = z.enum(["experience-v2"]);

export const publishStatusSchema = z.enum(["published", "preview"]);

const metricSchema = z
  .object({
    value: z.string().min(1),
    label: z.string().min(1),
  })
  .strict();

const labelledItemsSchema = z
  .object({
    heading: z.string().min(1),
    items: z.array(z.string()).min(1),
  })
  .strict();

/**
 * Scenes for the tile preview animation. Rendered as a static final scene
 * when JavaScript or motion is unavailable.
 */
const tileSceneSchema = z
  .object({
    /** Short status caption, e.g. "AI organizing...". */
    caption: z.string().min(1),
    metrics: z.array(metricSchema),
  })
  .strict();

const demoEmailSchema = z
  .object({
    subject: z.string().min(1),
    /** Drives emphasis and an explicit text label, never colour alone. */
    priority: z.enum(["high", "normal", "low"]),
  })
  .strict();

const demoEventSchema = z
  .object({
    time: z.string().min(1),
    title: z.string().min(1),
    conflict: z.boolean().optional(),
  })
  .strict();

const briefingGroupSchema = z
  .object({
    label: z.string().min(1),
    items: z
      .array(
        z
          .object({
            title: z.string().min(1),
            /** Deadline or time context shown beside the title. */
            meta: z.string().optional(),
            /** Stated in the source data. */
            fact: z.string().optional(),
            /** Model inference, labelled separately from facts. */
            interpretation: z.string().optional(),
            /** Recommended next step for the owner to approve. */
            action: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const conceptDemoSchema = z
  .object({
    inputs: z
      .object({
        metrics: z.array(metricSchema).min(1),
        emails: z.array(demoEmailSchema).min(1),
        events: z.array(demoEventSchema).min(1),
      })
      .strict(),
    processingSteps: z.array(z.string()).min(1),
    summary: z.array(metricSchema).min(1),
    briefing: z
      .object({
        title: z.string().min(1),
        groups: z.array(briefingGroupSchema).min(1),
        status: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const offerSchema = z
  .object({
    /** Chooses the configurable destination; see src/lib/offers.ts. */
    key: z.enum(["manual", "local", "app"]),
    label: z.string().min(1),
    name: z.string().min(1),
    price: z.string().min(1),
    badge: z.string().optional(),
    status: z.string().optional(),
    description: z.string().min(1),
    /** One-line audience hint, e.g. "Best for learning and customization". */
    bestFor: z.string().optional(),
    features: z.array(z.string()).min(1),
    note: z.string().optional(),
    /** Label once a real purchase or signup destination is configured. */
    ctaLabel: z.string().min(1),
    /**
     * Label while no destination is configured and the CTA falls back to the
     * contact route, so a preview state never implies a working checkout.
     */
    previewCtaLabel: z.string().optional(),
    /** Marks the visually primary purchase path. */
    primary: z.boolean().optional(),
  })
  .strict();

export const useCaseExperienceSchema = z
  .object({
    tile: z
      .object({
        headline: z.string().min(1),
        scenes: z.array(tileSceneSchema).min(1),
        demoLabel: z.string().min(1),
        workflowLabel: z.string().min(1),
      })
      .strict(),
    hero: z
      .object({
        headline: z.string().min(1),
        description: z.string().min(1),
        demoLabel: z.string().min(1),
        workflowLabel: z.string().min(1),
      })
      .strict(),
    outcomes: z
      .object({
        metrics: z.array(metricSchema).min(1),
        supporting: z.string().min(1),
      })
      .strict(),
    conceptDemo: conceptDemoSchema,
    sampleBriefing: z
      .object({
        heading: z.string().min(1),
        title: z.string().min(1),
        date: z.string().min(1),
        groups: z.array(briefingGroupSchema).min(1),
        secondaryActionLabel: z.string().min(1),
      })
      .strict(),
    workflow: z
      .object({
        heading: z.string().min(1),
        steps: z
          .array(
            z
              .object({
                title: z.string().min(1),
                description: z.string().min(1),
              })
              .strict(),
          )
          .min(1),
        note: z.string().min(1),
      })
      .strict(),
    responsibilities: z
      .object({
        heading: z.string().min(1),
        ai: labelledItemsSchema,
        human: labelledItemsSchema,
      })
      .strict(),
    learning: z
      .object({
        heading: z.string().min(1),
        items: z.array(z.string()).min(1),
        supporting: z.string().min(1),
      })
      .strict(),
    offers: z
      .object({
        heading: z.string().min(1),
        items: z.array(offerSchema).min(1),
      })
      .strict(),
    setup: z
      .object({
        heading: z.string().min(1),
        steps: z.array(z.string()).min(1),
        ctaLabel: z.string().min(1),
      })
      .strict(),
    safety: labelledItemsSchema,
    faq: z
      .array(
        z
          .object({
            question: z.string().min(1),
            answer: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    finalCta: z
      .object({
        headline: z.string().min(1),
        description: z.string().min(1),
        primaryLabel: z.string().min(1),
        supporting: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const useCaseSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    category: z.string().min(1),
    /** Opt-in alternative page template. Omit to keep the existing template. */
    templateVersion: templateVersionSchema.optional(),
    status: publishStatusSchema.optional(),
    /**
     * Content for the experience-led template. Only read when
     * templateVersion is "experience-v2".
     */
    experience: useCaseExperienceSchema.optional(),
    tagline: z.string().optional(),
    industries: z.array(z.string()).min(1),
    businessFunctions: z.array(z.string()).min(1),
    /**
     * Business-first classification used by /business-areas browsing.
     * Optional so a use case can stay published without being forced into
     * an area it does not clearly belong to.
     */
    businessArea: businessAreaSchema.optional(),
    /**
     * The process a workflow belongs to first. Business-area pages render the
     * full workflow card only here, so a workflow never appears twice on one page.
     */
    primaryBusinessProcess: z.string().optional(),
    /** Other processes in the same area, surfaced as labels on the card. */
    relatedBusinessProcesses: z.array(z.string()).optional(),
    /** Primary + related, kept for backward compatibility and filtering. */
    businessProcesses: z.array(z.string()).optional(),
    businessOutcomes: z.array(z.string()).optional(),
    /** Non-technical walkthrough rendered above the technical sections. */
    blueprintGuide: blueprintGuideSchema.optional(),
    summary: z.string().min(1),
    businessProblem: z.string().min(1),
    businessProblems: z.array(businessProblemSchema).min(1),
    outcome: z.string().min(1),
    expectedOutcomes: z.array(z.string()).min(1),
    whoItsFor: z.string().min(1),
    requiredDataSources: z.array(z.string()),
    requiredData: z.array(z.string()),
    aiInputs: z.array(z.string()).min(1),
    aiOutputs: z.array(z.string()).min(1),
    requiredApis: z.array(z.string()).min(1),
    requiredCapabilities: z.array(z.string()),
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
export type BusinessProblem = z.infer<typeof businessProblemSchema>;
export type UseCaseBusinessArea = z.infer<typeof businessAreaSchema>;
export type BlueprintGuide = z.infer<typeof blueprintGuideSchema>;
export type TemplateVersion = z.infer<typeof templateVersionSchema>;
export type PublishStatus = z.infer<typeof publishStatusSchema>;
export type UseCaseExperience = z.infer<typeof useCaseExperienceSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;

export type UseCase = z.infer<typeof useCaseSchema>;
export type ApiTool = z.infer<typeof apiToolSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type WorkflowIdea = z.infer<typeof workflowIdeaSchema>;
export type SourceRegistryItem = z.infer<typeof sourceRegistryItemSchema>;

/** @deprecated Use ApiTool */
export type Api = ApiTool;
