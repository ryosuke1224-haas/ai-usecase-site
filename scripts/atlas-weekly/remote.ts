import { createClient } from "@supabase/supabase-js";
import type { QueueInsert, QueueWrite, WeeklyState } from "./types";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function note(label: string, urls: readonly string[]): string {
  return [`QA ${label}`, ...urls].join("\n");
}

export function supabaseQueue(): QueueWrite | null {
  const supabase = client();
  if (!supabase) return null;
  return {
    async insert(item: QueueInsert) {
      if (item.draft.status !== "READY_FOR_REVIEW") throw new Error("Refused a weekly item that is not ready for review.");
      if (item.kind === "blog") {
        const { error } = await supabase.from("articles").insert({
          slug: item.draft.slug,
          title: item.draft.title,
          summary: item.draft.summary,
          body: item.draft.body,
          category: item.draft.category,
          source_urls: item.draft.sourceUrls,
          related_blueprints: item.draft.relatedBlueprints,
          status: "READY_FOR_REVIEW",
          published_at: null,
          featured: false,
          seo_title: item.draft.seoTitle,
          seo_description: item.draft.seoDescription,
          review_note: note("PASS", item.draft.sourceUrls),
        });
        if (!error) return "inserted";
        if (error.code === "23505") return "duplicate";
        throw new Error("Article review insert failed.");
      }
      if (item.kind === "newsletter") {
        const { error } = await supabase.from("newsletter_issues").insert({
          slug: item.draft.slug,
          title: item.draft.title,
          summary: item.draft.summary,
          body: item.draft.body,
          status: "READY_FOR_REVIEW",
          sent_at: null,
          review_note: note("PASS", item.draft.sourceUrls),
        });
        if (!error) return "inserted";
        if (error.code === "23505") return "duplicate";
        throw new Error("Newsletter review insert failed.");
      }
      const { data, error } = await supabase
        .from("review_items")
        .select("id")
        .eq("item_type", "BLUEPRINT")
        .eq("title", item.draft.title)
        .limit(1);
      if (error) throw new Error("Blueprint review lookup failed.");
      if (data && data.length > 0) return "duplicate";
      const inserted = await supabase.from("review_items").insert({
        item_type: "BLUEPRINT",
        title: item.draft.title,
        summary: item.draft.summary,
        status: "READY_FOR_REVIEW",
        qa_note: note("PASS", item.draft.sourceUrls),
        preview_path: null,
        related_slug: item.draft.relatedSlug,
        source: "atlas",
      });
      if (!inserted.error) return "inserted";
      throw new Error("Blueprint review insert failed.");
    },
  };
}

export async function rememberRun(state: WeeklyState): Promise<void> {
  const supabase = client();
  if (!supabase) return;
  const { error } = await supabase.from("atlas_weekly_runs").upsert({
    run_id: state.runId,
    week_key: state.weekKey,
    stage: state.stage,
    status: state.status,
    started_at: state.startedAt,
    finished_at: state.finishedAt,
    counts: state.counts,
    errors: state.errors,
    state,
  }, { onConflict: "week_key" });
  if (error) throw new Error("Weekly run history was not saved.");
}

export async function knownQueueKeys(options?: {
  /** When true, REJECTED rows do not block a fresh edition from reusing sources. */
  ignoreRejected?: boolean;
}): Promise<{ urls: string[]; titles: string[] }> {
  const supabase = client();
  if (!supabase) return { urls: [], titles: [] };
  const ignoreRejected = options?.ignoreRejected === true;
  const [articles, issues, reviews] = await Promise.all([
    supabase.from("articles").select("source_urls, title, status").limit(500),
    supabase.from("newsletter_issues").select("title, review_note, status").limit(200),
    supabase.from("review_items").select("title, status").eq("item_type", "BLUEPRINT").limit(200),
  ]);
  const urls: string[] = [];
  const titles: string[] = [];
  for (const row of articles.data ?? []) {
    const record = row as { source_urls?: unknown; title?: unknown; status?: unknown };
    if (ignoreRejected && record.status === "REJECTED") continue;
    if (Array.isArray(record.source_urls)) {
      for (const url of record.source_urls) if (typeof url === "string") urls.push(url);
    }
    if (typeof record.title === "string") titles.push(record.title);
  }
  for (const row of issues.data ?? []) {
    const record = row as { title?: unknown; status?: unknown };
    if (ignoreRejected && record.status === "REJECTED") continue;
    if (typeof record.title === "string") titles.push(record.title);
  }
  for (const row of reviews.data ?? []) {
    const record = row as { title?: unknown; status?: unknown };
    if (ignoreRejected && record.status === "REJECTED") continue;
    if (typeof record.title === "string") titles.push(record.title);
  }
  return { urls, titles };
}
