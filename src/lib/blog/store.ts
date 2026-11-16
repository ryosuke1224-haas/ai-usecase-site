import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { parsePublicArticle, type PublicArticle } from "./model";

const PUBLIC_COLUMNS =
  "id, slug, title, summary, body, category, source_urls, related_blueprints, status, published_at, featured, display_author, seo_title, seo_description, updated_at";

export async function loadPublishedArticles(): Promise<PublicArticle[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("articles")
      .select(PUBLIC_COLUMNS)
      .eq("status", "PUBLISHED")
      .order("published_at", { ascending: false });
    if (error || !data) return null;
    return data.flatMap((row) => {
      const article = parsePublicArticle(row as Record<string, unknown>);
      return article ? [article] : [];
    });
  } catch {
    return null;
  }
}

export async function loadPublishedArticle(slug: string): Promise<PublicArticle | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("articles")
      .select(PUBLIC_COLUMNS)
      .eq("slug", slug)
      .eq("status", "PUBLISHED")
      .maybeSingle();
    if (error || !data) return null;
    return parsePublicArticle(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Status only. Bodies and titles stay off the operations dashboard counts. */
export async function loadSitemapArticles(): Promise<{ slug: string; status: string; publishedAt: string | null }[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("articles")
      .select("slug, status, published_at")
      .eq("status", "PUBLISHED");
    if (error || !data) return [];
    return data.flatMap((row) => {
      const record = row as { slug?: unknown; status?: unknown; published_at?: unknown };
      if (typeof record.slug !== "string" || typeof record.status !== "string") return [];
      return [{
        slug: record.slug,
        status: record.status,
        publishedAt: typeof record.published_at === "string" ? record.published_at : null,
      }];
    });
  } catch {
    return [];
  }
}

export type ArticleReviewRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: string;
  reviewNote: string | null;
  createdAt: string | null;
  relatedBlueprints: string[];
  sourceUrls: string[];
};

export async function loadArticleReviews(): Promise<ArticleReviewRow[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id, slug, title, summary, status, review_note, created_at, related_blueprints, source_urls")
      .limit(200);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const record = row as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.title !== "string" || typeof record.status !== "string") return [];
      const related = Array.isArray(record.related_blueprints)
        ? record.related_blueprints.filter((item): item is string => typeof item === "string")
        : [];
      const sourceUrls = Array.isArray(record.source_urls)
        ? record.source_urls.filter((item): item is string => typeof item === "string" && item.startsWith("https://")).slice(0, 8)
        : [];
      return [{
        id: record.id,
        slug: typeof record.slug === "string" ? record.slug : "",
        title: record.title,
        summary: typeof record.summary === "string" ? record.summary : "",
        status: record.status,
        reviewNote: typeof record.review_note === "string" ? record.review_note : null,
        createdAt: typeof record.created_at === "string" ? record.created_at : null,
        relatedBlueprints: related,
        sourceUrls,
      }];
    });
  } catch {
    return null;
  }
}

export async function updateArticleReview(
  id: string,
  fromStatus: string,
  toStatus: string,
  note: string,
): Promise<"saved" | "missing" | "unavailable"> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("articles")
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

export async function loadArticleStatuses(): Promise<{ status: string }[] | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("articles").select("status").limit(1000);
    if (error || !data) return null;
    return data.flatMap((row) => {
      const status = (row as { status?: unknown }).status;
      return typeof status === "string" ? [{ status }] : [];
    });
  } catch {
    return null;
  }
}
