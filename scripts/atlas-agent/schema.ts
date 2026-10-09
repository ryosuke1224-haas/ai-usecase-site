import { z } from "zod";

const repoPath = z
  .string()
  .min(1)
  .refine((value) => isSafeRepoPath(value), "Path must stay inside the repository");

export const taskSchema = z.object({
  schema_version: z.literal("atlas-agent-task-v1"),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  objective: z.string().min(1),
  target_use_case: z.string().min(1),
  scope: z.array(repoPath).min(1),
  acceptance_criteria: z.array(z.string().min(1)).min(1),
  forbidden_changes: z.array(repoPath),
  permits_qa_changes: z.boolean().default(false),
  requires_authenticated_qa: z.boolean(),
  max_iterations: z.number().int().min(1).max(3),
  product_changes_required: z.boolean().default(true),
  evaluation_targets: z.array(repoPath).default([]),
});

export const testDefectSchema = z.object({
  issue_id: z.string().min(1),
  reason: z.string().min(1),
});

export const builderReportSchema = z.object({
  schema_version: z.literal("atlas-builder-report-v1"),
  task_id: z.string().min(1),
  iteration: z.number().int().min(1).max(3),
  files_changed: z.array(z.string()),
  summary: z.string(),
  acceptance_criteria_addressed: z.array(z.string()),
  known_risks: z.array(z.string()),
  build_result: z.enum(["not_run", "pass", "fail"]),
  possible_test_defects: z.array(testDefectSchema),
});

export const qaFailureSchema = z.object({
  issue_id: z.string().min(1),
  test: z.string().min(1),
  severity: z.enum(["blocking", "non_blocking"]),
  expected: z.string(),
  actual: z.string(),
  evidence: z.array(z.string()),
  relevant_files: z.array(z.string()),
  classification: z
    .enum([
      "QA_FAILURE",
      "BUILD_FAILURE",
      "VALIDATION_FAILURE",
      "POSSIBLE_TEST_DEFECT",
        "TEST_PROTECTION_VIOLATION",
        "SCOPE_VIOLATION",
        "BUILDER_TIMEOUT",
    ])
    .optional(),
});

export type AgentTask = z.infer<typeof taskSchema>;
export type BuilderReport = z.infer<typeof builderReportSchema>;
export type QaFailure = z.infer<typeof qaFailureSchema>;

const BUILDER_FIELDS = [
  "schema_version",
  "task_id",
  "iteration",
  "files_changed",
  "summary",
  "acceptance_criteria_addressed",
  "known_risks",
  "build_result",
  "possible_test_defects",
] as const;

const QA_CLAIM_FIELDS = ["qa_passed", "qa_status", "qa_result", "declared_qa_status", "status"];

export function isSafeRepoPath(value: string): boolean {
  if (!value || value.includes("\0")) return false;
  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("/") || normalized.startsWith("../") || normalized.includes("/../")) {
    return false;
  }
  if (normalized === ".." || pathIsAbsolute(normalized)) return false;
  return true
}

function pathIsAbsolute(value: string): boolean {
  return /^[A-Za-z]:\//.test(value) || value.startsWith("/");
}

export function assertBuilderReportShape(value: unknown): BuilderReport {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Builder report is not a JSON object.");
  }
  const record = value as Record<string, unknown>;
  const claimed = QA_CLAIM_FIELDS.filter((field) => field in record);
  if (claimed.length > 0) {
    throw new Error(
      `Builder report tried to declare QA status via: ${claimed.join(", ")}. QA owns pass and fail.`,
    );
  }
  const extra = Object.keys(record).filter(
    (field) => !BUILDER_FIELDS.includes(field as (typeof BUILDER_FIELDS)[number]),
  );
  if (extra.length > 0) {
    throw new Error(`Builder report has unexpected fields: ${extra.join(", ")}`);
  }
  return builderReportSchema.parse(value);
}

export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "task"}: ${issue.message}`)
    .join("\n");
}
