export const WEEKLY_STAGES = [
  "RESEARCH",
  "SELECT",
  "BLOG_DRAFT",
  "NEWSLETTER_DRAFT",
  "BLUEPRINT_CANDIDATES",
  "QA",
  "REVIEW_QUEUE",
] as const;

export type WeeklyStage = (typeof WEEKLY_STAGES)[number];

export const ARTICLE_CATEGORIES = ["ai-news", "us-tech", "practical-ai", "technical"] as const;
export type WeeklyCategory = (typeof ARTICLE_CATEGORIES)[number];

export type SourceRecord = {
  url: string;
  canonicalUrl: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  summary: string;
  relevance: number;
  implication: string;
  /** Documentation-backed advice that is not a news story. */
  evergreen?: boolean;
};

export type BlogDraft = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  sourceUrls: string[];
  category: WeeklyCategory;
  relatedBlueprints: string[];
  seoTitle: string;
  seoDescription: string;
  status: "READY_FOR_REVIEW";
  canonicalUrl: string;
};

export type NewsletterDraft = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  sourceUrls: string[];
  status: "READY_FOR_REVIEW";
};

export type BlueprintRecommendation = "build" | "merge" | "skip";

export type BlueprintCandidate = {
  slug: string;
  title: string;
  summary: string;
  enTitle: string;
  jaTitle: string;
  problem: string;
  targetUser: string;
  workflow: string;
  tools: string;
  businessValue: string;
  overlap: string;
  recommendation: BlueprintRecommendation;
  relatedSlug: string | null;
  sourceUrls: string[];
  canonicalUrl: string;
  status: "READY_FOR_REVIEW";
};

export type QaDecision = {
  kind: "blog" | "newsletter" | "blueprint";
  slug: string;
  pass: boolean;
  reasons: string[];
};

export type WeeklyCounts = {
  researched: number;
  selected: number;
  blogs: number;
  newsletter: number;
  blueprints: number;
  qaPassed: number;
  qaRejected: number;
  queued: number;
  duplicates: number;
};

export type WeeklyState = {
  runId: string;
  weekKey: string;
  stage: WeeklyStage | "DONE";
  status: "running" | "failed" | "succeeded";
  startedAt: string;
  finishedAt: string | null;
  updatedAt: string;
  counts: WeeklyCounts;
  errors: string[];
  completed: WeeklyStage[];
  research: SourceRecord[];
  selected: SourceRecord[];
  blogs: BlogDraft[];
  newsletter: NewsletterDraft | null;
  blueprints: BlueprintCandidate[];
  qa: QaDecision[];
  queued: string[];
};

export type QueueInsert =
  | { kind: "blog"; draft: BlogDraft }
  | { kind: "newsletter"; draft: NewsletterDraft }
  | { kind: "blueprint"; draft: BlueprintCandidate };

export type QueueWrite = {
  insert: (item: QueueInsert) => Promise<"inserted" | "duplicate">;
};

export function emptyCounts(): WeeklyCounts {
  return {
    researched: 0,
    selected: 0,
    blogs: 0,
    newsletter: 0,
    blueprints: 0,
    qaPassed: 0,
    qaRejected: 0,
    queued: 0,
    duplicates: 0,
  };
}
