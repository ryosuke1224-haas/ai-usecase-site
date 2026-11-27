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

export function relatedBlueprints(source: SourceRecord, products: readonly KnownProduct[]): string[] {
  const tip = source.evergreen ? tipByUrl(source.canonicalUrl) : undefined;
  const slug = tip ? tip.workflow : workflowFor(source)?.slug;
  return slug && products.some((product) => product.slug === slug) ? [slug] : [];
}

export function blogDraft(
  source: SourceRecord,
  weekKey: string,
  products: readonly KnownProduct[],
  research: readonly SourceRecord[] = [],
): BlogDraft {
  const tip = source.evergreen ? tipByUrl(source.canonicalUrl) : undefined;
  if (tip) {
    return {
      slug: sourceSlug(weekKey, source.canonicalUrl),
      title: tip.title,
      summary: clip(tip.summary, 180),
      body: tip.body,
      sourceUrls: [...tip.sourceUrls],
      category: tip.category,
      relatedBlueprints: relatedBlueprints(source, products),
      seoTitle: clip(tip.title, 60),
      seoDescription: clip(tip.summary, 140),
      status: "READY_FOR_REVIEW",
      canonicalUrl: source.canonicalUrl,
    };
  }
  const article = editorialArticle(source, supportingSources(source, research));
  return {
    slug: sourceSlug(weekKey, source.canonicalUrl),
    title: article.title,
    summary: clip(article.summary, 180),
    body: article.body,
    sourceUrls: article.sourceUrls,
    category: article.category,
    relatedBlueprints: relatedBlueprints(source, products),
    seoTitle: clip(article.title, 60),
    seoDescription: clip(article.summary, 140),
    status: "READY_FOR_REVIEW",
    canonicalUrl: source.canonicalUrl,
  };
}

export function newsletterDraft(weekKey: string, blogs: readonly BlogDraft[]): NewsletterDraft | null {
  const [lead, ...rest] = blogs.filter((blog) => !blog.internal);
  if (!lead) return null;
  const slug = `weekly-${weekKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const context = rest.slice(0, 2);
  const desk = [...new Set([lead, ...context].flatMap((blog) => blog.sourceUrls))];
  const summary = lead.editorialTakeaway ?? lead.summary;
  const body = [
    `## 今週の焦点 — ${lead.title}`,
    lead.summary,
    lead.editorialTakeaway ?? "",
    ...context.flatMap((blog) => [
      `## ${blog.editorialType === "practical-tip" ? "手元で検証するなら" : "別の論点"} — ${blog.title}`,
      blog.editorialTakeaway ?? blog.summary,
    ]),
    ...(desk.length ? ["## 参照した資料", ...desk.map((url, index) => `- [資料 ${index + 1}](${url})`)] : []),
  ].filter(Boolean).join("\n\n");
  return {
    slug,
    title: clip(`Atlas Weekly — ${lead.title}`, 80),
    summary,
    body,
    sourceUrls: desk,
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
