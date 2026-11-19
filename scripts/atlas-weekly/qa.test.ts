import assert from "node:assert/strict";
import test from "node:test";
import { blogDraft } from "./drafts";
import { overlappingBlogTopics, reviewItems } from "./qa";
import type { BlogDraft, SourceRecord } from "./types";

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

function decide(blogs: BlogDraft[], sources: SourceRecord[]) {
  return reviewItems({
    now: NOW,
    sources,
    blogs,
    newsletter: null,
    blueprints: [],
    knownUrls: [],
    knownSlugs: PRODUCTS.map((product) => product.slug),
    knownTitles: [],
  });
}

test("exact duplicate titles keep only the stronger blog", () => {
  const weak = source({
    url: "https://example.com/weak-agent",
    canonicalUrl: "https://example.com/weak-agent",
    publisher: "The Verge",
    title: "A long-running agent workflow note",
    summary: "The Verge covered a long-running agent workflow that lets software keep working for hours before a person reviews the result.",
    relevance: 20,
  });
  const strong = source({
    url: "https://example.com/strong-agent",
    canonicalUrl: "https://example.com/strong-agent",
    publisher: "OpenAI",
    title: "OpenAI long-running agent for multi-hour workflows",
    summary: "OpenAI described a long-running agent workflow that prepares research for hours before a person reviews the handoff.",
    relevance: 90,
  });
  const blogs = [blogDraft(weak, "2026-W47", PRODUCTS), blogDraft(strong, "2026-W47", PRODUCTS)];
  assert.equal(blogs[0]?.title, blogs[1]?.title);
  const decisions = decide(blogs, [weak, strong]);
  const passed = decisions.filter((item) => item.kind === "blog" && item.pass);
  const rejected = decisions.filter((item) => item.kind === "blog" && !item.pass);
  assert.equal(passed.length, 1);
  assert.equal(passed[0]?.slug, blogs[1]?.slug);
  assert.match(rejected[0]?.reasons.join(" ") ?? "", /duplicate topic/);
});

test("near-duplicate titles keep only one blog", () => {
  const firstSource = source({
    url: "https://example.com/a",
    canonicalUrl: "https://example.com/a",
    publisher: "OpenAI",
    title: "OpenAI agent update for support teams",
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
    relevance: 70,
  });
  const first = blogDraft(firstSource, "2026-W47", PRODUCTS);
  const secondSource = source({
    url: "https://example.com/b",
    canonicalUrl: "https://example.com/b",
    publisher: "Microsoft",
    title: "Microsoft notes customer reply review with AI drafts",
    summary: "Microsoft described a support workflow that helps teams review AI reply drafts before anything is sent to a customer.",
    relevance: 40,
  });
  const drafted = blogDraft(secondSource, "2026-W47", PRODUCTS);
  const second: BlogDraft = {
    ...drafted,
    title: `${first.title}：現場での確認`,
  };
  assert.equal(overlappingBlogTopics(first, second), true);
  const decisions = decide([first, second], [firstSource, secondSource]);
  assert.equal(decisions.filter((item) => item.kind === "blog" && item.pass).length, 1);
  assert.match(
    decisions.find((item) => item.kind === "blog" && !item.pass)?.reasons.join(" ") ?? "",
    /duplicate topic/,
  );
});

test("different titles with the same thesis keep only one blog", () => {
  const primary = blogDraft(
    source({
      url: "https://example.com/primary",
      canonicalUrl: "https://example.com/primary",
      publisher: "OpenAI",
      relevance: 80,
    }),
    "2026-W47",
    PRODUCTS,
  );
  const clone: BlogDraft = {
    ...primary,
    slug: "weekly-same-thesis",
    title: "確認の置き場所が長時間作業で変わっている",
    canonicalUrl: "https://example.com/clone",
    sourceUrls: ["https://example.com/clone"],
  };
  const cloneSource = source({
    url: "https://example.com/clone",
    canonicalUrl: "https://example.com/clone",
    publisher: "Google",
    title: "Google long-running agent research note",
    summary: "Google described a long-running agent that continues research for hours before a reviewer checks the draft.",
    relevance: 35,
  });
  assert.equal(primary.title === clone.title, false);
  assert.equal(overlappingBlogTopics(primary, clone), true);
  const decisions = decide([primary, clone], [source({ url: "https://example.com/primary", canonicalUrl: "https://example.com/primary", relevance: 80 }), cloneSource]);
  assert.equal(decisions.filter((item) => item.kind === "blog" && item.pass).length, 1);
});

test("the same editorial topic from different publishers keeps only one blog", () => {
  const openai = source({
    url: "https://openai.com/agent-hours",
    canonicalUrl: "https://openai.com/agent-hours",
    publisher: "OpenAI",
    title: "OpenAI long-running agents for multi-hour work",
    summary: "OpenAI described long-running agents that can continue a workflow for hours before a person reviews the output.",
    relevance: 88,
  });
  const google = source({
    url: "https://blog.google/agent-hours",
    canonicalUrl: "https://blog.google/agent-hours",
    publisher: "Google",
    title: "Google agent research for long-running workflows",
    summary: "Google described an agent workflow that can keep working for hours before a reviewer checks the prepared result.",
    relevance: 55,
  });
  const blogs = [blogDraft(openai, "2026-W47", PRODUCTS), blogDraft(google, "2026-W47", PRODUCTS)];
  assert.equal(blogs[0]?.title, blogs[1]?.title);
  assert.equal(overlappingBlogTopics(blogs[0]!, blogs[1]!), true);
  const decisions = decide(blogs, [openai, google]);
  const passed = decisions.filter((item) => item.kind === "blog" && item.pass);
  assert.equal(passed.length, 1);
  assert.equal(passed[0]?.slug, blogs[0]?.slug);
});

test("clearly distinct work implications can both survive", () => {
  const support = source({
    url: "https://example.com/support",
    canonicalUrl: "https://example.com/support",
    publisher: "OpenAI",
    title: "OpenAI agent update for support teams",
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
    relevance: 70,
  });
  const enterprise = source({
    url: "https://example.com/enterprise",
    canonicalUrl: "https://example.com/enterprise",
    publisher: "Microsoft",
    title: "Microsoft enterprise governance for AI operating models",
    summary: "Microsoft described an enterprise operating model and governance process for managers who review AI workflow drafts.",
    relevance: 65,
  });
  const blogs = [blogDraft(support, "2026-W47", PRODUCTS), blogDraft(enterprise, "2026-W47", PRODUCTS)];
  assert.notEqual(blogs[0]?.title, blogs[1]?.title);
  assert.equal(overlappingBlogTopics(blogs[0]!, blogs[1]!), false);
  const decisions = decide(blogs, [support, enterprise]);
  assert.deepEqual(
    decisions.filter((item) => item.kind === "blog").map((item) => item.pass),
    [true, true],
  );
});
