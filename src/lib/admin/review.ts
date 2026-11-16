export const REVIEW_TYPES = ["BLOG", "NEWSLETTER", "BLUEPRINT", "CONTENT_UPDATE"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const REVIEW_ACTIONS = ["approve", "needs_changes", "reject"] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const OPEN_REVIEW_STATUSES = ["DRAFT", "READY_FOR_REVIEW", "APPROVED", "NEEDS_CHANGES", "REJECTED"] as const;
export type OpenReviewStatus = (typeof OPEN_REVIEW_STATUSES)[number];

const CLOSED = new Set(["PUBLISHED", "SENT", "ARCHIVED"]);

export type ReviewDecision =
  | { ok: true; status: OpenReviewStatus }
  | { ok: false; reason: "closed" | "unchanged" | "note" };

export function reviewDecision(status: string, action: ReviewAction, note: string): ReviewDecision {
  if (CLOSED.has(status)) return { ok: false, reason: "closed" };
  if (!OPEN_REVIEW_STATUSES.includes(status as OpenReviewStatus)) return { ok: false, reason: "closed" };
  const trimmed = note.trim();
  if ((action === "needs_changes" || action === "reject") && trimmed.length < 3) {
    return { ok: false, reason: "note" };
  }
  const next: OpenReviewStatus = action === "approve" ? "APPROVED" : action === "needs_changes" ? "NEEDS_CHANGES" : "REJECTED";
  if (next === status) return { ok: false, reason: "unchanged" };
  return { ok: true, status: next };
}

export type ReviewItem = {
  id: string;
  type: ReviewType;
  title: string;
  summary: string;
  status: string;
  createdAt: string | null;
  qa: string;
  previewHref: string | null;
  relatedHref: string | null;
  relatedLabel: string | null;
  mutable: boolean;
  source: "articles" | "newsletter_issues" | "review_items" | "atlas-memory";
  sources?: string[];
};

export function isReviewAction(value: string): value is ReviewAction {
  return REVIEW_ACTIONS.some((action) => action === value);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReviewId(value: string): boolean {
  return UUID.test(value);
}

const SAFE_PATH = /^\/(?:ja\/blog\/[a-z0-9-]+|ja\/blueprints\/[a-z0-9-]+|blueprints\/[a-z0-9-]+)$/;

export function safePreviewPath(value: string | null | undefined): string | null {
  if (!value || !SAFE_PATH.test(value)) return null;
  return value;
}

export function candidateReviewStatus(status: string): string {
  if (status === "PROPOSED") return "DRAFT";
  if (status === "HOLD") return "NEEDS_CHANGES";
  if (status === "APPROVED") return "APPROVED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "BUILT" || status === "COMPLETED") return "PUBLISHED";
  return "DRAFT";
}

export function sourceLinks(value: string | null | undefined): string[] {
  if (!value) return [];
  const found = value.match(/https:\/\/[^\s<>)\]]+/g) ?? [];
  return [...new Set(found.map((url) => url.replace(/[.,]$/, "")))].slice(0, 8);
}

export function queueItems(items: readonly ReviewItem[]): ReviewItem[] {
  return items
    .filter((item) => !CLOSED.has(item.status))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
