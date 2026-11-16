import type { BlueprintCandidate, BlogDraft, NewsletterDraft, QaDecision, SourceRecord } from "./types";

const STALE_MS = 21 * 24 * 60 * 60 * 1000;
const CLAIM = /(\d+(?:\.\d+)?\s?(?:%|％|\$|usd|jpy|円))/i;

export function tokens(value: string): Set<string> {
  return new Set(value.toLowerCase().split(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]+/).filter((token) => token.length > 3));
}

export function nearDuplicate(left: string, right: string): boolean {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return false;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size) >= 0.72;
}

function unsupported(body: string, source: string): boolean {
  const claims = body.match(new RegExp(CLAIM, "gi")) ?? [];
  return claims.some((claim) => !source.toLowerCase().includes(claim.toLowerCase()));
}

function storyProblems(source: SourceRecord | undefined, now: Date, seen: Set<string>): string[] {
  const reasons: string[] = [];
  if (!source) return ["missing source"];
  if (!source.canonicalUrl.startsWith("https://")) reasons.push("source is not https");
  if (!source.publishedAt || Number.isNaN(Date.parse(source.publishedAt))) reasons.push("missing publish date");
  else if (now.getTime() - Date.parse(source.publishedAt) > STALE_MS) reasons.push("stale story");
  if (source.summary.trim().length < 40) reasons.push("summary is too short");
  if (seen.has(source.canonicalUrl)) reasons.push("duplicate source");
  return reasons;
}

export function reviewItems(input: {
  now: Date;
  sources: readonly SourceRecord[];
  blogs: readonly BlogDraft[];
  newsletter: NewsletterDraft | null;
  blueprints: readonly BlueprintCandidate[];
  knownUrls: readonly string[];
  knownSlugs: readonly string[];
  knownTitles: readonly string[];
}): QaDecision[] {
  const byUrl = new Map(input.sources.map((source) => [source.canonicalUrl, source]));
  const seen = new Set(input.knownUrls);
  const decisions: QaDecision[] = [];

  for (const blog of input.blogs) {
    const source = byUrl.get(blog.canonicalUrl);
    const reasons = storyProblems(source, input.now, seen);
    if (source && unsupported(blog.body, source.summary)) reasons.push("unsupported claim");
    for (const slug of blog.relatedBlueprints) {
      if (!input.knownSlugs.includes(slug)) reasons.push(`unknown blueprint ${slug}`);
    }
    const pass = reasons.length === 0;
    if (pass && source) seen.add(source.canonicalUrl);
    decisions.push({ kind: "blog", slug: blog.slug, pass, reasons });
  }

  const passingUrls = new Set(
    input.blogs.filter((blog) => decisions.find((item) => item.slug === blog.slug && item.pass)).map((blog) => blog.canonicalUrl),
  );
  if (input.newsletter) {
    const reasons: string[] = [];
    if (input.newsletter.sourceUrls.length === 0) reasons.push("newsletter has no sources");
    if (input.newsletter.sourceUrls.every((url) => !passingUrls.has(url))) reasons.push("newsletter stories did not pass");
    decisions.push({ kind: "newsletter", slug: input.newsletter.slug, pass: reasons.length === 0, reasons });
  }

  for (const candidate of input.blueprints) {
    const source = byUrl.get(candidate.canonicalUrl);
    const reasons = storyProblems(source, input.now, new Set(input.knownUrls));
    if (candidate.recommendation === "skip") reasons.push("skip recommendation");
    if (candidate.relatedSlug && !input.knownSlugs.includes(candidate.relatedSlug)) reasons.push("unknown related product");
    if (input.knownTitles.some((title) => nearDuplicate(title, candidate.enTitle) || nearDuplicate(title, candidate.jaTitle))) {
      reasons.push("near-duplicate blueprint");
    }
    decisions.push({ kind: "blueprint", slug: candidate.slug, pass: reasons.length === 0, reasons });
  }

  return decisions;
}
