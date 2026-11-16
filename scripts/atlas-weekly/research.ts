import { createHash } from "node:crypto";
import type { SourceRecord, WeeklyCategory } from "./types";

const FOCUS = [
  ["openai", 24],
  ["anthropic", 24],
  ["claude", 18],
  ["gemini", 22],
  ["google", 12],
  ["microsoft", 14],
  ["salesforce", 16],
  ["databricks", 16],
  ["vercel", 16],
  ["cursor", 18],
  ["san francisco", 14],
  ["startup", 8],
  ["model", 6],
  ["agent", 8],
] as const;

export function canonicalUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "ref" || key === "source") url.searchParams.delete(key);
    }
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return "";
  }
}

export function sourceSlug(weekKey: string, url: string): string {
  const digest = createHash("sha256").update(canonicalUrl(url) || url).digest("hex").slice(0, 8);
  const week = weekKey.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `weekly-${week}-${digest}`;
}

export function relevanceScore(title: string, summary: string): number {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0;
  for (const [word, weight] of FOCUS) {
    if (text.includes(word)) score += weight;
  }
  return Math.min(100, score);
}

export function practicalImplication(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (/cursor|vercel|coding|developer|github/.test(text)) {
    return "開発チームは、手順とレビューのどこが変わるかを確認する材料になります。";
  }
  if (/salesforce|crm|customer|support/.test(text)) {
    return "営業や顧客対応の確認手順に影響するかを見る材料になります。";
  }
  if (/san francisco|startup|funding|silicon/.test(text)) {
    return "米国テックの動きとして、国内の仕事に転用できるかを見る材料になります。";
  }
  if (/openai|anthropic|gemini|microsoft|databricks|model|agent/.test(text)) {
    return "既存のプロンプトや確認手順を変える必要があるかを見る材料になります。";
  }
  return "中小企業の担当者が今週確認すべき変更かを判断する材料になります。";
}

export function categoryFor(title: string, summary: string): WeeklyCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (/san francisco|startup|silicon|funding|vercel|cursor/.test(text)) return "us-tech";
  if (/workflow|small business|customer|sales|support|invoice/.test(text)) return "practical-ai";
  if (/api|sdk|benchmark|architecture|open-weight|technical/.test(text)) return "technical";
  return "ai-news";
}

export function normalizeSource(input: {
  url: string;
  title: string;
  publisher: string;
  publishedAt: string | null;
  retrievedAt: string;
  summary: string;
}): SourceRecord | null {
  const url = canonicalUrl(input.url);
  const title = input.title.replace(/\s+/g, " ").trim();
  const summary = input.summary.replace(/\s+/g, " ").trim();
  if (!url || title.length < 8 || summary.length < 40) return null;
  return {
    url,
    canonicalUrl: url,
    title: title.slice(0, 180),
    publisher: input.publisher.trim().slice(0, 80) || "Source",
    publishedAt: input.publishedAt,
    retrievedAt: input.retrievedAt,
    summary: summary.slice(0, 700),
    relevance: relevanceScore(title, summary),
    implication: practicalImplication(title, summary),
  };
}

/** Keep the highest-scoring record for each canonical URL. */
export function dedupeSources(records: readonly SourceRecord[]): SourceRecord[] {
  const byUrl = new Map<string, SourceRecord>();
  for (const record of records) {
    const current = byUrl.get(record.canonicalUrl);
    if (!current || record.relevance > current.relevance) byUrl.set(record.canonicalUrl, record);
  }
  return [...byUrl.values()];
}

export function selectTopics(records: readonly SourceRecord[], limit = 4): SourceRecord[] {
  return dedupeSources(records)
    .filter((record) => record.relevance >= 12)
    .sort((a, b) => b.relevance - a.relevance || b.publishedAt?.localeCompare(a.publishedAt ?? "") || 0)
    .slice(0, limit);
}

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decode(match[1] ?? "") : "";
}

function attr(block: string, tagName: string, attribute: string): string {
  const match = block.match(new RegExp(`<${tagName}[^>]*${attribute}=["']([^"']+)["'][^>]*/?>`, "i"));
  return match?.[1]?.trim() ?? "";
}

export function parseFeed(xml: string, publisher: string, retrievedAt: string): SourceRecord[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return blocks.flatMap((block) => {
    const link = tag(block, "link") || attr(block, "link", "href");
    const title = tag(block, "title");
    const summary = tag(block, "description") || tag(block, "summary") || tag(block, "content");
    const published = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const publishedAt = published && !Number.isNaN(Date.parse(published)) ? new Date(published).toISOString() : null;
    const record = normalizeSource({ url: link, title, publisher, publishedAt, retrievedAt, summary });
    return record ? [record] : [];
  });
}

export async function fetchFeed(url: string, publisher: string, retrievedAt: string, timeoutMs = 12000): Promise<SourceRecord[]> {
  const response = await fetch(url, {
    headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${publisher} returned ${response.status}`);
  return parseFeed(await response.text(), publisher, retrievedAt).slice(0, 8);
}
