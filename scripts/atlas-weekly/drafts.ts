import { editorialArticle, isLowValueNews, supportingSources } from "./editorial";
import { tipByUrl } from "./tips";
import { sourceSlug } from "./research";
import type { BlueprintCandidate, BlogDraft, NewsletterDraft, SourceRecord } from "./types";

export type KnownProduct = { slug: string; name: string };

function clip(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

const WORKFLOW = [
  {
    pattern: /support|customer|reply|inbox/,
    slug: "ai-customer-response-assistant",
    jaTitle: "問い合わせ返信を人が確認してから送る",
    enTitle: "Review customer replies before they are sent",
    workflow: "受信した問い合わせの返信案を作り、人が確認してから送る",
    problem: "問い合わせの返信案と、送る前の確認が毎回同じ担当者に戻っています。",
  },
  {
    pattern: /invoice|payment|collection|overdue/,
    slug: "ai-collections-assistant",
    jaTitle: "未入金の請求を人が確認してからフォローする",
    enTitle: "Review overdue invoices before a follow-up is sent",
    workflow: "未入金の請求を並べ、フォロー文を人が送る",
    problem: "遅れている請求の確認と、先方への連絡文の作成が同じ日に重なります。",
  },
  {
    pattern: /quote|estimate|proposal/,
    slug: "quote-request-assistant",
    jaTitle: "見積依頼の条件を人が確認してから返事する",
    enTitle: "Review quote-request details before replying",
    workflow: "見積依頼の条件を抜き、最初の返事を人が確認する",
    problem: "見積依頼の条件確認と、最初の返事の作成が担当者に集中しています。",
  },
  {
    pattern: /ads|campaign|marketing/,
    slug: "google-ads-performance-coach",
    jaTitle: "広告の結果を人が見てから次の作業を決める",
    enTitle: "Review ad results before choosing the next change",
    workflow: "広告の数字を確認し、次の作業を人が決める",
    problem: "広告の数字確認と、次に変える作業の決定が毎週同じ人に戻っています。",
  },
] as const;

function workflowFor(source: SourceRecord) {
  if (isLowValueNews(source.title, source.summary)) return null;
  const text = `${source.title} ${source.summary}`.toLowerCase();
  return WORKFLOW.find((item) => item.pattern.test(text)) ?? null;
}

export function blogDraft(
  source: SourceRecord,
  weekKey: string,
  products: readonly KnownProduct[],
  research: readonly SourceRecord[] = [],
): BlogDraft {
  const tip = source.evergreen ? tipByUrl(source.canonicalUrl) : undefined;
  if (tip) {
    const related = tip.workflow && products.some((product) => product.slug === tip.workflow) ? tip.workflow : null;
    return {
      slug: sourceSlug(weekKey, source.canonicalUrl),
      title: tip.title,
      summary: clip(tip.summary, 180),
      body: tip.body,
      sourceUrls: [...tip.sourceUrls],
      category: tip.category,
      relatedBlueprints: related ? [related] : [],
      seoTitle: clip(tip.title, 60),
      seoDescription: clip(tip.summary, 140),
      status: "READY_FOR_REVIEW",
      canonicalUrl: source.canonicalUrl,
    };
  }
  const article = editorialArticle(source, supportingSources(source, research));
  const workflow = workflowFor(source);
  const related = workflow && products.some((product) => product.slug === workflow.slug) ? workflow.slug : null;
  return {
    slug: sourceSlug(weekKey, source.canonicalUrl),
    title: article.title,
    summary: clip(article.summary, 180),
    body: article.body,
    sourceUrls: article.sourceUrls,
    category: article.category,
    relatedBlueprints: related ? [related] : [],
    seoTitle: clip(article.title, 60),
    seoDescription: clip(article.summary, 140),
    status: "READY_FOR_REVIEW",
    canonicalUrl: source.canonicalUrl,
  };
}

export function newsletterDraft(weekKey: string, blogs: readonly BlogDraft[]): NewsletterDraft | null {
  if (blogs.length === 0) return null;
  const slug = `weekly-${weekKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const stories = blogs.map((blog) => {
    const url = blog.sourceUrls[0] ?? "";
    return [
      `## ${blog.title}`,
      "",
      blog.summary,
      "",
      "仕事での次の一歩は、記事末尾の「明日試すなら」にある確認作業を一つだけ選ぶことです。",
      "",
      url ? `出典: [原文](${url})` : "",
    ].filter(Boolean).join("\n");
  });
  const related = blogs.flatMap((blog) => blog.relatedBlueprints)[0] ?? null;
  const body = [
    "今週のAtlasの論点を、公開前の確認用にまとめました。ベンダーの更新一覧ではありません。この下書きは送信しません。",
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

export function blueprintCandidates(
  sources: readonly SourceRecord[],
  products: readonly KnownProduct[],
  weekKey: string,
): BlueprintCandidate[] {
  const results: BlueprintCandidate[] = [];
  for (const source of sources) {
    if (results.length === 3) break;
    const workflow = workflowFor(source);
    if (!workflow) continue;
    const known = products.some((product) => product.slug === workflow.slug);
    const sameTitle = results.some((item) => item.canonicalUrl === source.canonicalUrl);
    if (sameTitle) continue;
    const recommendation = known ? "merge" : "build";
    const jaTitle = workflow.jaTitle;
    const enTitle = workflow.enTitle;
    results.push({
      slug: sourceSlug(weekKey, `${source.canonicalUrl}#blueprint`),
      title: jaTitle,
      enTitle,
      jaTitle,
      summary: `${enTitle}. ${source.implication}`,
      problem: workflow.problem,
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
