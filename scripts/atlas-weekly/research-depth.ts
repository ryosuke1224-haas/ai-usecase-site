import type { SourceRecord } from "./types";

const LOW_VALUE = [
  /ai gateway/i,
  /now available/i,
  /available on/i,
  /%\s*off/i,
  /changelog/i,
  /利用可能になり/,
];

function isLowValueNews(title: string, summary: string): boolean {
  return LOW_VALUE.some((pattern) => pattern.test(`${title} ${summary}`));
}

/** Internal only — never print these labels in public article bodies. */
export type SourceRole =
  | "PRIMARY_FACT"
  | "PRODUCT_DOC"
  | "SUPPORTING_EVIDENCE"
  | "CONTEXT"
  | "COUNTERPOINT";

export type ResearchBrief = {
  question: string;
  primary: SourceRecord;
  supports: Array<{ source: SourceRecord; role: SourceRole; score: number }>;
  rejected: Array<{ source: SourceRecord; reason: string }>;
};

const AUTHORITATIVE = new Set(["openai", "anthropic", "google", "microsoft", "aws", "nist", "meta"]);

const STOP = new Set([
  "about", "after", "before", "their", "there", "these", "those", "with", "from", "that", "this",
  "have", "will", "would", "could", "should", "into", "over", "under", "more", "than", "when",
  "what", "which", "while", "where", "your", "you", "are", "was", "were", "been", "being",
  "and", "for", "the", "a", "an", "of", "to", "in", "on", "as", "by", "or", "is", "it",
  "described", "published", "announced", "update", "updates", "news", "today", "free",
  "公開", "案内", "発表", "について", "という", "もの", "こと",
]);

/** Generic AI words alone do not prove two sources share a reader-facing topic. */
const WEAK_ONLY = new Set([
  "artificial", "intelligence", "model", "models", "llm", "genai", "generative",
  "system", "systems", "tool", "tools", "platform", "company", "teams", "team",
  "human", "oversight", "safety", "secure", "security", "defense", "defence",
  "cyber", "nato", "allied", "military", "government", "policy",
]);

const PRODUCT_DOC_HOST = /(docs\.|developers\.|support\.|help\.|cloud\.google|gemini\.google|learn\.microsoft|platform\.openai)/i;

export function isAuthoritativePublisher(publisher: string): boolean {
  return AUTHORITATIVE.has(publisher.trim().toLowerCase());
}

export function researchQuestionFor(source: SourceRecord): string {
  const text = `${source.title} ${source.summary}`.toLowerCase();
  if (/tasks?|spark|agent|long-running|workflow|computer use|multi-?step/.test(text)) {
    return "チャット回答から複数ステップの仕事実行へ移るとき、どこまで任せてどこで人が止めるべきか";
  }
  if (/support|customer|reply|inbox/.test(text)) {
    return "顧客への返信で、下書き生成と送信判断をどう分けるべきか";
  }
  if (/invoice|payment|overdue|collection/.test(text)) {
    return "未入金フォローで、候補づくりと送信判断をどう分けるべきか";
  }
  if (/document|pdf|contract|context/.test(text)) {
    return "長い資料を渡すとき、何を先に決めてからモデルに見させるべきか";
  }
  if (/enterprise|governance|copilot|operating/.test(text)) {
    return "企業導入で、全社展開より先に切り出すべき確認手順は何か";
  }
  if (/funding|startup|silicon|regulat|antitrust/.test(text)) {
    return "この動きは自社の利用制約や説明範囲を今週変える材料か";
  }
  return "この公開は、繰り返す確認作業のどの前段を変えうるか";
}

export function topicTokens(value: string): Set<string> {
  const tokens = value
    .toLowerCase()
    .split(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/)
    .filter((token) => token.length >= 4 && !STOP.has(token));
  return new Set(tokens);
}

export function classifySourceRole(primary: SourceRecord, candidate: SourceRecord): SourceRole {
  const host = (() => {
    try {
      return new URL(candidate.canonicalUrl).hostname;
    } catch {
      return "";
    }
  })();
  if (PRODUCT_DOC_HOST.test(candidate.canonicalUrl) || PRODUCT_DOC_HOST.test(host)) return "PRODUCT_DOC";
  if (/reuters|verge|techcrunch|ars|9to5|cnbc|wired/.test(`${candidate.publisher} ${host}`.toLowerCase())) {
    return "CONTEXT";
  }
  if (/limit|risk|guardrail|approval|confirm|mistake|caution|安全|制限/.test(`${candidate.title} ${candidate.summary}`.toLowerCase())
    && /docs|developers|security|safety|guardrail/.test(`${candidate.canonicalUrl} ${candidate.title}`.toLowerCase())) {
    return "COUNTERPOINT";
  }
  if (candidate.publisher.toLowerCase() === primary.publisher.toLowerCase()) return "SUPPORTING_EVIDENCE";
  return "SUPPORTING_EVIDENCE";
}

function sharedTopicTokens(primary: SourceRecord, candidate: SourceRecord): string[] {
  const a = topicTokens(`${primary.title} ${primary.summary}`);
  const b = topicTokens(`${candidate.title} ${candidate.summary}`);
  return [...a].filter((token) => b.has(token));
}

function meaningfulOverlap(shared: readonly string[]): string[] {
  return shared.filter((token) => !WEAK_ONLY.has(token) && !/^ai\d*$/i.test(token));
}

export function supportRelevanceScore(primary: SourceRecord, candidate: SourceRecord, question: string): number {
  const shared = sharedTopicTokens(primary, candidate);
  const meaningful = meaningfulOverlap(shared);
  let score = meaningful.length * 18;
  const qTokens = topicTokens(question);
  const cTokens = topicTokens(`${candidate.title} ${candidate.summary}`);
  for (const token of qTokens) if (cTokens.has(token)) score += 8;
  const role = classifySourceRole(primary, candidate);
  if (role === "PRODUCT_DOC") score += 22;
  if (role === "COUNTERPOINT") score += 12;
  if (/gemini|tasks|chat|agent|workflow|approval|confirm/.test(`${candidate.title} ${candidate.summary}`.toLowerCase())
    && /gemini|tasks|chat|agent|workflow/.test(`${primary.title} ${primary.summary}`.toLowerCase())) {
    score += 16;
  }
  if (candidate.publisher.toLowerCase() === primary.publisher.toLowerCase() && role !== "PRODUCT_DOC") score -= 8;
  return score;
}

/**
 * True when the candidate materially helps answer the same reader-facing question.
 * Shared generic "AI / human / security" words alone are not enough.
 */
export function isDirectlyRelevantSupport(
  primary: SourceRecord,
  candidate: SourceRecord,
  question = researchQuestionFor(primary),
): boolean {
  if (candidate.canonicalUrl === primary.canonicalUrl) return false;
  if (candidate.evergreen) return false;
  if (isLowValueNews(candidate.title, candidate.summary)) return false;
  const shared = sharedTopicTokens(primary, candidate);
  const meaningful = meaningfulOverlap(shared);
  const score = supportRelevanceScore(primary, candidate, question);
  const role = classifySourceRole(primary, candidate);
  if (role === "PRODUCT_DOC" && meaningful.length >= 1) return true;
  if (meaningful.length >= 2 && score >= 36) return true;
  if (meaningful.length >= 1 && score >= 48) return true;
  // Same product family: gemini tasks ↔ gemini productivity docs / reporting
  const primaryText = `${primary.title} ${primary.summary}`.toLowerCase();
  const candidateText = `${candidate.title} ${candidate.summary}`.toLowerCase();
  if (/gemini/.test(primaryText) && /gemini/.test(candidateText) && /task/.test(primaryText) && /task|chat|agent|productivity|spark/.test(candidateText)) {
    return true;
  }
  if (/computer use|guardrail|human review|approval|confirm consequential/.test(candidateText)
    && /task|agent|workflow|spark|computer use/.test(primaryText)
    && score >= 30) {
    return true;
  }
  return false;
}

export function buildResearchBrief(
  primary: SourceRecord,
  research: readonly SourceRecord[],
  limit = 3,
): ResearchBrief {
  const question = researchQuestionFor(primary);
  const rejected: ResearchBrief["rejected"] = [];
  const supports: ResearchBrief["supports"] = [];
  for (const item of research) {
    if (item.canonicalUrl === primary.canonicalUrl) continue;
    if (item.evergreen) continue;
    if (!isDirectlyRelevantSupport(primary, item, question)) {
      if (!isLowValueNews(item.title, item.summary)) {
        rejected.push({ source: item, reason: "weak or off-topic for the editorial question" });
      }
      continue;
    }
    supports.push({
      source: item,
      role: classifySourceRole(primary, item),
      score: supportRelevanceScore(primary, item, question),
    });
  }
  supports.sort((a, b) => b.score - a.score || b.source.relevance - a.source.relevance);
  return {
    question,
    primary,
    supports: supports.slice(0, limit),
    rejected,
  };
}

export function supportingSourcesRelevant(primary: SourceRecord, research: readonly SourceRecord[], limit = 3): SourceRecord[] {
  return buildResearchBrief(primary, research, limit).supports.map((item) => item.source);
}

/** Whether this primary can sustain a researched Atlas article (not a slot filler). */
export function canSustainResearchedArticle(primary: SourceRecord, research: readonly SourceRecord[]): boolean {
  if (primary.evergreen) return true;
  if (isLowValueNews(primary.title, primary.summary)) return false;
  if (researchQuestionFor(primary).trim().length < 12) return false;
  if (isAuthoritativePublisher(primary.publisher) && primary.relevance >= 18) return true;
  const supports = supportingSourcesRelevant(primary, research, 3);
  if (supports.length >= 1) return true;
  if (primary.relevance >= 50 && !isLowValueNews(primary.title, primary.summary)) return true;
  return false;
}

export function hasResearchSynthesis(body: string): boolean {
  const opens = (body.match(/が[^。\n]{0,40}公開した/g) ?? []).length;
  if (opens <= 1) return true;
  return /あわせて|共通|一方|制限|途中|確認前|製品案内|関連公開|同じ変化|ここまで/.test(body);
}

export function weakSupportingUrls(
  primary: SourceRecord,
  urls: readonly string[],
  research: readonly SourceRecord[],
): string[] {
  const question = researchQuestionFor(primary);
  const weak: string[] = [];
  for (const url of urls) {
    if (url === primary.canonicalUrl) continue;
    const found = research.find((item) => item.canonicalUrl === url || item.url === url);
    if (!found) continue;
    if (!isDirectlyRelevantSupport(primary, found, question)) weak.push(url);
  }
  return weak;
}
