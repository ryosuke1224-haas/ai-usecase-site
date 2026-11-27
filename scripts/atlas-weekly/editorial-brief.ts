import { z } from "zod";
import { sensitiveEditorialText } from "./editorial-safety";
import { readFileSync, readdirSync, lstatSync } from "node:fs";
import path from "node:path";
import { describeSource } from "./editorial";
import { canSustainResearchedArticle, type ResearchBrief } from "./research-depth";
import type { EditorialType, ResearchReport, SourceRecord, WeeklyCategory } from "./types";

const depth = {
  news: { industryContext: "Explain a relevant industry precedent or comparison.", businessImplications: "Explain who gains leverage or faces a trade-off.", originalAnalysis: "Draw a specific inference from the evidence.", limitations: "Identify what the evidence leaves open." },
  "practical-tip": { mechanism: "Explain how the technique works.", applicability: "Describe when it helps and when it does not.", implementation: "Give a concrete example and implementation guidance.", verification: "Explain how to measure the result and avoid a common mistake; cite costs or benefits only if supported." },
  "enterprise-strategy": { organizationalProblem: "Explain the underlying organizational problem.", operatingModel: "Describe a realistic operating model and ownership.", validation: "Explain how to validate results.", tradeoffs: "Explain an implementation trade-off." },
  "field-note": { symptom: "State what was actually observed.", rootCause: "Explain the diagnosed root cause.", verifiedFix: "Explain the fix and how it was verified.", implementation: "Give safe commands or concrete implementation details and a lesson." },
} satisfies Record<EditorialType, Record<string, string>>;

const profiles = {
  news: {
    category: "ai-news",
    reader: "Business and technology readers following a specific development",
    direction: "Explain what changed, who gains leverage or faces a trade-off, and what would substantiate that interpretation. Use a comparison only when it illuminates this development.",
    question: "What changed for the organizations or users involved, and what does the evidence establish about why that change matters?",
    gap: "Look for the scope of the announcement, industry precedents, independent outcomes, and evidence for any claimed effect.",
  },
  "practical-tip": {
    category: "practical-ai",
    reader: "Practitioners deciding when to use a technique",
    direction: "Teach the technique, its prerequisites and limits, and how to tell if it helps. Use an example only if it clarifies a real choice.",
    question: "Under which conditions does the technique help, and how can a practitioner check the result?",
    gap: "Look for applicable products, prerequisites, trade-offs and an observable way to verify the result.",
  },
  "enterprise-strategy": {
    category: "practical-ai",
    reader: "Analytics, operations, and technology leaders designing repeatable work",
    direction: "Develop the organizational problem, the operating choice, and the trade-offs or failure modes. Distinguish a proposed operating model from observed outcomes.",
    question: "Which organizational practice makes the result reliable and reusable, and who has to own it?",
    gap: "Look for the baseline, decisions, ownership, validation evidence, and conditions under which the approach breaks.",
  },
  "field-note": {
    category: "technical",
    reader: "Beginners and practitioners diagnosing a real implementation problem",
    direction: "Connect the observed symptom to the cause and verified fix. Distinguish the original incident, a reproduction, and a test of the fix.",
    question: "Which observable boundary explains the failure, and what verification isolates it?",
    gap: "Look for the exact symptom, isolated reproduction, verified behavior, and remaining uncertainty.",
  },
} satisfies Record<EditorialType, { category: WeeklyCategory; reader: string; direction: string; question: string; gap: string }>;

export function editorialTypeFor(source: SourceRecord): EditorialType {
  return source.editorialType ?? (source.evergreen ? "practical-tip"
    : describeSource(source).focus === "enterprise" ? "enterprise-strategy" : "news");
}

export function prepareEditorialBrief(research: ResearchBrief, pool: readonly SourceRecord[], report?: ResearchReport) {
  const { primary, supports, question } = research;
  const articleType = editorialTypeFor(primary);
  const profile = profiles[articleType];
  const sports = articleType === "news" && /\b(?:sports|basketball|arena|warriors)\b/i.test(`${primary.title} ${primary.summary}`);
  const centralQuestion = sports
    ? "What does the announced deployment reveal about where a sports organization sees value in AI, and what evidence would show whether that value materializes?"
    : articleType === "news" || articleType === "field-note"
    ? `${profile.question} Topic: ${primary.title}`
    : `${profile.question} Topic: ${primary.title}${primary.evergreen ? "" : ` Research lead: ${question}`}`;
  const thesis = sports
    ? "A partnership announcement can show which touchpoints a team and vendor are prioritizing. Separate that strategic signal from evidence of fan adoption, operating gains, or commercial impact."
    : primary.internal ? primary.implication : "Develop a specific, defensible thesis from the recorded facts. Reject the topic if those facts only support an announcement recap.";
  return {
    articleType,
    category: profile.category,
    targetReader: profile.reader,
    centralQuestion,
    whyItMatters: primary.internal ? primary.implication : `${primary.title}: ${profile.question}`,
    workingThesis: thesis,
    verifiedFacts: [{ url: primary.internal ? null : primary.canonicalUrl, publisher: primary.publisher, excerpt: primary.summary }],
    supportingEvidence: supports.map(({ source, role }) => ({ url: source.canonicalUrl, publisher: source.publisher, role })),
    limitations: [
      primary.internal ? "Curated excerpts from owner-authored notes. No external citation or independent verification."
        : "Publisher attribution is verified against the package. Excerpts do not independently verify claimed outcomes.",
      ...(report?.limitations ?? ["No separate live research was recorded."]),
    ],
    additionalInformationNeeded: profile.gap,
    readerWillLearn: profile.question,
    suggestedDirection: profile.direction,
    depthRequirements: report ? depth[articleType] : undefined,
    reviewQuestions: [
      "Does the article offer an original insight that the evidence supports?",
      "Does it answer the question the target reader came for, with sufficient depth and a clear structure?",
      profile.direction,
    ],
    rejection: primary.summary.trim().length < 40 || !canSustainResearchedArticle(primary, pool)
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
