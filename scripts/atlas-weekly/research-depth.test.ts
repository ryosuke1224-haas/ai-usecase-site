import assert from "node:assert/strict";
import test from "node:test";
import { editorialArticle, editorialFailures } from "./editorial";
import { selectEdition } from "./research";
import {
  buildResearchBrief,
  canSustainResearchedArticle,
  isDirectlyRelevantSupport,
  researchQuestionFor,
  supportingSourcesRelevant,
} from "./research-depth";
import type { SourceRecord } from "./types";

const NOW = "2026-11-18T00:00:00.000Z";

function source(patch: Partial<SourceRecord> = {}): SourceRecord {
  const url = patch.canonicalUrl ?? patch.url ?? "https://example.com/story";
  return {
    url,
    canonicalUrl: url,
    title: "OpenAI agent update for support teams",
    publisher: "OpenAI",
    publishedAt: "2026-11-14T00:00:00.000Z",
    retrievedAt: NOW,
    summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
    relevance: 50,
    implication: "確認手順を見る材料になります。",
    ...patch,
  };
}

test("research questions follow the primary capability rather than incidental feed text", () => {
  const search = source({
    title: "A more tailored Google Search",
    summary: '<img src="pContext_Drive.webp"> Personal Intelligence can use opted-in information from Drive.',
  });
  const bedrock = source({
    title: "Amazon Bedrock Trusted Access API",
    summary: "The API provides a way to discover, request, and enroll in provider programs.",
  });
  const caching = source({
    title: "Prompt caching documentation",
    summary: "OpenAI explains how to check reused prompt prefixes.",
  });
  assert.match(researchQuestionFor(search), /検索.*連携.*原資料/);
  assert.match(researchQuestionFor(bedrock), /申請.*誰が何を確認/);
  assert.match(researchQuestionFor(caching), /前置き.*案件別.*再利用/);
});

test("weakly related second source is rejected", () => {
  const primary = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge in six countries, with chat-to-task execution and human confirmation before purchases.",
    relevance: 40,
  });
  const nato = source({
    publisher: "OpenAI",
    url: "https://openai.com/nato",
    canonicalUrl: "https://openai.com/nato",
    title: "Strengthening NATO and allied cyber defenses with AI",
    summary: "How OpenAI is working with NATO and allied cyber agencies to help trusted defenders find vulnerabilities and protect essential systems.",
    relevance: 60,
  });
  assert.equal(isDirectlyRelevantSupport(primary, nato), false);
  assert.equal(supportingSourcesRelevant(primary, [primary, nato]).length, 0);
  const brief = buildResearchBrief(primary, [primary, nato]);
  assert.equal(brief.supports.length, 0);
  assert.ok(brief.rejected.some((item) => item.source.canonicalUrl === nato.canonicalUrl));
});

test("directly relevant supporting source is accepted", () => {
  const primary = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge for users who flip from Chat to Tasks and hand off multi-step work with confirmation before buying.",
    relevance: 40,
  });
  const docs = source({
    publisher: "Google",
    url: "https://gemini.google/overview/productivity/",
    canonicalUrl: "https://gemini.google/overview/productivity/",
    title: "Do More with Gemini productivity and Tasks",
    summary: "Tasks in Gemini differ from a chatbot: flip Chat to Tasks, run multi-step work across apps, and keep action under your direction.",
    relevance: 30,
  });
  const report = source({
    publisher: "9to5Google",
    url: "https://9to5google.com/2026/11/17/gemini-tasks-free/",
    canonicalUrl: "https://9to5google.com/2026/11/17/gemini-tasks-free/",
    title: "You can now assign Gemini tasks for free in six countries",
    summary: "Gemini tasks, previously known as Spark, is free for Chat versus Task toggle users with confirmation before purchases.",
    relevance: 28,
  });
  assert.equal(isDirectlyRelevantSupport(primary, docs), true);
  assert.equal(isDirectlyRelevantSupport(primary, report), true);
  const supports = supportingSourcesRelevant(primary, [primary, docs, report]);
  assert.ok(supports.some((item) => item.canonicalUrl === docs.canonicalUrl));
  assert.ok(supports.some((item) => item.canonicalUrl === report.canonicalUrl));
});

test("source count alone does not satisfy research depth", () => {
  const primary = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge in six countries with multi-step task execution.",
  });
  const weakA = source({
    url: "https://example.com/a",
    canonicalUrl: "https://example.com/a",
    publisher: "Reuters",
    title: "AI security funding note",
    summary: "A short note about artificial intelligence security funding for government systems and human oversight teams.",
  });
  const weakB = source({
    url: "https://example.com/b",
    canonicalUrl: "https://example.com/b",
    publisher: "TechCrunch",
    title: "Another AI platform update",
    summary: "Another artificial intelligence platform update about models and human oversight without task workflows.",
  });
  const body = [
    "Googleが公開した案内です。",
    "Reutersが公開した案内です。",
    "TechCrunchが公開した案内です。",
    "",
    "## Atlasの見方",
    "",
    "頻度と入力と検証と可逆性と責任を見ます。今は待ちます。",
    "",
    "## 明日試すなら",
    "",
    "明日、機能一覧を確認しましょう。",
  ].join("\n");
  const failures = editorialFailures(
    { title: "AIの更新", body, sourceUrls: [primary.canonicalUrl, weakA.canonicalUrl, weakB.canonicalUrl] },
    primary,
    [primary, weakA, weakB],
  );
  assert.equal(failures.includes("weak supporting source"), true);
  assert.ok(failures.includes("sources not synthesized") || failures.includes("source count without research depth"));
});

test("article must have an editorial research question and one-source may pass", () => {
  const primary = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge in six countries, with multi-step task execution and confirmation before purchases.",
    relevance: 40,
  });
  assert.ok(researchQuestionFor(primary).includes("任せて"));
  assert.equal(canSustainResearchedArticle(primary, [primary]), true);
  const article = editorialArticle(primary, []);
  assert.ok(article.researchQuestion.length >= 12);
  assert.deepEqual(editorialFailures({ title: article.title, body: article.body, sourceUrls: article.sourceUrls }, primary, [primary]), []);
  assert.equal(article.sourceUrls.length, 1);
});

test("unrelated evidence cannot pad an article and weak topics yield fewer weekly items", () => {
  const gemini = source({
    publisher: "Google",
    url: "https://blog.google/tasks",
    canonicalUrl: "https://blog.google/tasks",
    title: "Put Gemini to work for you",
    summary: "Tasks in Gemini is now free of charge in six countries with chat-to-task execution.",
    relevance: 40,
  });
  const nato = source({
    publisher: "OpenAI",
    url: "https://openai.com/nato",
    canonicalUrl: "https://openai.com/nato",
    title: "Strengthening NATO and allied cyber defenses with AI",
    summary: "OpenAI works with NATO cyber agencies on vulnerability discovery and defense systems.",
    relevance: 80,
  });
  const thin = source({
    publisher: "Vercel",
    url: "https://vercel.com/changelog/x",
    canonicalUrl: "https://vercel.com/changelog/x",
    title: "Qwen4-Max now available on AI Gateway",
    summary: "The model is now available on AI Gateway for a short-term promotion with percent off.",
    relevance: 90,
  });
  const padded = editorialArticle(gemini, [nato]);
  assert.equal(padded.sourceUrls.includes(nato.canonicalUrl), false);
  const failures = editorialFailures(
    {
      title: padded.title,
      body: `${padded.body}\n\nOpenAIのNATO記事も参照します。`,
      sourceUrls: [gemini.canonicalUrl, nato.canonicalUrl],
    },
    gemini,
    [gemini, nato],
  );
  assert.equal(failures.includes("weak supporting source"), true);

  const selected = selectEdition([gemini, nato, thin], "2026-W47");
  assert.ok(selected.some((item) => item.canonicalUrl === gemini.canonicalUrl || item.evergreen));
  assert.equal(selected.some((item) => item.canonicalUrl === thin.canonicalUrl), false);
  assert.ok(selected.filter((item) => !item.evergreen).length <= 2);
});
