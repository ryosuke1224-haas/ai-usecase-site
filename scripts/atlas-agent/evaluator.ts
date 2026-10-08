import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { redact } from "./redact";

const SCORE_FIELDS = [
  "clarity",
  "accuracy",
  "actionability",
  "smb_relevance",
  "ai_literacy",
  "safety",
  "setup_difficulty",
  "automation_potential",
] as const;

export type EvaluatorHookResult = {
  schema_version: "atlas-evaluator-hook-v1";
  status: "not_executed" | "executed" | "invalid_output";
  reason: string;
  output_schema: "agents/evaluator-output.schema.json";
  qa_report: string;
  evaluation_file?: string;
  scores: Record<(typeof SCORE_FIELDS)[number], number | null> | null;
  overall: number | null;
  suggested_improvements: string[];
};

export function runEvaluatorHook(input: {
  qaReportPath: string;
  specPath: string;
  outputPath: string;
}): EvaluatorHookResult {
  const command = process.env.ATLAS_EVALUATOR_COMMAND?.trim();
  if (!command) {
    return {
      schema_version: "atlas-evaluator-hook-v1",
      status: "not_executed",
      reason:
        "No ATLAS_EVALUATOR_COMMAND is configured. The hook records the QA report and leaves scores empty. It does not invent a quality score and it does not edit the product.",
      output_schema: "agents/evaluator-output.schema.json",
      qa_report: input.qaReportPath,
      scores: null,
      overall: null,
      suggested_improvements: [],
    };
  }

  fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
  const evaluationPath = input.outputPath.replace(/\.json$/, "-evaluation.json");
  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true,
    env: {
      ...process.env,
      ATLAS_EVALUATOR_QA_REPORT: input.qaReportPath,
      ATLAS_EVALUATOR_SPEC: input.specPath,
      ATLAS_EVALUATOR_OUTPUT: evaluationPath,
    },
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0 || !fs.existsSync(evaluationPath)) {
    return emptyScores({
      status: "invalid_output",
      reason: redact(result.stderr || result.stdout || "Evaluator command did not write an evaluation."),
      qa_report: input.qaReportPath,
    });
  }
  return readEvaluation(evaluationPath, input.qaReportPath);
}

function readEvaluation(evaluationPath: string, qaReportPath: string): EvaluatorHookResult {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(evaluationPath, "utf8"));
    if (!parsed || typeof parsed !== "object") throw new Error("Evaluation is not an object.");
    const record = parsed as Record<string, unknown>;
    const scores = record.scores;
    if (!scores || typeof scores !== "object") throw new Error("Evaluation is missing scores.");
    const scoreRecord = scores as Record<string, unknown>;
    const mapped = {} as Record<(typeof SCORE_FIELDS)[number], number | null>;
    for (const field of SCORE_FIELDS) {
      const entry = scoreRecord[field];
      const value =
        entry && typeof entry === "object" && typeof (entry as { score?: unknown }).score === "number"
          ? (entry as { score: number }).score
          : null;
      mapped[field] = value;
    }
    const risks = Array.isArray(record.risks)
      ? record.risks.filter((item): item is string => typeof item === "string")
      : [];
    return {
      schema_version: "atlas-evaluator-hook-v1",
      status: "executed",
      reason: "Evaluator command wrote agents/evaluator-output.schema.json output.",
      output_schema: "agents/evaluator-output.schema.json",
      qa_report: qaReportPath,
      evaluation_file: evaluationPath.replace(/\\/g, "/"),
      scores: mapped,
      overall: typeof record.overall === "number" ? record.overall : null,
      suggested_improvements: risks.map((item) => redact(item)),
    };
  } catch (error) {
    return emptyScores({
      status: "invalid_output",
      reason: error instanceof Error ? error.message : "Could not read the evaluation.",
      qa_report: qaReportPath,
      evaluation_file: evaluationPath.replace(/\\/g, "/"),
    });
  }
}

function emptyScores(input: {
  status: "invalid_output";
  reason: string;
  qa_report: string;
  evaluation_file?: string;
}): EvaluatorHookResult {
  return {
    schema_version: "atlas-evaluator-hook-v1",
    status: input.status,
    reason: input.reason,
    output_schema: "agents/evaluator-output.schema.json",
    qa_report: input.qa_report,
    evaluation_file: input.evaluation_file,
    scores: null,
    overall: null,
    suggested_improvements: [],
  };
}
