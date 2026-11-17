import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { reviewItems } from "./qa";
import { advance, createRun, queuePlan, runUntilSettled } from "./pipeline";
import { canonicalUrl, dedupeSources, selectTopics } from "./research";
import type { BlogDraft, QueueInsert, SourceRecord, WeeklyState } from "./types";

const NOW = new Date("2026-11-16T00:00:00.000Z");
const PRODUCTS = [{ slug: "ai-customer-response-assistant", name: "On-brand Reply Review Queue" }];

function source(patch: Partial<SourceRecord> = {}): SourceRecord {
  const url = patch.canonicalUrl ?? patch.url ?? "https://example.com/openai-support-agent";
  return {
    url,
    canonicalUrl: url,
    title: "OpenAI agent update for support teams",
    publisher: "OpenAI",
    publishedAt: "2026-11-14T00:00:00.000Z",
    retrievedAt: NOW.toISOString(),
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
    relevance: 48,
    implication: "既存のプロンプトや確認手順を変える必要があるかを見る材料になります。",
    ...patch,
  };
}

function deps(fetchSources: () => Promise<SourceRecord[]>, inserts: QueueInsert[] = []) {
  return {
    now: NOW,
    products: PRODUCTS,
    knownUrls: [] as string[],
    knownTitles: [] as string[],
    fetchSources,
    queue: {
      async insert(item: QueueInsert) {
        inserts.push(item);
        return "inserted" as const;
      },
    },
  };
}

test("duplicate sources collapse to one topic", () => {
  assert.equal(canonicalUrl("https://Example.com/a/?utm_source=x"), "https://example.com/a");
  const selected = selectTopics([
    source({ relevance: 20, summary: "OpenAI described an agent update that helps support teams review replies before anything is sent." }),
    source({ relevance: 80, title: "OpenAI agent update for support teams today" }),
    source({
      url: "https://example.com/other-gemini",
      canonicalUrl: "https://example.com/other-gemini",
      publisher: "Google",
      summary: "Google published Gemini release notes for developers who review model changes before updating a workflow.",
      relevance: 30,
    }),
  ]);
  assert.equal(selected.length, 2);
  assert.equal(selected[0]?.relevance, 80);
  assert.equal(dedupeSources([source({ relevance: 10 }), source({ relevance: 40 })]).length, 1);
});

test("QA drops stale, duplicate, unsupported, and unknown blueprint links", () => {
  const fresh = source();
  const stale = source({
    url: "https://example.com/old",
    canonicalUrl: "https://example.com/old",
    publishedAt: "2026-10-01T00:00:00.000Z",
    title: "Old OpenAI note for support teams",
  });
  const blogs: BlogDraft[] = [fresh, stale].map((item, index) => ({
    slug: `post-${index}`,
    title: item.title,
    summary: item.summary,
    body: index === 0 ? `${item.summary}\n\n50% faster` : item.summary,
    sourceUrls: [item.canonicalUrl],
    category: "ai-news",
    relatedBlueprints: index === 0 ? ["missing-blueprint"] : [],
    seoTitle: item.title,
    seoDescription: item.summary,
    status: "READY_FOR_REVIEW",
    canonicalUrl: item.canonicalUrl,
  }));
  const decisions = reviewItems({
    now: NOW,
    sources: [fresh, stale],
    blogs,
    newsletter: null,
    blueprints: [],
    knownUrls: [],
    knownSlugs: ["ai-customer-response-assistant"],
    knownTitles: [],
  });
  assert.equal(decisions.every((item) => item.pass), false);
  assert.match(decisions[0]?.reasons.join(" ") ?? "", /unsupported claim/);
  assert.match(decisions[0]?.reasons.join(" ") ?? "", /unknown blueprint/);
  assert.match(decisions[1]?.reasons.join(" ") ?? "", /stale/);

  const duplicate = reviewItems({
    now: NOW,
    sources: [fresh],
    blogs: [{ ...blogs[0]!, body: fresh.summary, relatedBlueprints: [] }],
    newsletter: null,
    blueprints: [],
    knownUrls: [fresh.canonicalUrl],
    knownSlugs: [],
    knownTitles: [],
  });
  assert.match(duplicate[0]?.reasons.join(" ") ?? "", /duplicate source/);
});

test("only QA pass items are inserted, and a second pass does not duplicate them", async () => {
  const inserts: QueueInsert[] = [];
  const seen = new Set<string>();
  let state = createRun(NOW, "weekly-test");
  const queue = {
    async insert(item: QueueInsert) {
      assert.equal(item.draft.status, "READY_FOR_REVIEW");
      const slug = item.draft.slug;
      if (seen.has(slug)) return "duplicate" as const;
      seen.add(slug);
      inserts.push(item);
      return "inserted" as const;
    },
  };
  state = await runUntilSettled(state, { ...deps(async () => [source()]), queue });
  assert.equal(state.status, "succeeded");
  assert.equal(state.stage, "DONE");
  assert.equal(inserts.length > 0, true);
  assert.equal(inserts.some((item) => item.kind === "blog"), true);
  assert.equal(inserts.some((item) => item.kind === "newsletter"), true);
  assert.equal(queuePlan(state).every((item) => state.qa.some((decision) => decision.pass && decision.slug === item.draft.slug)), true);
  const queued = inserts.length;
  const again = await runUntilSettled(state, { ...deps(async () => [source()]), queue });
  assert.equal(again.status, "succeeded");
  assert.equal(inserts.length, queued);

  again.stage = "REVIEW_QUEUE";
  again.status = "running";
  again.completed = again.completed.filter((stage) => stage !== "REVIEW_QUEUE");
  const resumed = await advance(again, { ...deps(async () => [source()]), queue });
  assert.equal(inserts.length, queued);
  assert.equal(resumed.counts.duplicates > 0, true);
});

test("a failed research stage resumes without repeating a finished fetch", async () => {
  let calls = 0;
  const fetchSources = async () => {
    calls += 1;
    if (calls === 1) throw new Error("feed down");
    return [source()];
  };
  const inserts: QueueInsert[] = [];
  let state = await advance(createRun(NOW, "weekly-resume"), deps(fetchSources, inserts));
  assert.equal(state.status, "failed");
  assert.equal(state.stage, "RESEARCH");
  state = await runUntilSettled(state, deps(fetchSources, inserts));
  assert.equal(calls, 2);
  assert.equal(state.stage, "DONE");
  assert.equal(state.completed.includes("RESEARCH"), true);
  assert.equal(state.completed.filter((stage) => stage === "RESEARCH").length, 1);
});

test("weekly command does not publish, send, deploy, or create Stripe objects", () => {
  const files = ["index.ts", "pipeline.ts", "remote.ts", "drafts.ts", "qa.ts"].map((file) => readFileSync(`scripts/atlas-weekly/${file}`, "utf8")).join("\n");
  assert.doesNotMatch(files, /checkout\.sessions\.create|stripe\.products|vercel deploy|git push|published_at:\s*now|status:\s*"PUBLISHED"|status:\s*"SENT"/);
  assert.match(files, /READY_FOR_REVIEW/);
});
