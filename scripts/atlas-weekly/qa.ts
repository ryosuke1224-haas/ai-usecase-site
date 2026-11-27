import { editorialFailures, hasFabricatedFirstPerson, hasMetaEditorialLanguage, paraphrasesSource, titleRepeatsSource } from "./editorial";
import { isAuthoritativePublisher, normalizeClaim, quantitativeClaims, supportingSourcesRelevant } from "./research-depth";
import { tipByUrl } from "./tips";
import { sensitiveEditorialText } from "./editorial-safety";
import type { BlueprintCandidate, BlogDraft, NewsletterDraft, QaDecision, SourceRecord } from "./types";

const STALE_MS = 21 * 24 * 60 * 60 * 1000;

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

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function unsupported(body: string, source: string): boolean {
  const claims = quantitativeClaims(body);
  const supported = new Set(quantitativeClaims(source).map(normalizeClaim));
  return claims.some((claim) => !supported.has(normalizeClaim(claim)));
}

function storyProblems(source: SourceRecord | undefined, now: Date, seen: Set<string>): string[] {
  const reasons: string[] = [];
  if (!source) return ["missing source"];
  if (!source.canonicalUrl.startsWith("https://") && !(source.internal && source.canonicalUrl.startsWith("atlas-note:"))) {
    reasons.push("source is not https");
  }
  if (!source.evergreen) {
    if (!source.publishedAt || Number.isNaN(Date.parse(source.publishedAt))) reasons.push("missing publish date");
    else if (now.getTime() - Date.parse(source.publishedAt) > STALE_MS) reasons.push("stale story");
  }
  if (source.summary.trim().length < 40) reasons.push("summary is too short");
  if (seen.has(source.canonicalUrl)) reasons.push("duplicate source");
  return reasons;
}

function sectionAfter(body: string, heading: string): string {
  const match = body.match(new RegExp(`##\\s*${heading}\\s*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`));
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

export type BlogTopicSignals = {
  title: string;
  thesis: string;
  takeaway: string;
  work: string;
};

/** Reader-facing signals used to spot same-topic blogs inside one edition. */
export function blogTopicSignals(blog: Pick<BlogDraft, "title" | "summary" | "body">): BlogTopicSignals {
  const thesis = blog.summary.trim() || blog.body.split(/\n{2,}/)[0]?.trim() || "";
  return {
    title: blog.title.trim(),
    thesis,
    takeaway: sectionAfter(blog.body, "明日試すなら"),
    work: sectionAfter(blog.body, "仕事でどう使える？") || sectionAfter(blog.body, "仕事で変わること"),
  };
}

/** True when two blogs would read as the same weekly topic for the owner. */
export function overlappingBlogTopics(
  left: Pick<BlogDraft, "title" | "summary" | "body">,
  right: Pick<BlogDraft, "title" | "summary" | "body">,
): boolean {
  const a = blogTopicSignals(left);
  const b = blogTopicSignals(right);
  if (!a.title || !b.title) return false;
  if (normalizeText(a.title) === normalizeText(b.title)) return true;
  if (nearDuplicate(a.title, b.title)) return true;
  if (a.thesis && b.thesis && (normalizeText(a.thesis) === normalizeText(b.thesis) || nearDuplicate(a.thesis, b.thesis))) {
    return true;
  }
  if (a.takeaway && b.takeaway && (normalizeText(a.takeaway) === normalizeText(b.takeaway) || nearDuplicate(a.takeaway, b.takeaway))) {
    return true;
  }
  if (a.work && b.work && (normalizeText(a.work) === normalizeText(b.work) || nearDuplicate(a.work, b.work))) {
    return true;
  }
  return false;
}

/** Higher score wins when two candidate blogs cover the same topic. */
export function blogTopicStrength(blog: BlogDraft, source?: SourceRecord): number {
  let score = source?.relevance ?? 0;
  if (source && isAuthoritativePublisher(source.publisher)) score += 18;
  if (blog.editorialType) return score;
  // Prefer synthesis and judgment over raw source count or length padding.
  if (/あわせて|共通|一方|制限|途中確認/.test(blog.body)) score += 16;
  score += Math.min(blog.sourceUrls.length, 2) * 6;
  score += Math.min(Math.floor(blog.body.trim().length / 80), 12);
  if (blog.relatedBlueprints.length > 0) score += 10;
  if (/仕事|営業|サポート|担当|管理|経理|顧客|手順/.test(blog.body)) score += 6;
  if (/明日試すなら/.test(blog.body) && sectionAfter(blog.body, "明日試すなら").length >= 40) score += 8;
  if (/Atlasの見方/.test(blog.body) && /今試し|待ちます|向いて/.test(blog.body)) score += 8;
  return score;
}

function typedEditorialFailures(blog: BlogDraft, source: SourceRecord, research: readonly SourceRecord[]): string[] {
  const text = [blog.title, blog.summary, blog.body, blog.editorialTakeaway ?? ""].join("\n");
  const support = source.internal ? [] : supportingSourcesRelevant(source, research);
  const allowed = new Set([source.canonicalUrl, ...support.map((item) => item.canonicalUrl),
    ...(tipByUrl(source.canonicalUrl)?.sourceUrls ?? [])]);
  const links = [...blog.body.matchAll(/\]\((https:\/\/[^\s)]+)\)/g)].map((match) => match[1]);
  const reasons: string[] = [];
  if ((!source.internal && !blog.sourceUrls.includes(source.canonicalUrl)) || blog.sourceUrls.some((url) => !allowed.has(url) || url.startsWith("atlas-note:"))
      || links.some((url) => !blog.sourceUrls.includes(url))
      || (!source.internal && blog.sourceUrls.some((url) => !links.includes(url)))) reasons.push("unverified citation");
  if ([source, ...support.filter((item) => blog.sourceUrls.includes(item.canonicalUrl))]
    .some((item) => paraphrasesSource(blog.body, item, true))) reasons.push("source paraphrase");
  if (titleRepeatsSource(blog.title, source.title)) reasons.push("translated source title");
  if (hasFabricatedFirstPerson(text)) reasons.push("fabricated personal experience");
  if (hasMetaEditorialLanguage(text)) reasons.push("meta editorial language");
  if (sensitiveEditorialText(text) || /\b(?:PRIMARY_FACT|PRODUCT_DOC|SUPPORTING_EVIDENCE|COUNTERPOINT|CONTEXT)\b/.test(text)) {
    reasons.push("internal reference or possible credential");
  }
  const minimum = blog.editorialType === "practical-tip" ? 180 : 280;
  if (blog.body.trim().length < minimum || !blog.summary.trim() || !blog.editorialTakeaway?.trim()) {
    reasons.push("article too thin for editorial review");
  }
  if (blog.editorialType === "news" && !blog.body.includes(source.publisher)) reasons.push("missing news attribution");
  if (source.internal && !source.publicationEligible && !blog.internal) reasons.push("internal evidence must remain local");
  if (source.internal && !/Atlas/.test(blog.body)) reasons.push("missing editorial note attribution");
  return reasons;
}

function rejectWeakerDuplicateTopics(
  blogs: readonly BlogDraft[],
  byUrl: Map<string, SourceRecord>,
  decisions: QaDecision[],
): void {
  const bySlug = new Map(decisions.filter((item) => item.kind === "blog").map((item) => [item.slug, item]));
  const provisional = blogs
    .filter((blog) => bySlug.get(blog.slug)?.pass)
    .map((blog) => ({
      blog,
      source: byUrl.get(blog.canonicalUrl),
      strength: blogTopicStrength(blog, byUrl.get(blog.canonicalUrl)),
    }))
    .sort((left, right) => right.strength - left.strength || left.blog.slug.localeCompare(right.blog.slug));

  const kept: BlogDraft[] = [];
  for (const candidate of provisional) {
    const overlap = kept.find((item) => overlappingBlogTopics(item, candidate.blog));
    if (!overlap) {
      kept.push(candidate.blog);
      continue;
    }
    const decision = bySlug.get(candidate.blog.slug);
    if (!decision) continue;
    decision.pass = false;
    decision.reasons = [...decision.reasons, "duplicate topic"];
  }
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
  const publishers = new Set<string>();
  const decisions: QaDecision[] = [];

  for (const blog of input.blogs) {
    const source = byUrl.get(blog.canonicalUrl);
    const reasons = [
      ...storyProblems(source, input.now, seen),
      ...(source ? (blog.editorialType
        ? typedEditorialFailures(blog, source, input.sources)
        : editorialFailures(blog, source, input.sources)) : []),
    ];
    if (source && !source.internal && publishers.has(source.publisher.trim().toLowerCase())) reasons.push("publisher concentration");
    const citedEvidence = [
      ...(source?.internal ? [source.summary] : []),
      ...blog.sourceUrls.map((url) => input.sources.find((item) => item.canonicalUrl === url && item.supplementFor === blog.canonicalUrl)?.summary
        ?? byUrl.get(url)?.summary ?? ""),
    ].join("\n");
    if (source && unsupported([blog.title, blog.summary, blog.body].join("\n"), citedEvidence)) reasons.push("unsupported claim");
    if (input.knownTitles.some((title) =>
      normalizeText(title) === normalizeText(blog.title) || nearDuplicate(title, blog.title))) {
      reasons.push("near-duplicate article");
    }
    for (const slug of blog.relatedBlueprints) {
      if (!input.knownSlugs.includes(slug)) reasons.push(`unknown blueprint ${slug}`);
    }
    const pass = reasons.length === 0;
    if (pass && source) {
      seen.add(source.canonicalUrl);
      publishers.add(source.publisher.trim().toLowerCase());
    }
    decisions.push({ kind: "blog", slug: blog.slug, pass, reasons });
  }

  rejectWeakerDuplicateTopics(input.blogs, byUrl, decisions);

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
    if (candidate.workflow.trim().length < 12 || candidate.problem.trim().length < 20) reasons.push("missing workflow problem");
    if (/gateway|now available|利用可能/i.test(`${candidate.jaTitle} ${candidate.enTitle}`)) reasons.push("blueprint is not a workflow");
    if (candidate.relatedSlug && !input.knownSlugs.includes(candidate.relatedSlug)) reasons.push("unknown related product");
    if (input.knownTitles.some((title) => nearDuplicate(title, candidate.enTitle) || nearDuplicate(title, candidate.jaTitle))) {
      reasons.push("near-duplicate blueprint");
    }
    decisions.push({ kind: "blueprint", slug: candidate.slug, pass: reasons.length === 0, reasons });
  }

  return decisions;
}
