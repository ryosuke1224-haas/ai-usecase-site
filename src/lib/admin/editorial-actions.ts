"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/auth";
import {
  acceptArticleProposal,
  clearArticleProposal,
  loadArticleReviews,
  publishApprovedArticle,
  saveArticleEditorialNote,
  saveArticleProposal,
} from "@/src/lib/blog/store";
import { adminAccessDecision, parseAdminAllowlist } from "./access";
import {
  acceptRevision,
  applyEditorialRevision,
  editorialActorAllowed,
  publishActionLog,
  publishDecision,
  saveEditorialNote,
} from "./editorial";
import { adminProjectHref, parseAdminSection, parseDashboardRange } from "./range";
import { recordAdminAction } from "./review-store";
import { isReviewId } from "./review";

function noticePath(formData: FormData, notice: string): string {
  const section = parseAdminSection(String(formData.get("section") ?? ""));
  const range = parseDashboardRange(String(formData.get("range") ?? ""));
  return adminProjectHref(section, range, notice);
}

export async function runEditorial(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const access = adminAccessDecision(user, parseAdminAllowlist(process.env.ATLAS_ADMIN_EMAILS));
  if (!editorialActorAllowed(access) || !user?.email) redirect(noticePath(formData, "refused"));
  const actorEmail = user.email;

  const id = String(formData.get("id") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!isReviewId(id)) redirect(noticePath(formData, "refused"));
  const rows = await loadArticleReviews();
  if (!rows) redirect(noticePath(formData, "unavailable"));
  const current = rows.find((row) => row.id === id);
  if (!current?.editorialEnabled) redirect(noticePath(formData, "unavailable"));

  const log = async (action: "save_editorial_note" | "apply_editorial_note" | "accept_revision" | "keep_revision" | "publish", toStatus: string, note: string) => {
    await recordAdminAction({
      actorEmail,
      action,
      targetType: "blog",
      targetId: id,
      targetTitle: current.title,
      fromStatus: current.status,
      toStatus,
      note,
    });
  };

  if (intent === "save" || intent === "apply") {
    const parsed = saveEditorialNote(String(formData.get("editorial_note") ?? ""));
    if (!parsed.ok) redirect(noticePath(formData, "note"));
    const saved = await saveArticleEditorialNote(id, current.status, parsed.note);
    if (saved !== "saved") redirect(noticePath(formData, saved === "missing" ? "unchanged" : "unavailable"));
    if (intent === "save") {
      await log("save_editorial_note", current.status, parsed.note);
      redirect(noticePath(formData, "saved_note"));
    }
    const revision = applyEditorialRevision({ status: current.status, body: current.body, note: parsed.note });
    if (!revision.ok) redirect(noticePath(formData, "refused"));
    const proposed = await saveArticleProposal(id, current.status, revision.proposedBody);
    if (proposed !== "saved") redirect(noticePath(formData, proposed === "missing" ? "unchanged" : "unavailable"));
    await log("apply_editorial_note", current.status, parsed.note);
    redirect(noticePath(formData, "revision_ready"));
  }

  if (intent === "accept") {
    const accepted = acceptRevision({ status: current.status, proposedBody: current.proposedBody });
    if (!accepted.ok) redirect(noticePath(formData, "refused"));
    const result = await acceptArticleProposal(id, current.status, accepted.status, accepted.body, current.editorialNote);
    if (result !== "saved") redirect(noticePath(formData, result === "missing" ? "unchanged" : "unavailable"));
    await log("accept_revision", accepted.status, current.editorialNote);
    redirect(noticePath(formData, "accepted"));
  }

  if (intent === "keep") {
    const result = await clearArticleProposal(id, current.status);
    if (result !== "saved") redirect(noticePath(formData, result === "missing" ? "unchanged" : "unavailable"));
    await log("keep_revision", current.status, "");
    redirect(noticePath(formData, "kept"));
  }

  if (intent === "publish") {
    const decision = publishDecision({
      status: current.status,
      confirmed: String(formData.get("confirm") ?? "") === "yes",
      pendingRevision: Boolean(current.proposedBody?.trim()),
      publishedAt: current.publishedAt,
      now: new Date(),
    });
    if (!decision.ok) redirect(noticePath(formData, decision.reason === "confirm" ? "confirm" : "refused"));
    const result = await publishApprovedArticle(id, decision.publishedAt);
    if (result !== "saved") redirect(noticePath(formData, result === "missing" ? "unchanged" : "unavailable"));
    const entry = publishActionLog({ actorEmail, targetId: id, targetTitle: current.title });
    await log(entry.action, entry.toStatus, "Published from the review queue.");
    redirect(noticePath(formData, "published"));
  }

  redirect(noticePath(formData, "refused"));
}
