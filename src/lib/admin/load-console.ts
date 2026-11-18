import "server-only";

import { performanceProducts, shippedBlueprintPage } from "./catalog";
import { loadArticleReviews } from "@/src/lib/blog/store";
import { relatedBlueprintLinks } from "@/src/lib/blog/model";
import { noteApplied } from "./editorial";
import { loadIssueReviews } from "@/src/lib/newsletter/store";
import { nextOperationsAction, productOperationRows, type AtlasRunSummary, type ProductOperationRow } from "./atlas-state";
import { readAtlasMemory } from "./read-atlas";
import { loadAdminActions, loadStoredReviewItems, type AdminActionRow } from "./review-store";
import { loadWeeklyRuns } from "./weekly-runs";
import {
  candidateReviewStatus,
  historyReviewItems,
  publishPendingItems,
  queueItems,
  safePreviewPath,
  sourceLinks,
  type ReviewItem,
} from "./review";

export type ConsoleData = {
  storage: "ready" | "unavailable";
  queue: ReviewItem[];
  publishPending: ReviewItem[];
  completed: ReviewItem[];
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
  body: string;
  editorialNote: string;
  proposedBody: string | null;
  editorialAppliedNote: string | null;
  publishedAt: string | null;
  editorialEnabled: boolean;
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
    qa: row.reviewNote ? `メモ: ${row.reviewNote}` : "メモはまだありません。",
    previewHref: row.status === "PUBLISHED" ? safePreviewPath(`/ja/blog/${row.slug}`) : null,
    relatedHref: related?.href ?? null,
    relatedLabel: related?.titleJa ?? null,
    mutable: true,
    source: "articles",
    sources: row.sourceUrls.length > 0 ? row.sourceUrls : noted,
    editorial: row.editorialEnabled
      ? {
          note: row.editorialNote,
          applied: noteApplied(row.editorialNote, row.editorialAppliedNote),
          body: row.body,
          proposedBody: row.proposedBody,
          publishedAt: row.publishedAt,
        }
      : null,
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
    qa: row.reviewNote ? `メモ: ${row.reviewNote}` : "メモはまだありません。配信はまだつながりません。",
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
    qa: row.qaNote ?? "QAメモはまだありません。",
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
        qa: `候補の記録: ${item.status}`,
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
        summary: "日本語化は確認待ちとして記録されています。",
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
  const allItems = [...articleItems, ...issueItems, ...storedItems, ...memoryItems];
  const queue = queueItems(allItems);
  const publishPending = publishPendingItems(allItems);
  const completed = historyReviewItems(allItems);
  const runs = mergeRuns(memory.runs, weeklyRuns);
  return {
    storage,
    queue,
    publishPending,
    completed,
    articles: articleItems,
    issues: issueItems,
    products: productOperationRows({
      products: performanceProducts(),
      japan: memory.japan,
      candidates: memory.candidates,
    }),
    runs,
    nextAction: nextOperationsAction({ runs, waitingReviews: queue.length + publishPending.length }),
    actions,
  };
}
