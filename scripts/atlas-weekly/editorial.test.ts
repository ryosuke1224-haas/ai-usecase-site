import assert from "node:assert/strict";
import test from "node:test";
import { blogDraft, blueprintCandidates, newsletterDraft } from "./drafts";
import {
  describeSource,
  editorialArticle,
  editorialFailures,
  hasConcreteWorkflow,
  hasDecisionFramework,
  hasDeepWorkflow,
  hasExcessiveFrameworkFormatting,
  hasFabricatedFirstPerson,
  hasGenericAtlasConclusion,
  hasGenericTakeaway,
  hasMetaEditorialLanguage,
  hasMismatchedTaskSynthesis,
  hasSourceSpecificFacts,
  isLowValueNews,
  paraphrasesSource,
  synthesizeSupportBridge,
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
  // Length is secondary; a substantive shorter article may pass.
  assert.ok(draft.body.length >= 500, `body too short: ${draft.body.length}`);
  assert.ok(draft.body.length <= 2800, `body too long: ${draft.body.length}`);
  assert.equal(hasMetaEditorialLanguage(draft.body), false);
  assert.equal(hasSourceSpecificFacts(draft.body, source()), true);
  assert.equal(hasDeepWorkflow(draft.body), true);
  assert.equal(hasConcreteWorkflow(draft.body), true);
  assert.equal(hasDecisionFramework(draft.body), true);
  assert.equal(hasGenericTakeaway(draft.body), false);
  assert.match(draft.body, /OpenAI/);
  assert.match(draft.body, /## 出典/);
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

const citationSource = source({
  title: "Amazon Bedrock expands enterprise governance",
  summary: "Customers can configure permissions for automated deployments and centralize operational monitoring.",
  canonicalUrl: "https://aws.amazon.com/bedrock/enterprise-governance-customers-configure-permissions-automated-deployments-centralize-operational-monitoring",
});

test("a long source citation URL alone does not count as paraphrasing", () => {
  for (const citation of [citationSource.canonicalUrl, `<${citationSource.canonicalUrl}>`]) {
    assert.equal(paraphrasesSource(`## 仕事で使う\n確認は担当者が行います。\n## 出典\n${citation}`, citationSource), false);
  }
});

test("overlapping prose still counts as paraphrasing even with a citation URL", () => {
  const prose = "With enterprise governance in Bedrock, customers can centralize monitoring and configure permissions before automated deployments.";
  assert.equal(paraphrasesSource(`## 仕事で使う\n${prose}\n${citationSource.canonicalUrl}`, citationSource), true);
});

test("markdown link targets are ignored but link labels and surrounding prose count", () => {
  const destination = `${citationSource.canonicalUrl}(archive)`;
  assert.equal(paraphrasesSource(`[出典](${destination} "Enterprise governance")`, citationSource), false);
  assert.equal(paraphrasesSource(`[出典](</reference/${citationSource.canonicalUrl.split("/").at(-1)}>)`, citationSource), false);
  assert.equal(paraphrasesSource("[Bedrock enterprise governance](/reference) lets customers configure permissions.", citationSource), true);
  assert.equal(paraphrasesSource(`[${citationSource.summary}](${destination})`, citationSource), true);
});

test("editorial drafts need a thesis, work relevance, a takeaway, and real source links", () => {
  const item = source();
  const article = editorialArticle(item);
  assert.match(article.body, /Atlasの見方/);
  assert.match(article.body, /仕事/);
  assert.match(article.body, /明日試すなら/);
  assert.equal(article.sourceUrls.includes(item.canonicalUrl), true);
  assert.doesNotMatch(article.body, /発表の見出しや製品の宣伝文は、この記事の構成にしていません/);
  assert.doesNotMatch(article.body, /Atlasの記事が足すのは/);
  assert.doesNotMatch(article.body, /読者が得るのは、元の発表を短くしたものではなく/);
  assert.equal(editorialFailures({ title: article.title, body: article.body, sourceUrls: [] }, item).includes("missing source url"), true);
  const thin = editorialFailures({
    title: "担当者の仕事は確認だけになる",
    body: "Atlasの見方では、まだ人の確認が必要です。仕事の担当者は手順を見ます。",
    sourceUrls: [item.canonicalUrl],
  }, item);
  assert.equal(thin.includes("missing editorial thesis"), true);
  assert.equal(thin.includes("missing practical takeaway"), true);
});

test("meta language, thin examples, and generic takeaways are rejected", () => {
  const item = source();
  const metaBody = [
    "顧客対応が変わっています。",
    "",
    "発表の見出しや製品の宣伝文は、この記事の構成にしていません。Atlasの記事が足すのは発表の言い換えではなく、判断です。読者が得るのは、元の発表を短くしたものではなく、次の一手です。",
    "",
    "## Atlasの見方",
    "",
    "まだ早いです。",
    "",
    "## 明日試すなら",
    "",
    "AIを導入して生産性を上げてください。",
  ].join("\n");
  const meta = editorialFailures({
    title: "顧客対応の確認",
    body: metaBody,
    sourceUrls: [item.canonicalUrl],
  }, item);
  assert.equal(meta.includes("meta editorial language"), true);
  assert.equal(meta.includes("missing concrete work examples"), true);
  assert.equal(meta.includes("missing deep workflow"), true);
  assert.equal(meta.includes("missing source-specific facts"), true);
  assert.equal(meta.includes("missing decision framework"), true);
  assert.equal(meta.includes("generic practical takeaway"), true);

  const shallow = editorialFailures({
    title: "顧客対応の確認",
    body: [
      "OpenAIが公開した案内の主題は「agent update」です。",
      "",
      "## 仕事で変わること",
      "",
      "営業もサポートも、AIが下書きを作り人が確認します。",
      "",
      "## Atlasの見方",
      "",
      "頻度と入力と検証は見ます。今すぐ試しません。",
      "",
      "## 明日試すなら",
      "",
      "最新機能を確認しましょう。",
    ].join("\n"),
    sourceUrls: [item.canonicalUrl],
  }, item);
  assert.equal(shallow.includes("missing deep workflow") || shallow.includes("shallow generic examples"), true);
  assert.equal(shallow.includes("generic practical takeaway") || shallow.includes("generic phrasing"), true);

  const good = editorialArticle(item);
  assert.deepEqual(editorialFailures({ title: good.title, body: good.body, sourceUrls: good.sourceUrls }, item), []);
  assert.equal(hasMetaEditorialLanguage(good.body), false);
  assert.equal(hasDeepWorkflow(good.body), true);
  assert.equal(hasDecisionFramework(good.body), true);
  assert.equal(hasGenericTakeaway(good.body), false);
  assert.doesNotMatch(good.body, /(頻度|入力|検証|可逆性|責任)\s*[:：]/);
});

test("human voice rejects fake experience, checklist dumps, and generic Atlas conclusions", () => {
  const item = source();
  const checklist = [
    "OpenAIが2026-11-14に出した「agent update」は、顧客対応の返信確認についての案内です。",
    "",
    "## 仕事でどう使える？",
    "",
    "依頼を渡す → AIが下書きを作る → 人が確認する → 送信は人が押す。",
    "",
    "## Atlasの見方",
    "",
    "頻度: 毎週あるか。入力: 揃っているか。検証: 確認できるか。可逆性: 止められるか。責任: 誰か。五つ揃うなら今試し、欠けたら待ちます。",
    "",
    "## 明日試すなら",
    "",
    "明日、繰り返し問い合わせを一件選んで返信案だけ作らせてみてください。",
    "",
    "## 出典",
    "",
    `[OpenAI](${item.canonicalUrl})`,
  ].join("\n");
  assert.equal(hasExcessiveFrameworkFormatting(checklist), true);
  assert.ok(editorialFailures({ title: "確認", body: checklist, sourceUrls: [item.canonicalUrl] }, item).includes("excessive framework formatting"));

  const fake = checklist.replace("五つ揃うなら今試し、欠けたら待ちます。", "私も使ってみました。実際に試したところ便利でした。");
  assert.equal(hasFabricatedFirstPerson(fake), true);
  assert.ok(editorialFailures({ title: "確認", body: fake, sourceUrls: [item.canonicalUrl] }, item).includes("fabricated personal experience"));

  const genericAtlas = [
    "OpenAIが2026-11-14に出した「agent update」は、顧客対応の返信確認についての案内です。",
    "",
    "## 仕事でどう使える？",
    "",
    "依頼を渡す → AIが下書きを作る → 人が確認する → 送信は人が押す。",
    "",
    "## Atlasの見方",
    "",
    "AIを活用して生産性を上げることが大切です。最新機能を確認しましょう。",
    "",
    "## 明日試すなら",
    "",
    "明日、繰り返し問い合わせを一件選んで返信案だけ作らせてみてください。",
    "",
    "## 出典",
    "",
    `[OpenAI](${item.canonicalUrl})`,
  ].join("\n");
  assert.equal(hasGenericAtlasConclusion(genericAtlas), true);
  const reasons = editorialFailures({ title: "確認", body: genericAtlas, sourceUrls: [item.canonicalUrl] }, item);
  assert.ok(reasons.includes("generic Atlas conclusion") || reasons.includes("meta editorial language") || reasons.includes("generic phrasing"));

  const shortButReal = editorialArticle(item);
  assert.deepEqual(editorialFailures({ title: shortButReal.title, body: shortButReal.body, sourceUrls: shortButReal.sourceUrls }, item), []);
  assert.match(shortButReal.body, /## 出典/);
  assert.match(shortButReal.body, /OpenAI/);
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

test("supporting-source synthesis follows the article topic, not Gemini Tasks", () => {
  const supportArticle = source({
    url: "https://openai.com/support-agent",
    canonicalUrl: "https://openai.com/support-agent",
    title: "OpenAI agent update for support teams",
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
  });
  const docs = source({
    url: "https://platform.openai.com/docs/guides/replies",
    canonicalUrl: "https://platform.openai.com/docs/guides/replies",
    publisher: "OpenAI",
    title: "Review replies before send",
    summary: "Product documentation about reviewing customer replies with human approval before anything is sent.",
  });
  const article = editorialArticle(supportArticle, [docs]);
  assert.match(article.body, /返信案づくりと送信判断を分ける|外に出す前の確認/);
  assert.doesNotMatch(article.body, /聞いたら答える/);
  assert.doesNotMatch(article.body, /途中まで進めてもらう/);
  assert.equal(hasMismatchedTaskSynthesis(article.body, supportArticle), false);
  assert.doesNotMatch(article.body, /PRIMARY_FACT|PRODUCT_DOC|COUNTERPOINT/);
  assert.deepEqual(
    editorialFailures({ title: article.title, body: article.body, sourceUrls: article.sourceUrls }, supportArticle, [supportArticle, docs]),
    [],
  );

  const gemini = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge in six countries, with chat-to-task execution and human confirmation before purchases.",
  });
  const safety = source({
    publisher: "OpenAI",
    url: "https://openai.com/index/computer-using-agent",
    canonicalUrl: "https://openai.com/index/computer-using-agent",
    title: "Computer-using agent safety guidance",
    summary: "OpenAI describes guardrails for computer use, including human confirmation before consequential actions like purchases.",
  });
  const tasks = editorialArticle(gemini, [safety]);
  assert.match(tasks.body, /買う・送る|途中まで/);
  assert.doesNotMatch(tasks.body, /COUNTERPOINT|PRODUCT_DOC/);
  assert.equal(hasMismatchedTaskSynthesis(tasks.body, gemini), false);

  const leaked = `${article.body}\n聞いたら答えるから途中まで進めてもらうへ寄っています。`;
  assert.equal(hasMismatchedTaskSynthesis(leaked, supportArticle), true);
  assert.ok(
    editorialFailures({ title: article.title, body: leaked, sourceUrls: article.sourceUrls }, supportArticle).includes(
      "mismatched research synthesis",
    ),
  );

  const bridge = synthesizeSupportBridge("customer-review", [
    { source: docs, role: "PRODUCT_DOC" },
  ]);
  assert.match(bridge, /返信案づくりと送信判断/);
  assert.doesNotMatch(bridge, /聞いたら答える/);
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
