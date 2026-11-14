import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { subscriberAction, type NewsletterSource, type SubscriberStatus } from "./model";

export async function loadSubscriberRows(): Promise<{ status: string; subscribedAt: string | null }[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("newsletter_subscribers").select("status, subscribed_at").limit(5000);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const record = row as { status?: unknown; subscribed_at?: unknown };
      if (typeof record.status !== "string") return [];
      return [{
        status: record.status,
        subscribedAt: typeof record.subscribed_at === "string" ? record.subscribed_at : null,
      }];
    });
  } catch {
    return null;
  }
}

export type IssueReviewRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  reviewNote: string | null;
  createdAt: string | null;
};

export async function loadIssueReviews(): Promise<IssueReviewRow[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
      .select("id, slug, title, summary, status, review_note, created_at")
      .limit(200);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const record = row as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.status !== "string") return [];
      return [{
        id: record.id,
        slug: typeof record.slug === "string" ? record.slug : "",
        title: record.title,
        summary: typeof record.summary === "string" ? record.summary : "",
        status: record.status,
        reviewNote: typeof record.review_note === "string" ? record.review_note : null,
        createdAt: typeof record.created_at === "string" ? record.created_at : null,
      }];
    });
  } catch {
    return null;
  }
}

export async function updateIssueReview(
  id: string,
  fromStatus: string,
  toStatus: string,
  note: string,
): Promise<"saved" | "missing" | "unavailable"> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("newsletter_issues")
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

export async function saveSubscriber(
  email: string,
  source: NewsletterSource,
  now: Date,
): Promise<"success" | "duplicate" | "unavailable"> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    if (error) return "unavailable";
    const status = (data as { status?: unknown } | null)?.status;
    const existing: SubscriberStatus | null = status === "ACTIVE" || status === "UNSUBSCRIBED" ? status : null;
    const action = subscriberAction(existing);
    if (action === "already") return "duplicate";
    const stamp = now.toISOString();
    if (action === "resubscribe") {
      const updated = await supabase
        .from("newsletter_subscribers")
        .update({ status: "ACTIVE", source, subscribed_at: stamp, unsubscribed_at: null })
        .eq("email", email);
      return updated.error ? "unavailable" : "success";
    }
    const inserted = await supabase.from("newsletter_subscribers").insert({
      email,
      status: "ACTIVE",
      source,
      subscribed_at: stamp,
      unsubscribed_at: null,
    });
    if (!inserted.error) return "success";
    if (inserted.error.code === "23505") return "duplicate";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
