import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";

export type StoredReviewItem = {
  id: string;
  itemType: "BLUEPRINT" | "CONTENT_UPDATE";
  title: string;
  summary: string;
  status: string;
  qaNote: string | null;
  reviewNote: string | null;
  previewPath: string | null;
  relatedSlug: string | null;
  createdAt: string | null;
};

export async function loadStoredReviewItems(): Promise<StoredReviewItem[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("review_items")
      .select("id, item_type, title, summary, status, qa_note, review_note, preview_path, related_slug, created_at")
      .limit(200);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const record = row as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.status !== "string") return [];
      if (record.item_type !== "BLUEPRINT" && record.item_type !== "CONTENT_UPDATE") return [];
      return [{
        id: record.id,
        itemType: record.item_type,
        title: record.title,
        summary: typeof record.summary === "string" ? record.summary : "",
        status: record.status,
        qaNote: typeof record.qa_note === "string" ? record.qa_note : null,
        reviewNote: typeof record.review_note === "string" ? record.review_note : null,
        previewPath: typeof record.preview_path === "string" ? record.preview_path : null,
        relatedSlug: typeof record.related_slug === "string" ? record.related_slug : null,
        createdAt: typeof record.created_at === "string" ? record.created_at : null,
      }];
    });
  } catch {
    return null;
  }
}

export async function updateStoredReview(
  id: string,
  fromStatus: string,
  toStatus: string,
  note: string,
): Promise<"saved" | "missing" | "unavailable"> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("review_items")
      .update({ status: toStatus, review_note: note || null })
      .eq("id", id)
      .eq("status", fromStatus)
      .select("id");
    if (error) return "unavailable";
    return data && data.length > 0 ? "saved" : "missing";
  } catch {
    return "unavailable";
  }
}

export async function recordAdminAction(input: {
  actorEmail: string;
  action: "approve" | "needs_changes" | "reject";
  targetType: "blog" | "newsletter" | "review";
  targetId: string;
  targetTitle: string;
  fromStatus: string;
  toStatus: string;
  note: string;
}): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("admin_action_log").insert({
      actor_email: input.actorEmail,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId,
      target_title: input.targetTitle.slice(0, 180),
      from_status: input.fromStatus,
      to_status: input.toStatus,
      note: input.note || null,
    });
  } catch {
    // The decision is already stored. A missing log table does not undo it.
  }
}

export type AdminActionRow = {
  action: string;
  targetTitle: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string | null;
};

export async function loadAdminActions(): Promise<AdminActionRow[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("admin_action_log")
      .select("action, target_title, from_status, to_status, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const record = row as Record<string, unknown>;
      if (typeof record.action !== "string" || typeof record.target_title !== "string") return [];
      return [{
        action: record.action,
        targetTitle: record.target_title,
        fromStatus: typeof record.from_status === "string" ? record.from_status : "",
        toStatus: typeof record.to_status === "string" ? record.to_status : "",
        createdAt: typeof record.created_at === "string" ? record.created_at : null,
      }];
    });
  } catch {
    return null;
  }
}
