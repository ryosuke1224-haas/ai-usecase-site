import "server-only";

import { performanceProducts, shippedBlueprintPage } from "./catalog";
import { loadArticleReviews } from "@/src/lib/blog/store";
import { relatedBlueprintLinks } from "@/src/lib/blog/model";
import { loadIssueReviews } from "@/src/lib/newsletter/store";
import { nextOperationsAction, productOperationRows, type ProductOperationRow } from "./atlas-state";
import { readAtlasMemory } from "./read-atlas";
import { loadAdminActions, loadStoredReviewItems, type AdminActionRow } from "./review-store";
import { candidateReviewStatus, queueItems, safePreviewPath, type ReviewItem } from "./review";

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
}): ReviewItem {
  const related = relatedBlueprintLinks(row.relatedBlueprints)[0] ?? null;
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
  };
}

export async function loadConsole(): Promise<ConsoleData> {
  const memory = readAtlasMemory();
  const [articles, issues, stored, actions] = await Promise.all([
    loadArticleReviews(),
    loadIssueReviews(),
    loadStoredReviewItems(),
    loadAdminActions(),
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
    runs: memory.runs,
    nextAction: nextOperationsAction({ runs: memory.runs, waitingReviews: queue.length }),
    actions,
  };
}
