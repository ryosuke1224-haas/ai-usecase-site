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
  const remoteState = {
    ...state,
    research: state.research.filter((source) => !source.internal),
    selected: state.selected.filter((source) => !source.internal),
    blogs: state.blogs.filter((draft) => !draft.canonicalUrl.startsWith("atlas-note:")),
    researchReports: Object.fromEntries(Object.entries(state.researchReports ?? {})
      .filter(([url]) => !url.startsWith("atlas-note:"))),
  };
  const { error } = await supabase.from("atlas_weekly_runs").upsert({
    run_id: state.runId,
    week_key: state.weekKey,
    stage: state.stage,
    status: state.status,
    started_at: state.startedAt,
    finished_at: state.finishedAt,
    counts: state.counts,
    errors: state.errors,
    state: remoteState,
  }, { onConflict: "week_key" });
  if (error) throw new Error("Weekly run history was not saved.");
}

type QueueKey = { title: unknown; source_urls?: unknown };

async function queueKeys(
  page: (from: number, to: number) => PromiseLike<{ data: QueueKey[] | null; error: unknown }>,
): Promise<QueueKey[]> {
  const rows: QueueKey[] = [];
  const pageSize = 200;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error || !data) throw new Error("Could not check existing Review Queue items.");
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export async function knownQueueKeys(): Promise<{ urls: string[]; titles: string[] }> {
  const supabase = client();
  if (!supabase) return { urls: [], titles: [] };
  // Include every status, including REJECTED, in duplicate checks for all editions.
  const [articles, issues, reviews] = await Promise.all([
    queueKeys((from, to) => supabase.from("articles").select("source_urls, title").order("id").range(from, to)),
    queueKeys((from, to) => supabase.from("newsletter_issues").select("title").order("id").range(from, to)),
    queueKeys((from, to) => supabase.from("review_items").select("title").eq("item_type", "BLUEPRINT").order("id").range(from, to)),
  ]);
  return {
    urls: articles.flatMap(({ source_urls }) =>
      Array.isArray(source_urls) ? source_urls.filter((url): url is string => typeof url === "string") : []),
    titles: [...articles, ...issues, ...reviews].flatMap(({ title }) => typeof title === "string" ? [title] : []),
  };
}
