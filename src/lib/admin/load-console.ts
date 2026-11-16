import "server-only";

import { performanceProducts, shippedBlueprintPage } from "./catalog";
import { loadArticleReviews } from "@/src/lib/blog/store";
import { relatedBlueprintLinks } from "@/src/lib/blog/model";
import { loadIssueReviews } from "@/src/lib/newsletter/store";
import { nextOperationsAction, productOperationRows, type AtlasRunSummary, type ProductOperationRow } from "./atlas-state";
import { readAtlasMemory } from "./read-atlas";
import { loadAdminActions, loadStoredReviewItems, type AdminActionRow } from "./review-store";
import { loadWeeklyRuns } from "./weekly-runs";
import { candidateReviewStatus, queueItems, safePreviewPath, sourceLinks, type ReviewItem } from "./review";

export type ConsoleData = {
  storage: "ready" | "unavailable";
  queue: ReviewItem[];
  articles: ReviewItem[];
  issues: ReviewItem[];
  products: ProductOperationRow[];
  runs: ReturnType<typeof readAtlasMemory>["runs"];
  nextAction: string;
  actions: AdminActionRow[] | null;
};

function articleItem(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  reviewNote: string | null;
  createdAt: string | null;
  relatedBlueprints: string[];
  sourceUrls: string[];
}): ReviewItem {
  const related = relatedBlueprintLinks(row.relatedBlueprints)[0] ?? null;
  const noted = sourceLinks(row.reviewNote);
  return {
    id: row.id,
    type: "BLOG",
    title: row.title,
    summary: row.summary,
    status: row.status,
    createdAt: row.createdAt,
    qa: row.reviewNote ? `Review note: ${row.reviewNote}` : "No review note yet.",
    previewHref: row.status === "PUBLISHED" ? safePreviewPath(`/ja/blog/${row.slug}`) : null,
    relatedHref: related?.href ?? null,
    relatedLabel: related?.titleJa ?? null,
    mutable: true,
    source: "articles",
    sources: row.sourceUrls.length > 0 ? row.sourceUrls : noted,
  };
}

function mergeRuns(local: AtlasRunSummary[], weekly: AtlasRunSummary[]): AtlasRunSummary[] {
  const byId = new Map<string, AtlasRunSummary>();
  for (const run of [...local, ...weekly]) {
    const current = byId.get(run.id);
    if (!current || (run.updatedAt ?? "") > (current.updatedAt ?? "")) byId.set(run.id, run);
  }
  return [...byId.values()].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")).slice(0, 30);
}

export async function loadConsole(): Promise<ConsoleData> {
  const memory = readAtlasMemory();
  const [articles, issues, stored, actions, weeklyRuns] = await Promise.all([
    loadArticleReviews(),
    loadIssueReviews(),
    loadStoredReviewItems(),
    loadAdminActions(),
    loadWeeklyRuns(),
  ]);
  const storage = articles && issues && stored ? "ready" : "unavailable";
  const articleItems = (articles ?? []).map(articleItem);
  const issueItems: ReviewItem[] = (issues ?? []).map((row) => ({
    id: row.id,
    type: "NEWSLETTER",
    title: row.title,
    summary: row.summary,
    status: row.status,
    createdAt: row.createdAt,
    qa: row.reviewNote ? `Review note: ${row.reviewNote}` : "No review note yet. Sending is not connected.",
    previewHref: null,
    relatedHref: null,
    relatedLabel: null,
    mutable: true,
    source: "newsletter_issues",
    sources: sourceLinks(row.reviewNote),
  }));
  const storedItems: ReviewItem[] = (stored ?? []).map((row) => ({
    id: row.id,
    type: row.itemType,
    title: row.title,
    summary: row.summary,
    status: row.status,
    createdAt: row.createdAt,
    qa: row.qaNote ?? "No QA note yet.",
    previewHref: safePreviewPath(row.previewPath),
    relatedHref: row.relatedSlug ? safePreviewPath(`/ja/blueprints/${row.relatedSlug}`) : null,
    relatedLabel: row.relatedSlug,
    mutable: true,
    source: "review_items",
    sources: sourceLinks(row.qaNote),
  }));
  const memoryItems: ReviewItem[] = [
    ...memory.candidates
      .filter((item) => item.status !== "BUILT" && item.status !== "COMPLETED")
      .map((item) => ({
        id: item.id,
        type: "BLUEPRINT" as const,
        title: item.name,
        summary: item.summary,
        status: candidateReviewStatus(item.status),
        createdAt: item.updatedAt,
        qa: `Candidate status ${item.status}.`,
        previewHref: shippedBlueprintPage(item.id) ? safePreviewPath(`/ja/blueprints/${item.id}`) : null,
        relatedHref: null,
        relatedLabel: null,
        mutable: false,
        source: "atlas-memory" as const,
      })),
    ...memory.japan
      .filter((item) => item.status === "READY_FOR_JAPAN_REVIEW")
      .map((item) => ({
        id: `japan-${item.slug}`,
        type: "BLUEPRINT" as const,
        title: item.slug,
        summary: "Japanese localization is recorded as ready for review.",
        status: "READY_FOR_REVIEW",
        createdAt: item.updatedAt,
        qa: item.qa,
        previewHref: shippedBlueprintPage(item.slug) ? safePreviewPath(`/ja/blueprints/${item.slug}`) : null,
        relatedHref: null,
        relatedLabel: null,
        mutable: false,
        source: "atlas-memory" as const,
      })),
  ];
  const queue = queueItems([...articleItems, ...issueItems, ...storedItems, ...memoryItems]);
  const runs = mergeRuns(memory.runs, weeklyRuns);
  return {
    storage,
    queue,
    articles: articleItems,
    issues: issueItems,
    products: productOperationRows({
      products: performanceProducts(),
      japan: memory.japan,
      candidates: memory.candidates,
    }),
    runs,
    nextAction: nextOperationsAction({ runs, waitingReviews: queue.length }),
    actions,
  };
}
