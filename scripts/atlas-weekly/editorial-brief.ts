import { z } from "zod";
import { sensitiveEditorialText } from "./editorial-safety";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import path from "node:path";
import { describeSource } from "./editorial";
import { canSustainResearchedArticle, type ResearchBrief } from "./research-depth";
import type { EditorialType, ResearchReport, SourceRecord, WeeklyCategory } from "./types";

const categories: Record<EditorialType, WeeklyCategory> = {
  news: "ai-news", "practical-tip": "practical-ai", "enterprise-strategy": "practical-ai", "field-note": "technical",
};

export function editorialTypeFor(source: SourceRecord): EditorialType {
  return source.editorialType ?? (source.evergreen ? "practical-tip"
    : describeSource(source).focus === "enterprise" ? "enterprise-strategy" : "news");
}

export function prepareEditorialBrief(research: ResearchBrief, pool: readonly SourceRecord[], report?: ResearchReport) {
  const { primary, supports, question } = research;
  const articleType = editorialTypeFor(primary);
  return {
    articleType,
    category: categories[articleType],
    centralQuestion: primary.editorialPlan?.question ?? question,
    readerValue: primary.editorialPlan?.readerValue ?? primary.implication,
    supportingEvidence: supports.map(({ source, role }) => ({ url: source.canonicalUrl, publisher: source.publisher, role })),
    limitations: [
      primary.internal ? "Curated note evidence; no independent verification."
        : "Distinguish what sources establish from their claims and your own analysis.",
      ...(report?.limitations ?? ["No separate live research was recorded."]),
    ],
    rejection: primary.summary.trim().length < 40 || (!primary.editorialPlan && !canSustainResearchedArticle(primary, pool))
      ? "Insufficient relevant evidence for a substantive article."
      : report && !primary.internal && !report.sources.length && !primary.evergreen
        ? "No independently fetched supporting page. Article deferred rather than written from feeds alone." : null,
  };
}

const noteMetadata = z.object({
  topic: z.string().trim().min(8).max(180),
  editorialType: z.enum(["news", "practical-tip", "enterprise-strategy", "field-note"]),
  tags: z.array(z.string().max(40)).max(12),
  publicationEligible: z.boolean(),
  reviewStatus: z.enum(["pending", "approved", "rejected"]),
  publicEvidence: z.string().trim().min(120).max(6000),
  lesson: z.string().trim().min(30).max(600),
}).strict();

export function fieldNoteSources(root: string, retrievedAt: string, preview = false): SourceRecord[] {
  const dir = path.join(root, "atlas-memory", "field-notes");
  const sources: SourceRecord[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !/^[a-z0-9][a-z0-9-]*\.md$/i.test(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (lstatSync(file).size > 128_000) continue;
      const frontmatter = /^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/.exec(readFileSync(file, "utf8"));
      if (!frontmatter) continue;
      let parsed;
      try { parsed = noteMetadata.safeParse(JSON.parse(frontmatter[1])); } catch { continue; }
      if (!parsed.success || parsed.data.reviewStatus === "rejected" || (!preview && parsed.data.reviewStatus !== "approved")) continue;
      const { topic, editorialType, publicationEligible, publicEvidence, lesson, tags, reviewStatus } = parsed.data;
      if (sensitiveEditorialText([topic, publicEvidence, lesson, ...tags].join("\n"))) continue;
      const id = "atlas-note:" + entry.name;
      sources.push({
        url: id, canonicalUrl: id, title: topic, editorialType, summary: publicEvidence, implication: lesson,
        publicationEligible: publicationEligible && reviewStatus === "approved", tags,
        internal: true, evergreen: true, relevance: 45,
        retrievedAt, publisher: "Atlas editorial notes", publishedAt: null,
      });
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return sources;
}
