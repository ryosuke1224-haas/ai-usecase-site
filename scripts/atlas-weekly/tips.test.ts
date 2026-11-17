import assert from "node:assert/strict";
import test from "node:test";
import { blogDraft } from "./drafts";
import { editorialFailures } from "./editorial";
import { reviewItems } from "./qa";
import { selectEdition, selectTopics } from "./research";
import { TIP_TOPICS, chooseTip } from "./tips";
import type { SourceRecord } from "./types";

const NOW = new Date("2026-11-16T00:00:00.000Z");
const PRODUCTS = [{ slug: "ai-customer-response-assistant", name: "On-brand Reply Review Queue" }];

function source(patch: Partial<SourceRecord> & Pick<SourceRecord, "canonicalUrl" | "publisher" | "summary">): SourceRecord {
  return {
    url: patch.canonicalUrl,
    title: patch.title ?? "Published note",
    publishedAt: "2026-11-14T00:00:00.000Z",
    retrievedAt: NOW.toISOString(),
    relevance: patch.relevance ?? 50,
    implication: "既存の確認手順を変える必要があるかを見る材料になります。",
    ...patch,
  };
}

test("weekly edition keeps at most two news items, one practical article, and one tip", () => {
  const records = [
    source({
      canonicalUrl: "https://blog.google/example-model",
      publisher: "Google",
      title: "Model family update",
      summary: "Google published a model family update for researchers watching frontier systems.",
      relevance: 90,
    }),
    source({
      canonicalUrl: "https://www.theverge.com/example-funding",
      publisher: "The Verge",
      title: "Startup funding note",
      summary: "The Verge reported a funding note about startup policy and capital for young companies.",
      relevance: 80,
    }),
    source({
      canonicalUrl: "https://www.nist.gov/example-policy",
      publisher: "NIST",
      title: "Agency policy note",
      summary: "NIST described a policy update for agencies using automated systems.",
      relevance: 70,
    }),
    source({
      canonicalUrl: "https://blogs.microsoft.com/example-governance",
      publisher: "Microsoft",
      title: "Operating model",
      summary: "Microsoft described an operating model for enterprise governance of AI systems in daily operations.",
      relevance: 95,
    }),
    source({
      canonicalUrl: "https://www.salesforce.com/example-crm",
      publisher: "Salesforce",
      title: "CRM operating note",
      summary: "Salesforce described an operating model for CRM governance inside large companies.",
      relevance: 60,
    }),
  ];
  const selected = selectEdition(records, "2026-W47");
  const news = selected.filter((item) => !item.evergreen && !/operating model|governance/.test(item.summary));
  const practical = selected.filter((item) => /operating model|governance/.test(item.summary));
  const tips = selected.filter((item) => item.evergreen);
  assert.equal(news.length, 2);
  assert.equal(practical.length, 1);
  assert.equal(tips.length, 1);
  assert.equal(tips[0]?.publishedAt, null);
  assert.equal(selected.some((item) => item.canonicalUrl.includes("nist.gov/example")), false);
  assert.equal(selectTopics(records).length >= 3, true);
});

test("a thin news week still keeps the news item and does not invent a practical article", () => {
  const records = [
    source({
      canonicalUrl: "https://www.theverge.com/only-news",
      publisher: "The Verge",
      title: "Capital note",
      summary: "The Verge reported a funding note about startup policy and capital for young companies.",
      relevance: 80,
    }),
  ];
  const selected = selectEdition(records, "2026-W10");
  assert.equal(selected.filter((item) => !item.evergreen).length, 1);
  assert.equal(selected.filter((item) => item.evergreen).length, 1);
  assert.equal(selected[0]?.canonicalUrl, "https://www.theverge.com/only-news");
});

test("an already queued tip rotates to the next documentation topic", () => {
  const first = chooseTip("2026-W08", []);
  assert.ok(first);
  const next = chooseTip("2026-W08", [first.sourceUrls[0]]);
  assert.ok(next);
  assert.notEqual(next.id, first.id);
  assert.equal(chooseTip("2026-W08", TIP_TOPICS.map((topic) => topic.sourceUrls[0])), null);
});

test("every tip is specific, sourced, and free of invented figures", () => {
  for (const topic of TIP_TOPICS) {
    assert.ok(topic.body.length >= 800, topic.id);
    assert.ok(topic.body.length <= 1800, topic.id);
    assert.match(topic.body, /明日試すなら\n\n.{20,}/s);
    assert.match(topic.body, /Atlasの見方/);
    assert.match(topic.body, /仕事|営業|サポート|担当|管理|経理/);
    assert.equal(topic.sourceUrls.every((url) => url.startsWith("https://")), true);
    assert.equal(/(\d+(?:\.\d+)?\s?(?:%|％|\$|usd|jpy|円))|私は試した|私が使った|自分で検証した/.test(topic.body), false);
    const record = selectEdition([], "2026-W01", TIP_TOPICS.filter((item) => item.id !== topic.id).map((item) => item.sourceUrls[0]))
      .find((item) => item.evergreen);
    assert.equal(record?.canonicalUrl, topic.sourceUrls[0]);
    const draft = blogDraft(record!, "2026-W01", PRODUCTS);
    assert.deepEqual(editorialFailures(draft, record!), []);
    assert.equal(draft.status, "READY_FOR_REVIEW");
    if (topic.workflow) assert.deepEqual(draft.relatedBlueprints, [topic.workflow]);
    else assert.deepEqual(draft.relatedBlueprints, []);
  }
});

test("a tip does not need a breaking-news date and can sit beside a news draft", () => {
  const tip = selectEdition([], "2026-W03").find((item) => item.evergreen);
  assert.ok(tip);
  const news = source({
    canonicalUrl: "https://openai.com/news/example",
    publisher: "OpenAI",
    title: "Model family update",
    summary: "OpenAI published a model family update for researchers watching frontier systems.",
  });
  const blogs = [blogDraft(news, "2026-W03", PRODUCTS), blogDraft(tip, "2026-W03", PRODUCTS)];
  const decisions = reviewItems({
    now: NOW,
    sources: [news, tip],
    blogs,
    newsletter: null,
    blueprints: [],
    knownUrls: [],
    knownSlugs: PRODUCTS.map((product) => product.slug),
    knownTitles: [],
  });
  assert.deepEqual(decisions.filter((item) => item.kind === "blog").map((item) => item.pass), [true, true]);
});
