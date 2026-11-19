"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth";
import { updateArticleReview, loadArticleReviews } from "@/src/lib/blog/store";
import { loadIssueReviews, updateIssueReview } from "@/src/lib/newsletter/store";
import { adminAccessDecision, parseAdminAllowlist } from "./access";
import { loadStoredReviewItems, recordAdminAction, updateStoredReview } from "./review-store";
import { isReviewAction, isReviewId, reviewDecision, type ReviewAction } from "./review";
import { adminProjectHref, parseAdminSection, parseDashboardRange } from "./range";

const TARGETS = ["blog", "newsletter", "review"] as const;
type TargetType = (typeof TARGETS)[number];

function noticePath(formData: FormData, notice: string): string {
  const section = parseAdminSection(String(formData.get("section") ?? ""));
  const range = parseDashboardRange(String(formData.get("range") ?? ""));
  return adminProjectHref(section, range, notice);
}

function refreshAdminViews(formData: FormData): void {
  const section = parseAdminSection(String(formData.get("section") ?? ""));
  const range = parseDashboardRange(String(formData.get("range") ?? ""));
  revalidatePath("/admin/project");
  revalidatePath(adminProjectHref(section, range));
  revalidatePath(adminProjectHref("review", range));
  revalidatePath(adminProjectHref("history", range));
}

async function decideWithAction(formData: FormData, action: ReviewAction): Promise<void> {
  formData.set("decision", action);
  await decideReview(formData);
}

export async function approveReview(formData: FormData): Promise<void> {
  await decideWithAction(formData, "approve");
}

export async function needsChangesReview(formData: FormData): Promise<void> {
  await decideWithAction(formData, "needs_changes");
}

export async function rejectReview(formData: FormData): Promise<void> {
  await decideWithAction(formData, "reject");
}

export async function decideReview(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const access = adminAccessDecision(user, parseAdminAllowlist(process.env.ATLAS_ADMIN_EMAILS));
  if (access !== "allow" || !user?.email) {
    refreshAdminViews(formData);
    redirect(noticePath(formData, "refused"));
  }

  const target = String(formData.get("target") ?? "");
  const action = String(formData.get("decision") ?? "");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!TARGETS.includes(target as TargetType) || !isReviewAction(action) || !isReviewId(id)) {
    refreshAdminViews(formData);
    redirect(noticePath(formData, "refused"));
  }

  const rows = target === "blog"
    ? await loadArticleReviews()
    : target === "newsletter"
      ? await loadIssueReviews()
      : await loadStoredReviewItems();
  if (!rows) {
    refreshAdminViews(formData);
    redirect(noticePath(formData, "unavailable"));
  }
  const current = rows.find((row) => row.id === id);
  if (!current) {
    refreshAdminViews(formData);
    redirect(noticePath(formData, "refused"));
  }

  const decision = reviewDecision(current.status, action, note);
  if (!decision.ok) {
    refreshAdminViews(formData);
    redirect(noticePath(formData, decision.reason === "note" ? "note" : decision.reason === "unchanged" ? "unchanged" : "closed"));
  }

  const saved = target === "blog"
    ? await updateArticleReview(id, current.status, decision.status, note)
    : target === "newsletter"
      ? await updateIssueReview(id, current.status, decision.status, note)
      : await updateStoredReview(id, current.status, decision.status, note);
  if (saved !== "saved") {
    refreshAdminViews(formData);
    redirect(noticePath(formData, saved === "missing" ? "refused" : "unavailable"));
  }

  await recordAdminAction({
    actorEmail: user.email.trim().toLowerCase(),
    action,
    targetType: target as TargetType,
    targetId: id,
    targetTitle: "title" in current ? current.title : "",
    fromStatus: current.status,
    toStatus: decision.status,
    note,
  });
  refreshAdminViews(formData);
  redirect(noticePath(formData, "saved"));
}
