import fs from "node:fs";
import { agentCliExists } from "../atlas-agent/cursor-cli";
import { buildResearchContext, loadReferenceReports } from "./context";
import { blockingEntry, findHistory, type loadHistory } from "./memory";
import { runReadOnlyAgent } from "./read-only-agent";
import { isSameIdea, OVERALL_WEIGHTS, rankCandidates, SUMMARY_GROUPS } from "./scoring";
import {
  candidateSchema,
  CRITERIA,
  CRITERION_LABELS,
  researchOutputSchema,
  scoringOutputSchema,
  type Candidate,
  type ScoreSheet,
  type ScoredCandidate,
} from "./types";

const AGENT_TIMEOUT_MS = 15 * 60 * 1000;
const TARGET_CANDIDATES = 5;
const REQUESTED_CANDIDATES = 6;

export type ResearchResult = {
  candidates: ScoredCandidate[];
  filtered: { id: string; name: string; reason: string }[];
  researchSource: "research-agent" | "reference-library";
  scoringSource: "scoring-agent" | "reference-library";
  notes: string[];
  agentCommands: string[];
};

type Pool = { candidate: Candidate; source: ScoredCandidate["source"] }[];

export async function researchAndScore(input: {
  runId: string;
  history: ReturnType<typeof loadHistory>;
  reportDir: string;
  offline: boolean;
}): Promise<ResearchResult> {
  const notes: string[] = [];
  const agentCommands: string[] = [];
  const filtered: ResearchResult["filtered"] = [];
  const context = buildResearchContext(input.history, input.runId);
  const contextPath = `${input.reportDir}/research-context.json`;
  fs.mkdirSync(input.reportDir, { recursive: true });
  fs.writeFileSync(contextPath, `${JSON.stringify(context, null, 2)}\n`);

  const useAgents = !input.offline && agentCliExists();
  if (input.offline) notes.push("Offline mode: used the reference library instead of the Research and Scoring agents.");
  else if (!useAgents) notes.push("Cursor Agent CLI not found: used the reference library.");

  let pool: Pool = [];
  let researchSource: ResearchResult["researchSource"] = "reference-library";
  if (useAgents) {
    try {
      console.log("Research Agent: proposing Premium Blueprint candidates (read-only Cursor Agent session)...");
      const promptPath = `${input.reportDir}/research-prompt.txt`;
      fs.writeFileSync(promptPath, researchPrompt(contextPath));
      const { json, command } = await runReadOnlyAgent({
        role: "research",
        label: "Research Agent",
        promptPath,
        outputPath: `${input.reportDir}/research-output.txt`,
        timeoutMs: AGENT_TIMEOUT_MS,
      });
      agentCommands.push(command);
      const parsed = researchOutputSchema.parse(json);
      for (const [index, raw] of parsed.candidates.entries()) {
        const result = candidateSchema.safeParse(raw);
        if (result.success) pool.push({ candidate: result.data, source: "research-agent" });
        else {
          const name = (raw as { name?: string })?.name ?? `candidate ${index + 1}`;
          filtered.push({ id: `invalid-${index + 1}`, name, reason: "Research output was missing required fields." });
        }
      }
      researchSource = "research-agent";
      console.log(`Research Agent returned ${pool.length} valid candidate(s).`);
    } catch (error) {
      notes.push(`Research Agent failed, so the reference library was used: ${message(error)}`);
      pool = [];
    }
  }

  pool = dedupe(pool, input.history, filtered);
  const reference = referencePool();
  if (researchSource === "reference-library") {
    pool = dedupe(reference.map(({ candidate }) => ({ candidate, source: "reference-library" as const })), input.history, filtered);
  } else if (pool.length < 3) {
    const topUp = dedupe(
      [...pool, ...reference.map(({ candidate }) => ({ candidate, source: "reference-library" as const }))],
      input.history,
      [],
    ).slice(pool.length);
    if (topUp.length > 0) notes.push(`Added ${topUp.length} reference candidate(s) because research returned fewer than 3 new ideas.`);
    pool = [...pool, ...topUp];
  }
  if (pool.length === 0) {
    throw new Error("No candidates remain after removing rejected, completed, built, and approved ideas.");
  }

  let sheets = new Map<string, ScoreSheet>();
  let scoringSource: ResearchResult["scoringSource"] = "reference-library";
  if (researchSource === "research-agent") {
    try {
      console.log(`Scoring Agent: scoring ${pool.length} candidate(s) in a separate read-only session...`);
      const promptPath = `${input.reportDir}/scoring-prompt.txt`;
      fs.writeFileSync(promptPath, scoringPrompt(pool.map((entry) => entry.candidate)));
      const { json, command } = await runReadOnlyAgent({
        role: "scoring",
        label: "Scoring Agent",
        promptPath,
        outputPath: `${input.reportDir}/scoring-output.txt`,
        timeoutMs: AGENT_TIMEOUT_MS,
      });
      agentCommands.push(command);
      const parsed = scoringOutputSchema.parse(json);
      sheets = new Map(parsed.scores.map((sheet) => [sheet.candidate_id, sheet]));
      const unscored = pool.filter((entry) => !hasAllCriteria(sheets.get(entry.candidate.id)));
      if (unscored.length > 0) {
        for (const entry of unscored) {
          filtered.push({ id: entry.candidate.id, name: entry.candidate.name, reason: "Scoring Agent did not score every criterion." });
        }
        pool = pool.filter((entry) => !unscored.includes(entry));
      }
      if (pool.length === 0) throw new Error("Scoring Agent did not return a complete score sheet for any candidate.");
      scoringSource = "scoring-agent";
    } catch (error) {
      notes.push(`Scoring Agent failed, so the reference library was used for candidates and scores: ${message(error)}`);
      researchSource = "reference-library";
      pool = dedupe(reference.map(({ candidate }) => ({ candidate, source: "reference-library" as const })), input.history, []);
      sheets = new Map();
    }
  }
  if (scoringSource === "reference-library") {
    for (const entry of reference) sheets.set(entry.candidate.id, entry.sheet);
  }

  const ranked = rankCandidates(
    pool.map(({ candidate, source }) => ({
      candidate,
      sheet: sheets.get(candidate.id)!,
      historyStatus: findHistory(input.history, candidate)?.status ?? null,
      source,
    })),
  );
  for (const extra of ranked.slice(TARGET_CANDIDATES)) {
    filtered.push({ id: extra.id, name: extra.name, reason: `Ranked ${extra.rank}; only the top ${TARGET_CANDIDATES} are shown.` });
  }
  return {
    candidates: ranked.slice(0, TARGET_CANDIDATES),
    filtered,
    researchSource,
    scoringSource,
    notes,
    agentCommands,
  };
}

function dedupe(pool: Pool, history: ReturnType<typeof loadHistory>, filtered: ResearchResult["filtered"]): Pool {
  const kept: Pool = [];
  for (const entry of pool) {
    const blocked = blockingEntry(history, entry.candidate);
    if (blocked) {
      filtered.push({ id: entry.candidate.id, name: entry.candidate.name, reason: `Matches ${blocked.name} (${blocked.status}) in history.` });
      continue;
    }
    const twin = kept.find((other) => isSameIdea(other.candidate, entry.candidate));
    if (twin) {
      filtered.push({ id: entry.candidate.id, name: entry.candidate.name, reason: `Duplicate of ${twin.candidate.name} in this run.` });
      continue;
    }
    kept.push(entry);
  }
  return kept;
}

function referencePool(): { candidate: Candidate; sheet: ScoreSheet }[] {
  const seen = new Set<string>();
  const pool: { candidate: Candidate; sheet: ScoreSheet }[] = [];
  for (const { report } of loadReferenceReports().reverse()) {
    for (const raw of report.candidates) {
      const parsed = candidateSchema.safeParse(raw);
      if (!parsed.success || seen.has(parsed.data.id)) continue;
      seen.add(parsed.data.id);
      pool.push({
        candidate: parsed.data,
        sheet: {
          candidate_id: parsed.data.id,
          criteria: raw.criteria,
          rationale: raw.rationale ?? {},
          summary: raw.score_summary ?? `Scores from ${report.title}.`,
        },
      });
    }
  }
  return pool.filter((entry) => hasAllCriteria(entry.sheet));
}

function hasAllCriteria(sheet: ScoreSheet | undefined): sheet is ScoreSheet {
  return Boolean(sheet) && CRITERIA.every((key) => typeof sheet!.criteria[key] === "number");
}

function researchPrompt(contextPath: string): string {
  return [
    "You are the Atlas Research Agent. Follow agents/research.md and agents/standards.md.",
    "This is a read-only session. Inspect files. Do not edit, create, or delete anything.",
    "",
    "GOAL",
    `Propose ${REQUESTED_CANDIDATES} strong Premium Blueprint candidates for small and medium businesses (SMBs).`,
    "A separate Scoring Agent will score them. Do not score or rank them yourself.",
    "",
    "INSPECT FIRST",
    `- ${contextPath}: the current catalog digest, completed Blueprints, Premium materials, previous reports, previous runs, and candidate history.`,
    "- src/lib/blueprints.ts: the Blueprint catalog and access model.",
    "- agent-specs/daily-inbox-briefing.json: the completed free Daily Inbox Briefing. Treat it as the quality bar and do not duplicate it.",
    "- content/published/use-cases/*.json: the published catalog. Candidates may deepen a catalog use case into a Premium Blueprint.",
    "- app/playbooks/ and public/downloads/: existing Premium-style material.",
    "",
    "RULES",
    "- Do not propose anything in excluded_candidates (APPROVED, REJECTED, BUILT, COMPLETED) or a close variation of it.",
    "- Candidates in on_hold_candidates may return only if still strong. Reuse the same id.",
    "- Previous reports are references, not rankings. Do not assume an earlier winner is still the winner.",
    "- At least two candidates must not appear in any previous report.",
    "- Do not propose another daily or weekly briefing that overlaps the Daily Inbox Briefing.",
    "- Avoid ideas that are only 'paste text into ChatGPT and ask for a summary'. Premium must justify being Premium: decision rules, structured inputs, a review step, and a measurable before/after.",
    "- The first version must work with exports, uploads, or read-only access. No automatic sending, no edits to external systems, no live payments.",
    "- Sample input and sample output must be fictional and must say nothing that implies real customer data.",
    "- Do not invent statistics, savings, or ROI. Value estimates are perception ranges, not prices.",
    "- Do not include secrets, email addresses, or real personal data.",
    "",
    "OUTPUT",
    "Print one JSON object and no other text:",
    JSON.stringify(
      {
        schema_version: "atlas-research-v1",
        candidates: [
          {
            id: "kebab-case-id",
            name: "Blueprint name",
            persona: "Target SMB persona, specific enough to picture",
            problem: "The recurring business problem",
            workflow: ["Step 1", "Step 2", "Step 3", "Step 4"],
            before: "What the owner does today without it",
            after: "What changes after using it",
            required_data_tools: ["Data export or tool", "..."],
            why_pay: "Why someone would pay for this rather than a free prompt",
            setup_difficulty: "EASY | MODERATE | HARD",
            automation_potential: "LOW | MEDIUM | HIGH",
            human_oversight: "LOW | MEDIUM | HIGH",
            major_risks: ["Risk", "..."],
            estimated_premium_value: "Perceived value range and what it is anchored to",
            sample_input: "A short fictional input (a few lines of a CSV, a request, etc.)",
            sample_output: "The mock result the Blueprint would produce from that input, with confirmed facts separated from AI interpretation",
            guided_demo: "What the public guided demo would show, step by step",
            related_catalog_slugs: ["catalog-slug"],
            novelty_note: "How this differs from existing Atlas Blueprints and from a generic chatbot",
          },
        ],
      },
      null,
      2,
    ),
  ].join("\n");
}

function scoringPrompt(candidates: Candidate[]): string {
  const rubric: Record<string, string> = {
    smb_value: "How much a typical target SMB gains in money or time when it works.",
    willingness_to_pay: "How likely the persona is to pay for a Premium Blueprint for this.",
    frequency: "How often the workflow runs (daily 9-10, weekly 7-8, monthly 5-6, yearly 1-3).",
    time_to_value: "How quickly a first-time user gets a useful result.",
    setup_simplicity: "How easy the first setup is (exports only = high, multiple OAuth connectors = low).",
    demonstrability: "How clearly a guided demo with fictional data shows the value.",
    ai_literacy_value: "How much the user learns about using AI responsibly (verification, limits, human judgment).",
    differentiation: "How hard it is to get the same result from a generic chatbot prompt or an existing Atlas Blueprint.",
    automation_potential: "How far the workflow can later be automated safely.",
    testability: "How well Atlas can test it deterministically with fictional data and browser tests.",
    permission_simplicity: "How few and how low-risk the permissions are (read-only exports = high, send/write/payment access = low).",
    smb_breadth: "How many kinds of SMBs can use it.",
    workflow_quality: "How concrete, ordered, and reviewable the workflow is, including the human decision points.",
  };
  return [
    "You are the Atlas Scoring Agent. You are not the Research Agent and you do not share its reasoning.",
    "This is a read-only session. Do not edit, create, or delete any file.",
    "Follow agents/research.md (scoring section) and agents/standards.md.",
    "",
    "Score every candidate below on every criterion from 1.0 to 10.0. Be critical and use the full range. 9 or 10 must be rare and earned.",
    "Penalize unsupported savings claims, risky permissions, automatic external actions, and ideas a generic chatbot already does well.",
    "Give each criterion a one-sentence rationale grounded in the candidate text.",
    "Do not compute weighted totals. The orchestrator computes summary scores.",
    "",
    "CRITERIA",
    ...CRITERIA.map((key) => `- ${key} (${CRITERION_LABELS[key]}): ${rubric[key]}`),
    "",
    "For reference, the orchestrator will compute:",
    `- Commercial = mean(${SUMMARY_GROUPS.commercial.join(", ")})`,
    `- Atlas Fit = mean(${SUMMARY_GROUPS.atlas_fit.join(", ")})`,
    `- Buildability = mean(${SUMMARY_GROUPS.buildability.join(", ")})`,
    `- Overall = ${OVERALL_WEIGHTS.commercial} x Commercial + ${OVERALL_WEIGHTS.atlas_fit} x Atlas Fit + ${OVERALL_WEIGHTS.buildability} x Buildability + ${OVERALL_WEIGHTS.time_to_value} x time_to_value`,
    "",
    "OUTPUT",
    "Print one JSON object and no other text:",
    JSON.stringify(
      {
        schema_version: "atlas-scoring-v1",
        scores: [
          {
            candidate_id: "candidate id",
            criteria: Object.fromEntries(CRITERIA.map((key) => [key, 7.0])),
            rationale: Object.fromEntries(CRITERIA.map((key) => [key, "One sentence."])),
            summary: "Two sentences on the main strength and the main weakness.",
          },
        ],
      },
      null,
      2,
    ),
    "",
    "CANDIDATES",
    JSON.stringify(candidates, null, 2),
  ].join("\n");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
