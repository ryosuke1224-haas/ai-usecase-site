/**
 * Atlas agent loop v1.
 * Task → Builder → validate → build → QA → at most 3 iterations → human review.
 * This script does not commit, push, merge, or deploy.
 */
import fs from "node:fs";
import path from "node:path";
import {
  builderInstruction,
  invokeBuilder,
  resolveBuilderInvocation,
  type BuilderInvocation,
} from "./atlas-agent/builder";
import { runEvaluatorHook, type EvaluatorHookResult } from "./atlas-agent/evaluator";
import { guardChanges } from "./atlas-agent/guards";
import { listQaReports, readNewQaReport, type QaRunResult } from "./atlas-agent/qa-failures";
import { redact } from "./atlas-agent/redact";
import { runCommand } from "./atlas-agent/run-command";
import { formatZodError, taskSchema, type QaFailure } from "./atlas-agent/schema";
import { runAgentLoopSelfCheck } from "./atlas-agent/self-check";
import {
  captureBaseline,
  changesSince,
  currentBranch,
  currentHead,
  diffSummary,
  restoreFiles,
  restoreSecrets,
  type Baseline,
} from "./atlas-agent/workspace";

type Disposition = "READY_FOR_HUMAN_REVIEW" | "HUMAN_REVIEW_REQUIRED";

type IterationRecord = {
  iteration: number;
  builder_invocation: BuilderInvocation;
  builder_command: string;
  builder_report: string;
  validate?: string;
  build?: string;
  qa_report?: string | null;
};

type LoopResult = {
  schema_version: "atlas-agent-loop-v1";
  disposition: Disposition;
  task: { id: string; title: string; path: string };
  iterations_used: number;
  max_iterations: number;
  files_changed: string[];
  qa_result: {
    status: "pass" | "fail" | "blocked" | "not_run";
    tests_passed: number;
    tests_failed: number;
    tests_skipped: number;
    report: string | null;
  } | null;
  unresolved_issues: QaFailure[];
  evaluator_result: EvaluatorHookResult | null;
  git_diff_summary: string;
  committed: false;
  iterations: IterationRecord[];
  builder_invocation: BuilderInvocation | "unavailable";
  builder_command: string;
  fallback_used: boolean;
  authenticated_session: "reused" | "not_required" | "missing";
  loop_report: string;
};

const REQUIRED_BRANCH = "private-preview";

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (args.includes("--self-check")) {
    runAgentLoopSelfCheck();
    return;
  }
  const taskArg = args.find((arg) => !arg.startsWith("-"));
  if (!taskArg) {
    console.error("Usage: npm run agent:run -- <task-file>");
    process.exit(2);
  }

  const branch = currentBranch();
  if (branch !== REQUIRED_BRANCH) {
    console.error(`Refusing to run on ${branch || "a detached commit"}. The agent loop only runs on ${REQUIRED_BRANCH}.`);
    process.exit(2);
  }

  const taskPath = taskArg.replace(/\\/g, "/");
  const absoluteTask = path.resolve(process.cwd(), taskPath);
  if (!fs.existsSync(absoluteTask)) {
    console.error(`Task file not found: ${taskPath}`);
    process.exit(2);
  }
  const parsed = taskSchema.safeParse(JSON.parse(fs.readFileSync(absoluteTask, "utf8")));
  if (!parsed.success) {
    console.error(formatZodError(parsed.error));
    process.exit(2);
  }
  const task = parsed.data;
  const session = sessionState();
  const loopDirectory = path.join(
    "agent-reports",
    "loops",
    `${timestamp()}-${task.id}`,
  );
  fs.mkdirSync(loopDirectory, { recursive: true });
  const resultPath = `${loopDirectory.replace(/\\/g, "/")}/loop-result.json`;
  const baseline = captureBaseline();
  let invocation: BuilderInvocation | "unavailable" = "unavailable";
  try {
    invocation = resolveBuilderInvocation(task);
  } catch (error) {
    finish({
      resultPath,
      baseline,
      taskPath,
      taskId: task.id,
      taskTitle: task.title,
      maxIterations: task.max_iterations,
      iterationsUsed: 0,
      disposition: "HUMAN_REVIEW_REQUIRED",
      unresolved: [
        issue(
          "builder-unavailable",
          "Builder",
          error instanceof Error ? error.message : "Builder is not available.",
          "QA_FAILURE",
        ),
      ],
      qa: null,
      evaluator: null,
      iterations: [],
      invocation,
      session: session === "present" ? "reused" : "missing",
    });
  }

  if (task.requires_authenticated_qa && session !== "present") {
    finish({
      resultPath,
      baseline,
      taskPath,
      taskId: task.id,
      taskTitle: task.title,
      maxIterations: task.max_iterations,
      iterationsUsed: 0,
      disposition: "HUMAN_REVIEW_REQUIRED",
      unresolved: [
        issue(
          "authenticated-session-missing",
          "authenticated QA",
          session === "env-missing"
            ? "ATLAS_QA_STORAGE_STATE is set, but that file was not found. The loop will not request a Magic Link."
            : "The saved Playwright session is missing. Create it once with npm run qa:save-session. The loop will not request a Magic Link.",
          "QA_FAILURE",
        ),
      ],
      qa: null,
      evaluator: null,
      iterations: [],
      invocation,
      session: "missing",
    });
  }

  console.log(`Atlas agent loop`);
  console.log(`Task: ${task.id}`);
  console.log(`Branch: ${branch}`);
  console.log(`Builder: ${invocation}`);
  console.log(`Iteration limit: ${task.max_iterations}`);

  let failures: QaFailure[] = [];
  let previousFiles: string[] = [];
  const iterations: IterationRecord[] = [];
  let qa: QaRunResult | null = null;
  let evaluator: EvaluatorHookResult | null = null;
  let disposition: Disposition = "HUMAN_REVIEW_REQUIRED";
  let unresolved: QaFailure[] = [];

  for (let iteration = 1; iteration <= task.max_iterations; iteration += 1) {
    console.log("");
    console.log(`Iteration ${iteration} of ${task.max_iterations}`);
    const incomingFailures = failures;
    const beforeThisIteration = changeKey(changesSince(baseline));
    const iterationDirectory = path.join(loopDirectory, `iteration-${iteration}`);
    const requestPath = path.join(iterationDirectory, "builder-request.json");
    const reportPath = path.join(iterationDirectory, "builder-report.json");
    const promptPath = path.join(iterationDirectory, "builder-prompt.txt");
    let report;
    let builderCommand = "";
    try {
      const invoked = await invokeBuilder({
        invocation: invocation as BuilderInvocation,
        request: {
          schema_version: "atlas-builder-request-v1",
          task,
          iteration,
          instruction: builderInstruction(iteration),
          failures,
          previous_files_changed: previousFiles,
        },
        requestPath,
        reportPath,
        promptPath,
      });
      report = invoked.report;
      builderCommand = invoked.command;
    } catch (error) {
      unresolved = [
        issue(
          "builder-failed",
          "Builder",
          error instanceof Error ? error.message : "Builder failed.",
          "QA_FAILURE",
        ),
      ];
      break;
    }

    iterations.push({
      iteration,
      builder_invocation: invocation as BuilderInvocation,
      builder_command: builderCommand,
      builder_report: reportPath.replace(/\\/g, "/"),
    });
    previousFiles = report.files_changed;

    if (report.task_id !== task.id || report.iteration !== iteration) {
      unresolved = [
        issue(
          "builder-report-mismatch",
          "Builder report",
          "The builder report task id or iteration does not match this loop.",
          "QA_FAILURE",
        ),
      ];
      break;
    }
    if (currentHead() !== baseline.head) {
      unresolved = [
        issue(
          "commit-detected",
          "git",
          "HEAD changed during the Builder step. The loop does not commit or push, and it will not undo that commit.",
          "SCOPE_VIOLATION",
        ),
      ];
      break;
    }
    if (restoreSecrets(baseline).length > 0) {
      unresolved = [
        issue(
          "secret-file-modified",
          "secrets",
          "A local secret or session file changed and was restored. The loop does not read or print those files.",
          "SCOPE_VIOLATION",
        ),
      ];
      break;
    }

    const guarded = guardChanges({
      changes: changesSince(baseline),
      scope: task.scope,
      forbidden: task.forbidden_changes,
      permitsQaChanges: task.permits_qa_changes,
      taskPath,
    });
    restoreFiles(baseline, guarded.restore);
    if (guarded.issues.length > 0) {
      unresolved = guarded.issues;
      break;
    }

    const defects: QaFailure[] = report.possible_test_defects.map((defect) =>
      issue(defect.issue_id, defect.issue_id, defect.reason, "POSSIBLE_TEST_DEFECT"),
    );
    const kept = changesSince(baseline);
    if (
      incomingFailures.length > 0 &&
      defects.length === 0 &&
      changeKey(kept) === beforeThisIteration
    ) {
      unresolved = incomingFailures;
      break;
    }
    if (kept.length === 0 && failures.length > 0) {
      unresolved = failures;
      break;
    }
    if (kept.length === 0 && defects.length === 0) {
      failures = [
        issue(
          "scope-not-updated",
          "task scope",
          `The Builder did not change: ${task.scope.join(", ")}`,
          "QA_FAILURE",
        ),
      ];
      unresolved = failures;
      if (iteration === task.max_iterations) break;
      continue;
    }

    const content = await runCommand("npm run validate:content");
    iterations[iterations.length - 1].validate = content.status;
    if (content.status !== "pass") {
      failures = [
        issue("validate-content", "content validation", content.detail, "VALIDATION_FAILURE"),
      ];
      unresolved = failures;
      if (iteration === task.max_iterations) break;
      continue;
    }

    const build = await runCommand("npm run build");
    iterations[iterations.length - 1].build = build.status;
    if (build.status !== "pass") {
      failures = [issue("build", "production build", build.detail, "BUILD_FAILURE")];
      unresolved = failures;
      if (iteration === task.max_iterations) break;
      continue;
    }

    const beforeReports = listQaReports();
    const qaCommand = await runCommand("npm run qa");
    qa = readNewQaReport(beforeReports);
    iterations[iterations.length - 1].qa_report = qa.reportPath;
    if (task.requires_authenticated_qa && (qa.report?.tests_skipped ?? 0) > 0) {
      unresolved = [
        issue(
          "authenticated-qa-skipped",
          "authenticated QA",
          "Signed-in tests did not run. The loop will not disable authentication or request a new Magic Link.",
          "QA_FAILURE",
        ),
        ...qa.failures,
      ];
      break;
    }
    if (qaCommand.status === "fail" && qa.report?.status === "pass") {
      unresolved = [
        issue(
          "qa-result-mismatch",
          "npm run qa",
          "The QA command failed, but the report says pass.",
          "QA_FAILURE",
        ),
      ];
      break;
    }
    if (defects.length > 0) {
      unresolved = defects;
      break;
    }
    if (qa.report?.status === "pass" && qa.failures.length === 0) {
      const specPath = `agent-specs/${task.target_use_case}.json`;
      evaluator = runEvaluatorHook({
        qaReportPath: qa.reportPath || "",
        specPath,
        outputPath: path.join(loopDirectory, "evaluator-hook.json").replace(/\\/g, "/"),
      });
      fs.writeFileSync(
        path.join(loopDirectory, "evaluator-hook.json"),
        `${JSON.stringify(evaluator, null, 2)}\n`,
      );
      disposition = "READY_FOR_HUMAN_REVIEW";
      unresolved = [];
      break;
    }
    failures = qa.failures;
    unresolved = failures;
    if (iteration === task.max_iterations) break;
  }

  finish({
    resultPath,
    baseline,
    taskPath,
    taskId: task.id,
    taskTitle: task.title,
    maxIterations: task.max_iterations,
    iterationsUsed: iterations.length,
    disposition,
    unresolved,
    qa,
    evaluator,
    iterations,
    invocation,
    session: session === "present" ? "reused" : session === "env-missing" ? "missing" : task.requires_authenticated_qa ? "missing" : "not_required",
  });
}

function finish(input: {
  resultPath: string;
  baseline: Baseline;
  taskPath: string;
  taskId: string;
  taskTitle: string;
  maxIterations: number;
  iterationsUsed: number;
  disposition: Disposition;
  unresolved: QaFailure[];
  qa: QaRunResult | null;
  evaluator: EvaluatorHookResult | null;
  iterations: IterationRecord[];
  invocation: BuilderInvocation | "unavailable";
  session: LoopResult["authenticated_session"];
}): never {
  const files = changesSince(input.baseline).map((change) => change.path);
  const result: LoopResult = {
    schema_version: "atlas-agent-loop-v1",
    disposition: input.disposition,
    task: { id: input.taskId, title: input.taskTitle, path: input.taskPath },
    iterations_used: input.iterationsUsed,
    max_iterations: input.maxIterations,
    files_changed: files,
    qa_result: input.qa?.report
      ? {
          status: input.qa.report.status,
          tests_passed: input.qa.report.tests_passed,
          tests_failed: input.qa.report.tests_failed,
          tests_skipped: input.qa.report.tests_skipped,
          report: input.qa.reportPath,
        }
      : {
          status: "not_run",
          tests_passed: 0,
          tests_failed: 0,
          tests_skipped: 0,
          report: null,
        },
    unresolved_issues: input.unresolved.map(redactIssue),
    evaluator_result: input.evaluator,
    git_diff_summary: redact(diffSummary(input.baseline, files)),
    committed: false,
    iterations: input.iterations,
    builder_invocation: input.invocation,
    builder_command: input.iterations.find((item) => item.builder_command)?.builder_command ?? "",
    fallback_used: input.invocation === "documentation-fallback",
    authenticated_session: input.session,
    loop_report: input.resultPath,
  };
  fs.mkdirSync(path.dirname(input.resultPath), { recursive: true });
  fs.writeFileSync(input.resultPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log("");
  console.log(result.disposition);
  console.log(`Iterations used: ${result.iterations_used} of ${result.max_iterations}`);
  console.log(`Files changed by the loop: ${result.files_changed.join(", ") || "(none)"}`);
  if (result.qa_result) {
    console.log(
      `QA: ${result.qa_result.status}, passed ${result.qa_result.tests_passed}, failed ${result.qa_result.tests_failed}, skipped ${result.qa_result.tests_skipped}`,
    );
  }
  console.log(`Authenticated session: ${result.authenticated_session}`);
  console.log(`Builder command: ${result.builder_command || "(none)"}`);
  console.log(`Fallback used: ${result.fallback_used}`);
  console.log(`Evaluator: ${result.evaluator_result?.status ?? "not_run"}`);
  console.log(`Committed: false`);
  console.log(`Report: ${input.resultPath}`);
  process.exit(result.disposition === "READY_FOR_HUMAN_REVIEW" ? 0 : 1);
}

function issue(
  issueId: string,
  test: string,
  actual: string,
  classification: QaFailure["classification"],
): QaFailure {
  return {
    issue_id: issueId,
    test,
    severity: "blocking",
    expected: "The loop can continue only when the task, tests, and QA contract still hold.",
    actual: redact(actual),
    evidence: [],
    relevant_files: [],
    classification,
  };
}

function redactIssue(value: QaFailure): QaFailure {
  return {
    ...value,
    actual: redact(value.actual),
    expected: redact(value.expected),
  };
}

function sessionState(): "present" | "missing" | "env-missing" {
  const fromEnv = process.env.ATLAS_QA_STORAGE_STATE?.trim();
  if (fromEnv) return fs.existsSync(fromEnv) ? "present" : "env-missing";
  return fs.existsSync(path.join("agent-secrets", "playwright-storage-state.json"))
    ? "present"
    : "missing";
}

function changeKey(changes: { path: string; after: string | null }[]): string {
  return changes
    .map((change) => `${change.path}\0${change.after ?? ""}`)
    .sort()
    .join("\n");
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
