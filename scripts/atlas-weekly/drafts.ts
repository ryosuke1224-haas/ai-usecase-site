import { categoryFor, sourceSlug } from "./research";
import type { BlueprintCandidate, BlogDraft, NewsletterDraft, SourceRecord } from "./types";

const CATEGORY_LABEL = {
  "ai-news": "AIニュース",
  "us-tech": "US Tech / SF Tech",
  "practical-ai": "実務AI活用",
  "technical": "技術解説",
} as const;

export type KnownProduct = { slug: string; name: string };

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function relatedSlug(source: SourceRecord, products: readonly KnownProduct[]): string | null {
  const text = `${source.title} ${source.summary}`.toLowerCase();
  const match = products.find((product) => {
    const tokens = product.name.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 4);
    return tokens.some((token) => text.includes(token));
  });
  return match?.slug ?? null;
}

export function blogDraft(source: SourceRecord, weekKey: string, products: readonly KnownProduct[]): BlogDraft {
  const category = categoryFor(source.title, source.summary);
  const related = relatedSlug(source, products);
  const label = CATEGORY_LABEL[category];
  const title = clip(`${label}: ${source.title}`, 90);
  const summary = clip(`${source.publisher}の報道を、仕事での確認点だけに絞った下書きです。${source.implication}`, 180);
  const body = [
    `## 何が報じられたか`,
    "",
    `${source.publisher}が「${source.title}」を公開しています。ここに書く事実は、取得した要約の範囲だけです。`,
    "",
    source.summary,
    "",
    `出典: [${source.publisher}](${source.canonicalUrl})`,
    "",
    `## 仕事での見方`,
    "",
    source.implication,
    "",
    "効果の数字や料金は、この下書きでは足していません。公開前に原文を確認してください。",
  ].join("\n");
  return {
    slug: sourceSlug(weekKey, source.canonicalUrl),
    title,
    summary,
    body,
    sourceUrls: [source.canonicalUrl],
    category,
    relatedBlueprints: related ? [related] : [],
    seoTitle: clip(title, 60),
    seoDescription: clip(summary, 140),
    status: "READY_FOR_REVIEW",
    canonicalUrl: source.canonicalUrl,
  };
}

export function newsletterDraft(weekKey: string, blogs: readonly BlogDraft[]): NewsletterDraft | null {
  if (blogs.length === 0) return null;
  const slug = `weekly-${weekKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const stories = blogs.map((blog, index) => {
    const url = blog.sourceUrls[0] ?? "";
    return [
      `## ${index + 1}. ${blog.title}`,
      "",
      blog.summary,
      "",
      url ? `出典: [原文](${url})` : "",
      "",
      "仕事への影響: 原文の範囲で、既存の手順を変える必要があるかを確認します。",
    ].filter(Boolean).join("\n");
  });
  const related = blogs.flatMap((blog) => blog.relatedBlueprints)[0] ?? null;
  const body = [
    "今週のAIと米国テックの動きを、公開前の確認用にまとめました。この下書きは送信しません。",
    "",
    ...stories,
    "",
    "## 関連テンプレート",
    "",
    related
      ? `既存テンプレート \`${related}\` が近い話題です。新しい販売や価格はここには書きません。`
      : "今週の話題に直結する既存テンプレートは付けていません。",
    "",
    "## 製品の更新",
    "",
    "公開中のテンプレートと購入の仕組みは、この下書きでは変更しません。",
  ].join("\n");
  return {
    slug,
    title: clip(`今週のAI実務メモ ${weekKey}`, 80),
    summary: "確認用の週次ニュースレター下書きです。送信はまだ始まりません。",
    body,
    sourceUrls: blogs.flatMap((blog) => blog.sourceUrls),
    status: "READY_FOR_REVIEW",
  };
}

const WORKFLOW = [
  { pattern: /support|customer|reply|inbox/, slug: "ai-customer-response-assistant", workflow: "受信した問い合わせを確認し、返信案を人が承認する" },
  { pattern: /invoice|payment|collection|overdue/, slug: "ai-collections-assistant", workflow: "未入金の請求を並べ、フォロー文を人が送る" },
  { pattern: /quote|estimate|proposal/, slug: "quote-request-assistant", workflow: "見積依頼の条件を抜き、最初の返事を人が確認する" },
  { pattern: /ads|campaign|marketing/, slug: "google-ads-performance-coach", workflow: "広告の数字を確認し、次の作業を人が決める" },
] as const;

export function blueprintCandidates(
  sources: readonly SourceRecord[],
  products: readonly KnownProduct[],
  weekKey: string,
): BlueprintCandidate[] {
  const results: BlueprintCandidate[] = [];
  for (const source of sources) {
    if (results.length === 3) break;
    const text = `${source.title} ${source.summary}`.toLowerCase();
    const workflow = WORKFLOW.find((item) => item.pattern.test(text));
    if (!workflow) continue;
    const known = products.some((product) => product.slug === workflow.slug);
    const sameTitle = results.some((item) => item.canonicalUrl === source.canonicalUrl);
    if (sameTitle) continue;
    const recommendation = known ? "merge" : "build";
    const jaTitle = `確認キュー: ${clip(source.title, 40)}`;
    const enTitle = `Review queue: ${clip(source.title, 60)}`;
    results.push({
      slug: sourceSlug(weekKey, `${source.canonicalUrl}#blueprint`),
      title: jaTitle,
      enTitle,
      jaTitle,
      summary: `${enTitle}. ${source.implication}`,
      problem: clip(source.summary, 220),
      targetUser: "中小企業で、その作業の確認を担当する人",
      workflow: workflow.workflow,
      tools: "既存の受信箱、表、または管理画面の書き出し。新しい接続はこの候補では作りません。",
      businessValue: source.implication,
      overlap: known ? `既存の ${workflow.slug} と重なります。` : "同じ手順の既存テンプレートは見当たりません。",
      recommendation,
      relatedSlug: known ? workflow.slug : null,
      sourceUrls: [source.canonicalUrl],
      canonicalUrl: source.canonicalUrl,
      status: "READY_FOR_REVIEW",
    });
  }
  return results;
}
