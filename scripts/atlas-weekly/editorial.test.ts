import assert from "node:assert/strict";
import test from "node:test";
import { blogDraft, blueprintCandidates, newsletterDraft } from "./drafts";
import {
  describeSource,
  editorialArticle,
  editorialFailures,
  isLowValueNews,
  paraphrasesSource,
  titleRepeatsSource,
} from "./editorial";
import { reviewItems } from "./qa";
import { selectTopics } from "./research";
import type { BlogDraft, SourceRecord } from "./types";

const NOW = new Date("2026-11-16T00:00:00.000Z");
const PRODUCTS = [{ slug: "ai-customer-response-assistant", name: "On-brand Reply Review Queue" }];

function source(patch: Partial<SourceRecord> = {}): SourceRecord {
  const url = patch.canonicalUrl ?? patch.url ?? "https://example.com/story";
  return {
    url,
    canonicalUrl: url,
    title: "OpenAI agent update for support teams",
    publisher: "OpenAI",
    publishedAt: "2026-11-14T00:00:00.000Z",
    retrievedAt: NOW.toISOString(),
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
    relevance: 50,
    implication: "既存の確認手順を見る材料になります。",
    ...patch,
  };
}

test("one publisher cannot fill the weekly blog queue when other sources exist", () => {
  const vercel = (title: string, index: number) => source({
    url: `https://vercel.com/changelog/${index}`,
    canonicalUrl: `https://vercel.com/changelog/${index}`,
    publisher: "Vercel",
    title,
    summary: `${title}. The changelog says the model is now available on AI Gateway for a short-term promotion.`,
    relevance: 90 - index,
  });
  const selected = selectTopics([
    vercel("Qwen4-Max now available on AI Gateway", 1),
    vercel("Hy4 Flash now available on AI Gateway for 50% off", 2),
    vercel("Another model now available on AI Gateway", 3),
    source({
      url: "https://openai.com/news/agents",
      canonicalUrl: "https://openai.com/news/agents",
      publisher: "OpenAI",
      title: "OpenAI agent update for support teams",
      summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
      relevance: 40,
    }),
    source({
      url: "https://www.theverge.com/ai-work",
      canonicalUrl: "https://www.theverge.com/ai-work",
      publisher: "The Verge",
      title: "San Francisco startups debate AI policy for customer work",
      summary: "The Verge reported how San Francisco startups are changing customer support review before replies are sent.",
      relevance: 36,
    }),
    source({
      url: "https://blogs.microsoft.com/work",
      canonicalUrl: "https://blogs.microsoft.com/work",
      publisher: "Microsoft",
      title: "Microsoft describes enterprise governance for AI workflows",
      summary: "Microsoft described an operating model for managers who review AI-produced workflow drafts before they are used.",
      relevance: 34,
    }),
  ]);
  assert.equal(selected.some((item) => item.publisher === "Vercel"), false);
  assert.equal(new Set(selected.map((item) => item.publisher)).size >= 3, true);
  assert.equal(selected.filter((item) => item.publisher === "OpenAI").length <= 1, true);
});

test("research selection spreads candidates across source groups before ranking one feed", () => {
  const selected = selectTopics([
    source({ publisher: "Vercel", url: "https://vercel.com/a", canonicalUrl: "https://vercel.com/a", title: "Cursor and Vercel agent workflow for developers", summary: "A developer workflow now lets an agent prepare a long-running code review before a person approves it.", relevance: 99 }),
    source({ publisher: "OpenAI", url: "https://openai.com/a", canonicalUrl: "https://openai.com/a", title: "OpenAI agent update for support teams", summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.", relevance: 20 }),
    source({ publisher: "Microsoft", url: "https://microsoft.com/a", canonicalUrl: "https://microsoft.com/a", title: "Enterprise operating model for AI drafts", summary: "Microsoft described governance for an enterprise operating model where managers review workflow drafts.", relevance: 18 }),
    source({ publisher: "NIST", url: "https://nist.gov/a", canonicalUrl: "https://nist.gov/a", title: "NIST publishes AI policy note for organizations", summary: "NIST published a policy note about how organizations should review artificial intelligence systems before deployment.", relevance: 16 }),
  ]);
  const groups = new Set(selected.map((item) => describeSource(item).group));
  assert.equal(groups.has("labs"), true);
  assert.equal(groups.has("enterprise"), true);
  assert.equal(groups.has("official"), true);
  assert.equal(selected.filter((item) => describeSource(item).focus === "ai-news").length <= 2, true);
});

test("changelog announcements are filtered and do not become the article", () => {
  assert.equal(isLowValueNews("Qwen4-Max now available on AI Gateway", "The model is now available."), true);
  assert.equal(isLowValueNews("Hy4 Flash now available on AI Gateway for 50% off", "A pricing promotion."), true);
  const draft = blogDraft(source(), "2026-W46", PRODUCTS);
  assert.equal(draft.title.includes("利用可能"), false);
  assert.equal(draft.title.includes("AI Gateway"), false);
  assert.equal(draft.body.includes("Qwen4-Max"), false);
  assert.equal(draft.body.includes(source().summary.slice(0, 40)), false);
  assert.equal(draft.sourceUrls[0], source().canonicalUrl);
  assert.equal(draft.body.length >= 800 && draft.body.length <= 1800, true);
});

test("a single-source paraphrase or translated headline is rejected", () => {
  const item = source();
  const copied: BlogDraft = {
    slug: "copied",
    title: "Qwen4-MaxがAI Gatewayで利用可能に",
    summary: item.summary,
    body: `${item.summary}\n\n${item.title}`,
    sourceUrls: [item.canonicalUrl],
    category: "ai-news",
    relatedBlueprints: [],
    seoTitle: item.title,
    seoDescription: item.summary,
    status: "READY_FOR_REVIEW",
    canonicalUrl: item.canonicalUrl,
  };
  assert.equal(titleRepeatsSource(copied.title, "Qwen4-Max now available on AI Gateway"), true);
  assert.equal(paraphrasesSource(copied.body, item), true);
  const reasons = editorialFailures(copied, { ...item, title: "Qwen4-Max now available on AI Gateway" });
  assert.equal(reasons.includes("translated source title"), true);
  assert.equal(reasons.includes("source paraphrase"), true);
  assert.equal(reasons.includes("missing editorial thesis"), true);
  assert.equal(reasons.includes("missing practical takeaway"), true);
});

test("editorial drafts need a thesis, work relevance, a takeaway, and real source links", () => {
  const item = source();
  const article = editorialArticle(item);
  assert.match(article.body, /Atlasの見方/);
  assert.match(article.body, /仕事/);
  assert.match(article.body, /明日試すなら/);
  assert.equal(article.sourceUrls.includes(item.canonicalUrl), true);
  assert.equal(editorialFailures({ title: article.title, body: article.body, sourceUrls: [] }, item).includes("missing source url"), true);
  const thin = editorialFailures({
    title: "担当者の仕事は確認だけになる",
    body: "Atlasの見方では、まだ人の確認が必要です。仕事の担当者は手順を見ます。",
    sourceUrls: [item.canonicalUrl],
  }, item);
  assert.equal(thin.includes("missing editorial thesis"), true);
  assert.equal(thin.includes("missing practical takeaway"), true);
});

test("unsupported numbers and a second post from the same publisher are rejected", () => {
  const first = source();
  const second = source({
    url: "https://example.com/second",
    canonicalUrl: "https://example.com/second",
    title: "Another OpenAI note about customer replies",
  });
  const good = blogDraft(first, "2026-W46", PRODUCTS);
  const secondDraft = blogDraft(second, "2026-W46", PRODUCTS);
  const numbered = { ...secondDraft, slug: "numbered", body: `${secondDraft.body}\n\n50% faster` };
  const decisions = reviewItems({
    now: NOW,
    sources: [first, second],
    blogs: [good, numbered],
    newsletter: null,
    blueprints: [],
    knownUrls: [],
    knownSlugs: PRODUCTS.map((product) => product.slug),
    knownTitles: [],
  });
  assert.equal(decisions[0]?.pass, true);
  assert.match(decisions[1]?.reasons.join(" ") ?? "", /unsupported claim/);
  assert.match(decisions[1]?.reasons.join(" ") ?? "", /publisher concentration/);
});

test("blueprint candidates require a repeatable workflow and stay optional", () => {
  const gateway = source({
    url: "https://vercel.com/gateway",
    canonicalUrl: "https://vercel.com/gateway",
    publisher: "Vercel",
    title: "Qwen4-Max now available on AI Gateway",
    summary: "Qwen4-Max is now available on AI Gateway for developers who want another model endpoint.",
  });
  assert.equal(blueprintCandidates([gateway], PRODUCTS, "2026-W46").length, 0);
  const support = blueprintCandidates([source()], PRODUCTS, "2026-W46");
  assert.equal(support.length, 1);
  assert.match(support[0]?.problem ?? "", /問い合わせ/);
  assert.equal((support[0]?.jaTitle ?? "").includes("利用可能"), false);
  const funding = source({
    url: "https://www.theverge.com/funding",
    canonicalUrl: "https://www.theverge.com/funding",
    publisher: "The Verge",
    title: "San Francisco startup funding shifts AI policy",
    summary: "A San Francisco funding note discusses startup policy and capital for young companies.",
  });
  const article = blogDraft(funding, "2026-W46", PRODUCTS);
  assert.deepEqual(article.relatedBlueprints, []);
  assert.equal(blueprintCandidates([funding], PRODUCTS, "2026-W46").length, 0);
  const letter = newsletterDraft("2026-W46", [article]);
  assert.equal(letter?.body.includes(funding.title), false);
  assert.match(letter?.body ?? "", /明日試すなら|次の一歩/);
});
