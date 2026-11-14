import { shippedBlueprintPage } from "@/src/lib/admin/catalog";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";

export const ARTICLE_STATUSES = ["DRAFT", "READY_FOR_REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ARTICLE_CATEGORIES = [
  { id: "ai-news", label: "AIニュース" },
  { id: "us-tech", label: "US Tech / SF Tech" },
  { id: "practical-ai", label: "実務AI活用" },
  { id: "technical", label: "技術解説" },
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]["id"];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: ArticleCategory;
  sourceUrls: string[];
  relatedBlueprints: string[];
  publishedAt: string;
  featured: boolean;
  displayAuthor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string | null;
};

export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; inlines: ArticleInline[] }
  | { type: "list"; items: ArticleInline[][] };

export type ArticleInline = { type: "text"; text: string } | { type: "link"; text: string; href: string };

export type RelatedBlueprint = {
  slug: string;
  titleJa: string;
  href: string;
};

export function isArticleCategory(value: string): value is ArticleCategory {
  return ARTICLE_CATEGORIES.some((item) => item.id === value);
}

export function articleCategoryLabel(category: ArticleCategory): string {
  return ARTICLE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

export function isPublicArticle(article: { status: string; publishedAt: string | null }): boolean {
  return article.status === "PUBLISHED" && article.publishedAt !== null && !Number.isNaN(Date.parse(article.publishedAt));
}

export function summarizeArticles(rows: { status: string }[]): {
  published: number;
  drafts: number;
  readyForReview: number;
  approved: number;
  needsChanges: number;
  rejected: number;
  archived: number;
  total: number;
} {
  const counts = {
    published: 0,
    drafts: 0,
    readyForReview: 0,
    approved: 0,
    needsChanges: 0,
    rejected: 0,
    archived: 0,
    total: 0,
  };
  for (const row of rows) {
    if (row.status === "PUBLISHED") counts.published += 1;
    else if (row.status === "DRAFT") counts.drafts += 1;
    else if (row.status === "READY_FOR_REVIEW") counts.readyForReview += 1;
    else if (row.status === "APPROVED") counts.approved += 1;
    else if (row.status === "NEEDS_CHANGES") counts.needsChanges += 1;
    else if (row.status === "REJECTED") counts.rejected += 1;
    else if (row.status === "ARCHIVED") counts.archived += 1;
    else continue;
    counts.total += 1;
  }
  return counts;
}

export function publishedSitemapPaths(articles: { slug: string; status: string; publishedAt: string | null }[]): string[] {
  return articles
    .filter((article) => isPublicArticle(article) && SLUG.test(article.slug))
    .map((article) => `/ja/blog/${article.slug}`);
}

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function stringList(value: unknown, map: (item: string) => string | null): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const next = map(item.trim());
    if (!next || seen.has(next)) continue;
    seen.add(next);
    result.push(next);
  }
  return result;
}

export function parsePublicArticle(row: Record<string, unknown>): PublicArticle | null {
  if (row.status !== "PUBLISHED") return null;
  if (typeof row.slug !== "string" || !SLUG.test(row.slug)) return null;
  if (typeof row.title !== "string" || row.title.trim().length === 0) return null;
  if (typeof row.summary !== "string" || row.summary.trim().length === 0) return null;
  if (typeof row.body !== "string" || row.body.trim().length === 0) return null;
  if (typeof row.category !== "string" || !isArticleCategory(row.category)) return null;
  if (typeof row.published_at !== "string" || Number.isNaN(Date.parse(row.published_at))) return null;
  if (typeof row.id !== "string" || row.id.length === 0) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title.trim(),
    summary: row.summary.trim(),
    body: row.body,
    category: row.category,
    sourceUrls: stringList(row.source_urls, httpUrl),
    relatedBlueprints: stringList(row.related_blueprints, (slug) => (SLUG.test(slug) ? slug : null)),
    publishedAt: row.published_at,
    featured: row.featured === true,
    displayAuthor: typeof row.display_author === "string" && row.display_author.trim() ? row.display_author.trim() : null,
    seoTitle: typeof row.seo_title === "string" && row.seo_title.trim() ? row.seo_title.trim() : null,
    seoDescription: typeof row.seo_description === "string" && row.seo_description.trim() ? row.seo_description.trim() : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function relatedBlueprintLinks(slugs: readonly string[]): RelatedBlueprint[] {
  const seen = new Set<string>();
  const links: RelatedBlueprint[] = [];
  for (const slug of slugs) {
    if (seen.has(slug) || !SLUG.test(slug) || !shippedBlueprintPage(slug)) continue;
    const titleJa = japaneseUseCase(slug)?.title;
    if (!titleJa || titleJa === slug) continue;
    seen.add(slug);
    links.push({ slug, titleJa, href: `/ja/blueprints/${slug}` });
  }
  return links;
}

const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function parseInlines(text: string): ArticleInline[] {
  const inlines: ArticleInline[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > cursor) inlines.push({ type: "text", text: text.slice(cursor, index) });
    const href = httpUrl(match[2] ?? "");
    if (href && match[1]) inlines.push({ type: "link", text: match[1], href });
    else inlines.push({ type: "text", text: match[0] ?? "" });
    cursor = index + (match[0]?.length ?? 0);
  }
  if (cursor < text.length) inlines.push({ type: "text", text: text.slice(cursor) });
  return inlines.filter((item) => item.type === "link" || item.text.length > 0);
}

/** Plain paragraphs, ## headings, and "- " lists. Raw HTML stays text. */
export function articleBlocks(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) blocks.push({ type: "paragraph", inlines: parseInlines(text) });
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ type: "list", items: list.map((item) => parseInlines(item)) });
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith("- ")) {
      flushParagraph();
      list.push(trimmed.slice(2).trim());
      continue;
    }
    flushList();
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function selectFeatured(articles: readonly PublicArticle[]): PublicArticle | null {
  return articles.find((article) => article.featured) ?? articles[0] ?? null;
}

export function formatArticleDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
