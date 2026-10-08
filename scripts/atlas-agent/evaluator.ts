import fs from "node:fs";
import path from "node:path";
import { cursorAgentLaunch, runCursorAgent } from "./cursor-cli";
import { redact, tail } from "./redact";
import type { AgentTask } from "./schema";
import { captureBaseline, changesSince, restoreFiles, restoreSecrets } from "./workspace";

const DIMENSIONS = [
  "clarity",
  "accuracy_and_grounding",
  "actionability",
  "smb_relevance",
  "ai_literacy_value",
  "safety",
  "setup_usability",
  "human_ai_boundary",
] as const;

export type ScoreDimension = (typeof DIMENSIONS)[number];

export type DimensionScore = {
  dimension: ScoreDimension;
  score: number;
  evidence: string[];
  issues: string[];
};

export type EvaluatorFinding = {
  finding_id: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string;
  description: string;
  evidence: string[];
  recommendation: string;
};

export type EvaluatorDecision = "PASS" | "PASS_WITH_RECOMMENDATIONS" | "HUMAN_REVIEW_REQUIRED";

export type EvaluatorReport = {
  schema_version: "atlas-evaluator-report-v1";
  task_id: string;
  evaluator_executor: "cursor-agent-cli";
  evaluated_files: string[];
  scores: DimensionScore[];
  overall_score: number;
  overall_score_basis: "evaluator" | "capped_for_critical_issue";
  setup_difficulty: "EASY" | "MODERATE" | "HARD";
  automation_potential: "LOW" | "MEDIUM" | "HIGH";
  human_oversight: "LOW" | "MEDIUM" | "HIGH";
  findings: EvaluatorFinding[];
  strengths: string[];
  recommended_improvements: string[];
  decision: EvaluatorDecision;
  decision_adjusted: boolean;
  timestamp: string;
};

export type EvaluatorHookResult = {
  schema_version: "atlas-evaluator-hook-v1";
  status: "executed" | "invalid_output" | "write_violation";
  reason: string;
  output_schema: "agents/evaluator-report.schema.json";
  qa_report: string;
  evaluation_file: string | null;
  evaluator_executor: "cursor-agent-cli";
  evaluator_command: string;
  separate_context: true;
  files_changed_by_evaluator: string[];
  decision: EvaluatorDecision | null;
  overall_score: number | null;
  scores: { dimension: ScoreDimension; score: number }[] | null;
  findings: { finding_id: string; severity: EvaluatorFinding["severity"]; description: string }[];
};

export function decideEvaluation(input: {
  overallScore: number;
  scores: { dimension: string; score: number }[];
  findings: { severity: string }[];
}): EvaluatorDecision {
  const critical = input.findings.some((finding) => finding.severity === "CRITICAL");
  const highOrCritical = input.findings.some(
    (finding) => finding.severity === "HIGH" || finding.severity === "CRITICAL",
  );
  const accuracy = scoreOf(input.scores, "accuracy_and_grounding");
  const safety = scoreOf(input.scores, "safety");
  if (input.overallScore < 7.5 || critical || accuracy < 7 || safety < 7) {
    return "HUMAN_REVIEW_REQUIRED";
  }
  if (input.overallScore >= 8.5 && !highOrCritical) return "PASS";
  if (input.overallScore >= 7.5 && !critical) return "PASS_WITH_RECOMMENDATIONS";
  return "HUMAN_REVIEW_REQUIRED";
}

export async function runEvaluator(input: {
  task: AgentTask;
  taskPath: string;
  qaReportPath: string;
  qaStatus: string;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  builderReportPath: string;
  gitDiffSummary: string;
  outputPath: string;
}): Promise<EvaluatorHookResult> {
  const outputPath = input.outputPath.replace(/\\/g, "/");
  const promptPath = path.join(path.dirname(outputPath), "evaluator-prompt.txt");
  const evaluatedFiles = evaluationFiles(input.task);
  const snapshot = captureBaseline();
  writeEvaluatorPrompt({ ...input, promptPath, evaluatedFiles });
  const assignment = [
    "You are the Atlas Evaluator, a new session separate from the Builder.",
    `Read and follow ${promptPath.replace(/\\/g, "/")}.`,
    "That file is the whole assignment. Do not resume a previous chat.",
    "Do not edit, create, or delete any file.",
    "Do not fix findings. Do not commit, push, merge, or deploy.",
    "Print only the JSON evaluation.",
  ].join(" ");
  let command = "";
  try {
    const launch = cursorAgentLaunch(assignment, "evaluator");
    command = launch.display;
    console.log(`Evaluator command: ${command}`);
    const result = await runCursorAgent(
      launch,
      {
        ...process.env,
        ATLAS_EVALUATOR_PROMPT: promptPath,
        ATLAS_EVALUATOR_OUTPUT: outputPath,
      },
      20 * 60 * 1000,
    );
    const secretChanges = restoreSecrets(snapshot);
    const changed = changesSince(snapshot).filter((change) => !isLoopOutput(change.path));
    if (changed.length > 0 || secretChanges.length > 0) {
      restoreFiles(
        snapshot,
        changed.map((change) => change.path),
      );
      return hook({
        status: "write_violation",
        reason:
          "EVALUATOR_WRITE_VIOLATION. The Evaluator edited files. Those edits were restored. Findings were not sent back to the Builder.",
        qaReport: input.qaReportPath,
        evaluationFile: null,
        command,
        filesChanged: changed.map((change) => change.path).concat(
          secretChanges.length > 0 ? ["a local secret or session file"] : [],
        ),
        report: null,
      });
    }
    const report = normalizeReport(extractJson(result.stdout), input.task.id, evaluatedFiles);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    return hook({
      status: "executed",
      reason: report.decision_adjusted
        ? "Evaluator finished in a separate read-only Cursor Agent process. The orchestrator applied the decision rule."
        : "Evaluator finished in a separate read-only Cursor Agent process.",
      qaReport: input.qaReportPath,
      evaluationFile: outputPath,
      command,
      filesChanged: [],
      report,
    });
  } catch (error) {
    return hook({
      status: "invalid_output",
      reason: redact(error instanceof Error ? error.message : "Evaluator failed."),
      qaReport: input.qaReportPath,
      evaluationFile: null,
      command,
      filesChanged: [],
      report: null,
    });
  }
}

function evaluationFiles(task: AgentTask): string[] {
  const defaults = [
    `agent-specs/${task.target_use_case}.json`,
    "agents/standards.md",
    "agents/evaluator.md",
  ];
  return [...new Set([...task.evaluation_targets, ...defaults])];
}

function writeEvaluatorPrompt(input: {
  task: AgentTask;
  taskPath: string;
  qaReportPath: string;
  qaStatus: string;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  builderReportPath: string;
  gitDiffSummary: string;
  promptPath: string;
  evaluatedFiles: string[];
}): void {
  const builderReport = fs.existsSync(input.builderReportPath)
    ? fs.readFileSync(input.builderReportPath, "utf8")
    : "{}";
  const prompt = [
    "Follow agents/evaluator.md and agents/standards.md.",
    "You are not the Builder. Do not use any Builder conversation or reasoning beyond the structured builder report below.",
    "Inspect the listed files. Judge the finished product. Do not modify anything.",
    "Score each dimension from 1.0 to 10.0 and include concise evidence from the actual content.",
    "Set overall_score from your judgment. Do not leave it as a blind average when safety or accuracy is weak, or when a CRITICAL finding exists. In those cases overall_score must be below 7.5.",
    "Set decision to PASS only when overall_score is at least 8.5 and there is no HIGH or CRITICAL finding.",
    "Set decision to PASS_WITH_RECOMMENDATIONS when overall_score is at least 7.5, there is no CRITICAL finding, and improvements remain.",
    "Otherwise set decision to HUMAN_REVIEW_REQUIRED.",
    "Print one JSON object and no other text. The object must match agents/evaluator-report.schema.json.",
    "",
    `Task file: ${input.taskPath}`,
    "Task:",
    JSON.stringify(input.task, null, 2),
    "",
    "Files to inspect:",
    ...input.evaluatedFiles.map((file) => `- ${file}`),
    "",
    "Deterministic QA result:",
    JSON.stringify(
      {
        status: input.qaStatus,
        tests_passed: input.testsPassed,
        tests_failed: input.testsFailed,
        tests_skipped: input.testsSkipped,
        report: input.qaReportPath,
      },
      null,
      2,
    ),
    "",
    "Git diff for files kept by this task:",
    input.gitDiffSummary,
    "",
    "Structured builder report:",
    builderReport,
  ].join("\n");
  fs.mkdirSync(path.dirname(input.promptPath), { recursive: true });
  fs.writeFileSync(input.promptPath, prompt);
}

export function normalizeReport(value: unknown, taskId: string, evaluatedFiles: string[]): EvaluatorReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Evaluator output is not a JSON object.");
  }
  const record = value as Record<string, unknown>;
  const scores = parseScores(record.scores);
  const findings = parseFindings(record.findings);
  const average = round1(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);
  const accuracy = scoreOf(scores, "accuracy_and_grounding");
  const safety = scoreOf(scores, "safety");
  const critical = findings.some((finding) => finding.severity === "CRITICAL");
  let overall = typeof record.overall_score === "number" ? record.overall_score : average;
  let basis: EvaluatorReport["overall_score_basis"] = "evaluator";
  if ((critical || accuracy < 7 || safety < 7) && overall >= 7.5) {
    overall = Math.min(overall, 7.4);
    basis = "capped_for_critical_issue";
  }
  overall = round1(overall);
  const decision = decideEvaluation({ overallScore: overall, scores, findings });
  const stated = record.decision;
  return {
    schema_version: "atlas-evaluator-report-v1",
    task_id: typeof record.task_id === "string" ? record.task_id : taskId,
    evaluator_executor: "cursor-agent-cli",
    evaluated_files: evaluatedFiles,
    scores,
    overall_score: overall,
    overall_score_basis: basis,
    setup_difficulty: oneOf(record.setup_difficulty, ["EASY", "MODERATE", "HARD"], "MODERATE"),
    automation_potential: oneOf(record.automation_potential, ["LOW", "MEDIUM", "HIGH"], "MEDIUM"),
    human_oversight: oneOf(record.human_oversight, ["LOW", "MEDIUM", "HIGH"], "HIGH"),
    findings,
    strengths: strings(record.strengths),
    recommended_improvements: strings(record.recommended_improvements),
    decision,
    decision_adjusted: stated !== decision || basis === "capped_for_critical_issue",
    timestamp: new Date().toISOString(),
  };
}

function parseScores(value: unknown): DimensionScore[] {
  if (!Array.isArray(value)) throw new Error("Evaluator scores must be an array.");
  const scores = value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("A score entry is not an object.");
    const record = entry as Record<string, unknown>;
    const dimension = record.dimension;
    if (!DIMENSIONS.includes(dimension as ScoreDimension)) {
      throw new Error(`Unknown score dimension: ${String(dimension)}`);
    }
    if (typeof record.score !== "number" || record.score < 1 || record.score > 10) {
      throw new Error(`Score for ${String(dimension)} must be from 1.0 to 10.0.`);
    }
    return {
      dimension: dimension as ScoreDimension,
      score: record.score,
      evidence: strings(record.evidence),
      issues: strings(record.issues),
    };
  });
  const missing = DIMENSIONS.filter((dimension) => !scores.some((score) => score.dimension === dimension));
  if (missing.length > 0) throw new Error(`Evaluator omitted scores: ${missing.join(", ")}`);
  return scores;
}

function parseFindings(value: unknown): EvaluatorFinding[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new Error("A finding is not an object.");
    const record = entry as Record<string, unknown>;
    return {
      finding_id: typeof record.finding_id === "string" ? record.finding_id : `finding-${index + 1}`,
      severity: oneOf(record.severity, ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"], "MEDIUM"),
      category: typeof record.category === "string" ? record.category : "quality",
      description: typeof record.description === "string" ? redact(record.description) : "",
      evidence: strings(record.evidence).map((item) => redact(item)),
      recommendation: typeof record.recommendation === "string" ? redact(record.recommendation) : "",
    };
  });
}

function hook(input: {
  status: EvaluatorHookResult["status"];
  reason: string;
  qaReport: string;
  evaluationFile: string | null;
  command: string;
  filesChanged: string[];
  report: EvaluatorReport | null;
}): EvaluatorHookResult {
  return {
    schema_version: "atlas-evaluator-hook-v1",
    status: input.status,
    reason: input.reason,
    output_schema: "agents/evaluator-report.schema.json",
    qa_report: input.qaReport,
    evaluation_file: input.evaluationFile,
    evaluator_executor: "cursor-agent-cli",
    evaluator_command: input.command,
    separate_context: true,
    files_changed_by_evaluator: input.filesChanged,
    decision: input.report?.decision ?? null,
    overall_score: input.report?.overall_score ?? null,
    scores: input.report?.scores.map((score) => ({ dimension: score.dimension, score: score.score })) ?? null,
    findings:
      input.report?.findings.map((finding) => ({
        finding_id: finding.finding_id,
        severity: finding.severity,
        description: finding.description,
      })) ?? [],
  };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error(`Evaluator did not return JSON. ${tail(text, 500)}`);
  return JSON.parse(raw.slice(start, end + 1));
}

function scoreOf(scores: { dimension: string; score: number }[], dimension: string): number {
  return scores.find((score) => score.dimension === dimension)?.score ?? 0;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isLoopOutput(file: string): boolean {
  return file.replace(/\\/g, "/").startsWith("agent-reports/");
}
