import { blueprintCandidates, newsletterDraft, type KnownProduct } from "./drafts";
import { fieldNoteSources } from "./editorial-brief";
import { blogTopicStrength, reviewItems } from "./qa";
import { editorialPool, selectEdition } from "./research";
import { researchPackage, saveResearchPackage } from "./research-package";
import { writeArticle, type Writer } from "./writer";
import {
  WEEKLY_STAGES,
  emptyCounts,
  type BlogDraft,
  type QaDecision,
  type QueueInsert,
  type QueueWrite,
  type ResearchReport,
  type SourceRecord,
  type WeeklyStage,
  type WeeklyState,
} from "./types";

export type { KnownProduct };

export type WeeklyDeps = {
  root: string;
  writer?: Writer;
  writeArticle?: typeof writeArticle;
  now: Date;
  products: readonly KnownProduct[];
  knownUrls: readonly string[];
  knownTitles: readonly string[];
  fetchSources?: () => Promise<WeeklyState["research"]>;
  planTopics?: (pool: readonly SourceRecord[]) => Promise<SourceRecord[]>;
  enrichTopic?: (primary: SourceRecord) => Promise<ResearchReport>;
  queue?: QueueWrite;
  dryRun?: boolean;
};

export function weekKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function createRun(now: Date, runId: string, weekKeyOverride?: string): WeeklyState {
  const stamp = now.toISOString();
  return {
    writerVersion: 1,
    runId,
    weekKey: weekKeyOverride ?? weekKey(now),
    stage: "RESEARCH",
    status: "running",
    startedAt: stamp,
    finishedAt: null,
    updatedAt: stamp,
    counts: emptyCounts(),
    errors: [],
    completed: [],
    research: [],
    selected: [],
    blogs: [],
    newsletter: null,
    blueprints: [],
    qa: [],
    queued: [],
  };
}

/** Strip a rerun suffix so tip rotation still follows the ISO week. */
export function baseWeekKey(value: string): string {
  return value.replace(/-r\d+$/i, "");
}

/** Next explicit edition key for the same ISO week, e.g. 2026-W47 → 2026-W47-r2. */
export function nextRerunWeekKey(existingKeys: readonly string[], base: string): string {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}(?:-r(\\d+))?$`, "i");
  let highest = 0;
  for (const key of existingKeys) {
    const match = pattern.exec(key);
    if (!match) continue;
    highest = Math.max(highest, match[1] ? Number(match[1]) : 1);
  }
  return `${base}-r${highest + 1}`;
}

function nextStage(stage: WeeklyStage): WeeklyStage | "DONE" {
  const index = WEEKLY_STAGES.indexOf(stage);
  return WEEKLY_STAGES[index + 1] ?? "DONE";
}

function fail(state: WeeklyState, now: Date, message: string): WeeklyState {
  return {
    ...state,
    status: "failed",
    errors: [...state.errors, message].slice(-20),
    updatedAt: now.toISOString(),
  };
}

function finishStage(state: WeeklyState, stage: WeeklyStage, now: Date, patch: Partial<WeeklyState>): WeeklyState {
  const completed = state.completed.includes(stage) ? state.completed : [...state.completed, stage];
  const upcoming = nextStage(stage);
  return {
    ...state,
    ...patch,
    completed,
    stage: upcoming,
    status: upcoming === "DONE" ? "succeeded" : "running",
    finishedAt: upcoming === "DONE" ? now.toISOString() : null,
    updatedAt: now.toISOString(),
  };
}

export function queuePlan(state: WeeklyState): QueueInsert[] {
  const passing = new Set(state.qa.filter((item) => item.pass).map((item) => `${item.kind}:${item.slug}`));
  const items: QueueInsert[] = [];
  for (const draft of state.blogs) {
    if (!draft.internal && passing.has(`blog:${draft.slug}`)) items.push({ kind: "blog", draft });
  }
  if (state.newsletter && passing.has(`newsletter:${state.newsletter.slug}`)) {
    items.push({ kind: "newsletter", draft: state.newsletter });
  }
  for (const draft of state.blueprints) {
    if (passing.has(`blueprint:${draft.slug}`)) items.push({ kind: "blueprint", draft });
  }
  return items;
}

export async function advance(state: WeeklyState, deps: WeeklyDeps): Promise<WeeklyState> {
  if (state.status === "succeeded" && state.stage === "DONE") return state;
  const now = deps.now;
  const active = state.status === "running" ? state : { ...state, status: "running" as const };
  const stage = active.stage === "DONE" ? "REVIEW_QUEUE" : active.stage;
  try {
    if (stage === "RESEARCH") {
      if (!deps.fetchSources) return fail(active, now, "Research fetcher is not configured.");
      const research = await deps.fetchSources();
      if (research.length === 0 && !deps.planTopics && !fieldNoteSources(deps.root, now.toISOString(), deps.dryRun).length) {
        return fail(active, now, "No sources were retrieved.");
      }
      return finishStage(active, stage, now, {
        research,
        counts: { ...active.counts, researched: research.length },
      });
    }
    if (stage === "SELECT") {
      const notes = fieldNoteSources(deps.root, now.toISOString(), deps.dryRun);
      const selected = deps.planTopics
        ? await deps.planTopics(editorialPool(active.research, notes, deps.knownUrls, now.toISOString()))
        : [...selectEdition(active.research, active.weekKey, deps.knownUrls, now.toISOString()), ...notes.slice(0, 2)];
      const research = [...new Map([...active.research, ...selected].map((item) => [item.canonicalUrl, item])).values()];
      return finishStage(active, stage, now, {
        selected,
        research,
        counts: { ...active.counts, selected: selected.length },
      });
    }
    if (stage === "RESEARCH_PACKAGE" || stage === "BLOG_DRAFT") {
      const reports = { ...active.researchReports };
      if (stage === "RESEARCH_PACKAGE" && deps.enrichTopic) {
        for (const primary of active.selected) {
          reports[primary.canonicalUrl] ??= await deps.enrichTopic(primary);
        }
      }
      const packages = active.selected.map((primary) => researchPackage({
        root: deps.root,
        edition: active.weekKey,
        primary,
        research: [...(reports[primary.canonicalUrl]?.sources ?? []), ...active.research],
        report: reports[primary.canonicalUrl],
        products: deps.products,
      }));
      if (stage === "RESEARCH_PACKAGE") {
        for (const pkg of packages) saveResearchPackage(pkg);
        return finishStage(active, stage, now, { researchReports: reports });
      }

      const blogs: BlogDraft[] = [];
      const pendingDrafts: string[] = [];
      const writerRejections: QaDecision[] = [];
      const write = deps.writeArticle ?? writeArticle;
      for (const { candidate, brief } of packages) {
        if (brief.editorial.rejection) {
          writerRejections.push({ kind: "blog", slug: candidate.id, pass: false, reasons: [brief.editorial.rejection] });
          continue;
        }
        const outcome = await write({ writer: deps.writer ?? "none", candidate });
        if (outcome.status === "failed") return fail(active, now, `${candidate.id}: ${outcome.reason}`);
        if (outcome.status === "pending") pendingDrafts.push(candidate.id);
        if (outcome.status === "draft") blogs.push(outcome.draft);
        if (outcome.status === "rejected") {
          writerRejections.push({ kind: "blog", slug: candidate.id, pass: false, reasons: [outcome.reason] });
        }
      }
      if (pendingDrafts.length > 0) return { ...active, pendingDrafts, updatedAt: now.toISOString() };
      return finishStage(active, stage, now, {
        pendingDrafts,
        writerRejections,
        blogs,
        counts: { ...active.counts, blogs: blogs.length },
      });
    }
    if (stage === "NEWSLETTER_DRAFT") {
      // Retain this checkpoint for saved editions. Draft the digest after article QA.
      return finishStage(active, stage, now, {});
    }
    if (stage === "BLUEPRINT_CANDIDATES") {
      const blueprints = blueprintCandidates(active.selected.filter((source) => !source.internal), deps.products, active.weekKey);
      return finishStage(active, stage, now, {
        blueprints,
        counts: { ...active.counts, blueprints: blueprints.length },
      });
    }
    if (stage === "QA") {
      const qaWithoutLetter = reviewItems({
        now,
        sources: [...active.research, ...Object.values(active.researchReports ?? {}).flatMap((report) => report.sources)],
        blogs: active.blogs,
        newsletter: null,
        blueprints: active.blueprints,
        knownUrls: deps.knownUrls,
        knownSlugs: deps.products.map((product) => product.slug),
        knownTitles: deps.knownTitles,
      });
      const passingBlogs = active.blogs.filter((blog) =>
        !blog.internal && qaWithoutLetter.some((item) => item.kind === "blog" && item.slug === blog.slug && item.pass),
      );
      const byUrl = new Map(active.research.map((source) => [source.canonicalUrl, source]));
      passingBlogs.sort((left, right) => blogTopicStrength(right, byUrl.get(right.canonicalUrl))
        - blogTopicStrength(left, byUrl.get(left.canonicalUrl)));
      const newsletter = newsletterDraft(active.weekKey, passingBlogs);
      const passingUrls = new Set(passingBlogs.flatMap((blog) => blog.sourceUrls));
      const qa = [...(active.writerRejections ?? []), ...qaWithoutLetter];
      if (newsletter) {
        const reasons: string[] = [];
        if (newsletter.sourceUrls.some((url) => !passingUrls.has(url))) reasons.push("newsletter cites evidence outside passing articles");
        qa.push({ kind: "newsletter", slug: newsletter.slug, pass: reasons.length === 0, reasons });
      }
      return finishStage(active, stage, now, {
        newsletter,
        qa,
        counts: {
          ...active.counts,
          newsletter: newsletter ? 1 : 0,
          qaPassed: qa.filter((item) => item.pass).length,
          qaRejected: qa.filter((item) => !item.pass).length,
        },
      });
    }
    const plan = queuePlan(active);
    if (deps.dryRun) return finishStage(active, "REVIEW_QUEUE", now, {});
    if (!deps.queue) return fail(active, now, "Review Queue storage is not configured.");
    const queued = [...active.queued];
    let inserted = 0;
    let duplicates = 0;
    for (const item of plan) {
      const slug = item.draft.slug;
      if (item.draft.status !== "READY_FOR_REVIEW") throw new Error("Weekly queue refused a status other than review.");
      if (queued.includes(slug)) {
        duplicates += 1;
        continue;
      }
      const result = await deps.queue.insert(item);
      queued.push(slug);
      if (result === "duplicate") duplicates += 1;
      else inserted += 1;
    }
    return finishStage(active, "REVIEW_QUEUE", now, {
      queued,
      counts: {
        ...active.counts,
        queued: active.counts.queued + inserted,
        duplicates: active.counts.duplicates + duplicates,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly stage failed";
    return fail(active, now, message);
  }
}

export async function runUntilSettled(state: WeeklyState, deps: WeeklyDeps): Promise<WeeklyState> {
  let current = state;
  for (let guard = 0; guard < WEEKLY_STAGES.length + 1; guard += 1) {
    if (current.status === "succeeded" && current.stage === "DONE") return current;
    if (current.status !== "running") current = { ...current, status: "running" };
    current = await advance(current, deps);
    if (current.status === "failed" || current.pendingDrafts?.length) return current;
    if (current.status === "succeeded" && current.stage === "DONE") return current;
  }
  return current;
}
