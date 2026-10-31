/**
 * Atlas Auto v1.
 * Research → Scoring → Approval dashboard → HUMAN APPROVAL → Spec → Task →
 * existing Builder/Build/QA/Evaluator loop → Final human review.
 * This script never commits, pushes, merges, deploys, or publishes.
 */
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { redactChildHumanStatusLine } from "./atlas-agent/loop-status";
import { runEvaluator } from "./atlas-agent/evaluator";
import { listQaReports, readNewQaReport } from "./atlas-agent/qa-failures";
import { redact } from "./atlas-agent/redact";
import { captureBaseline, changesSince, currentBranch, currentHead } from "./atlas-agent/workspace";
import { prepareAuthenticatedSession } from "./atlas-qa/auth-session";
import {
  renderCandidateDashboard,
  renderFinalReview,
  type DashboardState,
  type FinalReviewData,
} from "./atlas-auto/dashboard";
import { executeRecovery, runRecoveryLoop, type RecoveryDeps } from "./atlas-auto/recovery";
import {
  applyPlannedAction,
  completeRecovery,
  decideSupervisor,
  emptySupervisorState,
  humanFacingDisposition,
  HUMAN_REVIEW_REQUIRED,
  snapshotFromLoop,
  supervisorUserFacingLines,
  type SupervisorSnapshot,
} from "./atlas-auto/supervisor";
import {
  appendDecision,
  latestDecisions,
  loadDecisions,
  loadHistory,
  loadRun,
  loadRunCandidates,
  readJson,
  recordProposals,
  runMemoryDir,
  runReportDir,
  saveHistory,
  saveRun,
  setStatus,
  writeJson,
  MEMORY_DIR,
} from "./atlas-auto/memory";
import { researchAndScore } from "./atlas-auto/research";
import {
  applyCanonicalFinalReview,
  persistCanonicalFinalReviewStatus,
  planFinalReviewResume,
} from "./atlas-auto/final-review-status";
import {
  canApproveProductAndPrice,
  createBuilderRetryRun,
  evaluateBuilderRetry,
  inspectBuilderRetry,
  persistBuilderRetry,
  resumeBlockedMessage,
} from "./atlas-auto/retry-builder";
import { loadAtlasLocalEnv } from "./atlas-auto/local-env";
import { runAutoSelfCheck } from "./atlas-auto/self-check";
import { startReviewServer, type ReviewServer } from "./atlas-auto/server";
import { runSpecAgent, writeBuildTask, type BlueprintSpec } from "./atlas-auto/spec";
import {
  HUMAN_INTERVENTION_REQUIRED,
  interventionReason,
  readAssignmentFiles,
  retryAssignmentFromCurrentFiles,
  shouldOpenFinalReview,
  validateBuilderAssignment,
} from "./atlas-auto/task-assignment";
import type { AgentTask } from "./atlas-agent/schema";
import { readMergedRegistry, saveRegistryRow } from "./atlas-commerce/save-registry";
import { usSandboxSecret } from "./atlas-commerce/stripe-accounts";
import { sandboxStripe } from "./atlas-commerce/stripe-adapter";
import Stripe from "stripe";
import {
  provisionSandboxProduct,
  parseApprovedAmount,
  suggestPriceCents,
  type SandboxStripe,
} from "../src/lib/payments/provision";
import {
  CANDIDATE_DECISIONS,
  FINAL_DECISIONS,
  type CandidateDecision,
  type CandidateDecisionValue,
  type FinalDecisionValue,
  type CommerceRecord,
  type FinalReviewDecision,
  type RunRecord,
  type ScoredCandidate,
} from "./atlas-auto/types";

const REQUIRED_BRANCH = "private-preview";
const LOOPS_DIR = "agent-reports/loops";

type Options = {
  dryRun: boolean;
  offline: boolean;
  serve: boolean;
  resume: string | null;
  retryBuilder: string | null;
};

type Session = {
  run: RunRecord;
  candidates: ScoredCandidate[];
  token: string;
  ended: boolean;
  message: string;
  finalData: FinalReviewData | null;
  finalDecision: FinalReviewDecision | null;
  server: ReviewServer | null;
};

async function main() {
  loadAtlasLocalEnv();
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (args.includes("--self-check")) {
    runAutoSelfCheck();
    return;
  }
  const resumeIndex = args.indexOf("--resume");
  const retryIndex = args.indexOf("--retry-builder");
  const options: Options = {
    dryRun: args.includes("--dry-run"),
    offline: args.includes("--offline"),
    serve: !args.includes("--no-serve"),
    resume: resumeIndex >= 0 ? args[resumeIndex + 1] ?? null : null,
    retryBuilder: retryIndex >= 0 ? args[retryIndex + 1] ?? null : null,
  };
  if (resumeIndex >= 0 && !options.resume) fail("Usage: npm run atlas:auto -- --resume <run-id>");
  if (retryIndex >= 0 && !options.retryBuilder) fail("Usage: npm run atlas:auto -- --retry-builder <run-id>");
  if (options.resume && options.retryBuilder) fail("Use either --resume or --retry-builder, not both.");
  if (options.retryBuilder && options.dryRun) fail("Builder retry is a full run. Do not combine it with --dry-run.");

  const branch = currentBranch();
  if (branch !== REQUIRED_BRANCH) {
    fail(`Refusing to run on ${branch || "a detached commit"}. Atlas Auto only runs on ${REQUIRED_BRANCH}.`);
  }
  const head = currentHead();
  const baseline = captureBaseline();
  const loopsBefore = listLoopDirs();

  const session = options.retryBuilder
    ? retryBuilderSession(options)
    : options.resume
      ? resumeSession(options)
      : await newSession(options, branch);
  const { run } = session;
  process.on("SIGINT", () => {
    run.notes.push(`Interrupted during ${run.phase}.`);
    saveRun(run);
    console.log(`\nStopped. Resume later with: npm run atlas:auto -- --resume ${run.run_id}`);
    process.exit(130);
  });

  writeCandidateSnapshot(session);
  printCandidates(session);

  if (run.mode === "dry-run" && !options.serve) {
    run.phase = "DRY_RUN_COMPLETE";
    saveRun(run);
    finishDryRun(session, baseline, loopsBefore, head);
    return;
  }

  session.server = await startReviewServer({
    token: session.token,
    pages: {
      "/": () => (session.finalData ? finalPage(session) : candidatePage(session)),
      "/candidates": () => candidatePage(session),
    },
    state: () => dashboardState(session),
    posts: {
      "/api/decision": (body) => postDecision(session, body),
      "/api/end-review": () => postEndReview(session),
      "/api/final-review": (body) => postFinalReview(session, body),
    },
  });
  run.dashboard_url = session.server.url;
  saveRun(run);

  if (run.phase === "AWAITING_FINAL_REVIEW" && session.finalData) {
    await finalReview(session);
    return;
  }

  if (!run.approved_candidate_id) {
    run.phase = "AWAITING_APPROVAL";
    saveRun(run);
    console.log("");
    console.log("Atlas candidate review ready:");
    console.log(session.server.url);
    console.log("");
    console.log(`Dashboard file: ${run.dashboard_file}`);
    console.log(`Decisions are written to: ${runMemoryDir(run.run_id)}/`);
    console.log("");
    console.log(run.mode === "dry-run" ? "Waiting for decisions (dry run: approving will not build)..." : "Waiting for approval...");
    await waitForApproval(session);
  }

  if (!run.approved_candidate_id) {
    run.phase = "STOPPED_WITHOUT_APPROVAL";
    session.message = "Review ended without an approved candidate. Nothing was built.";
    saveRun(run);
    writeCandidateSnapshot(session);
    console.log(session.message);
    await closeSoon(session);
    if (run.mode === "dry-run") finishDryRun(session, baseline, loopsBefore, head);
    return;
  }

  const approved = session.candidates.find((candidate) => candidate.id === run.approved_candidate_id)!;
  console.log(`Approved: ${approved.name} (${approved.id})`);

  if (run.mode === "dry-run") {
    run.phase = "DRY_RUN_COMPLETE";
    session.message = `Dry run: ${approved.name} is approved and recorded. Nothing was built. To build it, run: npm run atlas:auto -- --resume ${run.run_id}`;
    saveRun(run);
    writeCandidateSnapshot(session);
    console.log(session.message);
    await closeSoon(session);
    finishDryRun(session, baseline, loopsBefore, head);
    return;
  }

  await buildApproved(session, approved);
  if (session.run.phase === "AWAITING_FINAL_REVIEW" && session.finalData) {
    await finalReview(session);
    return;
  }
  await closeSoon(session);
}

async function newSession(options: Options, branch: string): Promise<Session> {
  const runId = `${timestamp()}${options.dryRun ? "-dry-run" : ""}`;
  const reportDir = runReportDir(runId);
  const run: RunRecord = {
    schema_version: "atlas-auto-run-v1",
    run_id: runId,
    mode: options.dryRun ? "dry-run" : "full",
    branch,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phase: "RESEARCH",
    research_source: null,
    scoring_source: null,
    research_notes: [],
    candidates: [],
    filtered_candidates: [],
    dashboard_file: null,
    dashboard_url: null,
    approval_file: `${runMemoryDir(runId)}/approval.json`,
    approved_candidate_id: null,
    spec_path: null,
    task_path: null,
    loop_result: null,
    loop_disposition: null,
    final_review_file: null,
    final_review_decision: null,
    commerce: null,
    builder_ran: false,
    committed: false,
    pushed: false,
    published: false,
    notes: [],
  };
  console.log("Atlas Auto v1");
  console.log(`Run: ${runId}`);
  console.log(`Mode: ${run.mode}`);
  console.log(`Branch: ${branch}`);
  console.log("");
  saveRun(run);

  const history = loadHistory();
  const result = await researchAndScore({ runId, history, reportDir, offline: options.offline });
  run.research_source = result.researchSource;
  run.scoring_source = result.scoringSource;
  run.research_notes = result.notes;
  run.filtered_candidates = result.filtered;
  run.candidates = result.candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    rank: candidate.rank,
    ...candidate.summary_scores,
  }));
  writeJson(`${runMemoryDir(runId)}/candidates.json`, result.candidates);
  writeJson(`${runMemoryDir(runId)}/decisions.json`, []);
  recordProposals(history, runId, result.candidates);
  for (const note of result.notes) console.log(`Note: ${note}`);
  saveRun(run);

  return {
    run,
    candidates: result.candidates,
    token: crypto.randomBytes(24).toString("hex"),
    ended: false,
    message: "",
    finalData: null,
    finalDecision: null,
    server: null,
  };
}

function resumeSession(options: Options): Session {
  const runId = options.resume!;
  const run = loadRun(runId);
  if (!run) fail(`Run not found: ${runMemoryDir(runId)}/run.json`);
  const candidates = loadRunCandidates(runId);
  if (candidates.length === 0) fail(`Run ${runId} has no candidates.`);
  run.commerce = run.commerce ?? null;
  if (run.phase === "FINISHED" || run.phase === "READY_FOR_PREVIEW" || run.phase === "HUMAN_INTERVENTION_REQUIRED") {
    const retry = evaluateBuilderRetry(inspectBuilderRetry(runId));
    fail(resumeBlockedMessage(run, retry.ok));
  }
  if (run.mode === "dry-run" && !options.dryRun) {
    run.mode = "full";
    run.notes.push("Resumed from a dry run as a full run.");
  }
  const approval = readJson<CandidateDecision>(run.approval_file);
  if (approval?.decision === "APPROVED") run.approved_candidate_id = approval.candidate_id;
  const session: Session = {
    run,
    candidates,
    token: crypto.randomBytes(24).toString("hex"),
    ended: false,
    message: "",
    finalData: null,
    finalDecision: null,
    server: null,
  };
  if (run.phase === "AWAITING_FINAL_REVIEW" && run.loop_result && run.spec_path) {
    const spec = readJson<BlueprintSpec>(run.spec_path);
    const plan = planFinalReviewResume(run);
    if (spec && plan.reuseExistingResults) {
      session.finalData = applyCanonicalFinalReview(finalReviewData(run, spec, run.loop_result));
      persistCanonicalFinalReviewStatus(run, session.finalData);
    }
  }
  console.log("Atlas Auto v1");
  console.log(`Resuming run: ${runId} (${run.phase})`);
  saveRun(run);
  return session;
}

function retryBuilderSession(options: Options): Session {
  const sourceId = options.retryBuilder!;
  const inspection = inspectBuilderRetry(sourceId);
  const eligibility = evaluateBuilderRetry(inspection);
  if (!eligibility.ok) fail(eligibility.reason);
  const assignment = retryAssignmentFromCurrentFiles(inspection.source);
  if (!assignment.ok) fail(assignment.reason);
  const specPath = assignment.specPath;
  const taskPath = assignment.taskPath;
  const next = createBuilderRetryRun({
    source: inspection.source,
    approval: inspection.approval!,
    specPath,
    taskPath,
    runId: timestamp(),
    now: new Date().toISOString(),
  });
  const candidates = loadRunCandidates(sourceId);
  persistBuilderRetry({ run: next.run, approval: next.approval, candidates });
  console.log("Atlas Auto v1");
  console.log(`Builder retry of ${sourceId}`);
  console.log(`New run: ${next.run.run_id}`);
  console.log(`Reusing approved candidate: ${inspection.approval!.candidate_name} (${inspection.approval!.candidate_id})`);
  console.log(`Reusing current Spec: ${specPath}`);
  console.log(`Reusing current Task: ${taskPath}`);
  console.log("Research, scoring, approval, and Spec will not rerun. Parent-run task snapshots are not restored.");
  saveRun(next.run);
  return {
    run: next.run,
    candidates,
    token: crypto.randomBytes(24).toString("hex"),
    ended: false,
    message: `${inspection.approval!.candidate_name} stays approved. Atlas is retrying the Builder with the existing Spec.`,
    finalData: null,
    finalDecision: null,
    server: null,
  };
}

async function buildApproved(session: Session, approved: ScoredCandidate) {
  const { run } = session;
  const reportDir = runReportDir(run.run_id);
  const approval = readJson<CandidateDecision>(run.approval_file)!;
  session.message =
    run.retry_kind === "builder"
      ? `${approved.name} stays approved. The Supervisor will run Builder → Build → QA → Evaluator and recover internally when it is safe. Watch the terminal; this page switches to the final review only when the product is ready.`
      : `${approved.name} approved. Writing the Blueprint spec, then the Supervisor will run Builder → Build → QA → Evaluator and recover internally when it is safe. Watch the terminal; this page switches to the final review only when the product is ready.`;

  let spec: BlueprintSpec;
  let task: AgentTask;
  if (run.retry_kind === "builder" && run.spec_path && run.task_path) {
    const reused = readJson<BlueprintSpec>(run.spec_path);
    if (!reused || reused.id !== approved.id) {
      run.phase = "FAILED";
      run.notes.push("Builder retry could not reuse the approved Spec.");
      saveRun(run);
      session.message = "The approved Spec could not be reused. Nothing was built. See the terminal.";
      console.error(run.notes.at(-1));
      await closeSoon(session);
      process.exit(1);
    }
    const files = readAssignmentFiles({ specPath: run.spec_path, taskPath: run.task_path });
    if (!("spec" in files)) {
      await escalateIntervention(session, files.reason);
      process.exit(1);
    }
    spec = files.spec;
    task = files.task;
    console.log(`Reusing current Spec: ${run.spec_path}`);
    console.log(`Current Task: ${run.task_path}`);
  } else {
    run.phase = "SPEC";
    saveRun(run);
    try {
      const result = await runSpecAgent({ candidate: approved, approval, runId: run.run_id, reportDir });
      spec = result.spec;
      run.spec_path = result.specPath;
      const generated = writeBuildTask(spec);
      task = generated.task;
      run.task_path = generated.taskPath;
      console.log(`Spec: ${result.specPath}`);
      console.log(`Task: ${generated.taskPath}`);
    } catch (error) {
      run.phase = "FAILED";
      run.notes.push(redact(`Spec step failed: ${error instanceof Error ? error.message : String(error)}`));
      saveRun(run);
      session.message = "The Spec Agent failed. Nothing was built. See the terminal.";
      console.error(run.notes.at(-1));
      console.error(`Retry with: npm run atlas:auto -- --resume ${run.run_id}`);
      await closeSoon(session);
      process.exit(1);
    }
  }

  const assigned = await reconcileAssignment(session, spec, task);
  if (!assigned.ok) {
    await escalateIntervention(session, assigned.reason);
    process.exit(1);
  }
  spec = assigned.spec;
  task = assigned.task;

  run.phase = "BUILD";
  run.builder_ran = true;
  saveRun(run);
  console.log("");
  console.log("Starting the existing Atlas Agent Loop: npm run agent:run -- " + run.task_path);
  const before = listLoopDirs();
  const exitCode = await runInherited(`npm run agent:run -- ${run.task_path}`);
  const loopDir = listLoopDirs().find((dir) => !before.includes(dir) && dir.endsWith(`-${path.basename(run.task_path!, ".json")}`));
  const loopResult = loopDir ? `${LOOPS_DIR}/${loopDir}/loop-result.json` : null;
  run.loop_result = loopResult && fs.existsSync(loopResult) ? loopResult : null;
  if (!run.loop_result) run.notes.push(`The agent loop exited ${exitCode} without a loop-result.json.`);

  let review = finalReviewData(run, spec, run.loop_result);
  const supervised = await runRecoveryLoop({
    snapshot: snapshotFromReview(review, spec, task, { ok: true }, loopIssues(run.loop_result)),
    state: run.supervisor ?? emptySupervisorState(),
    spec,
    task,
    specPath: run.spec_path!,
    taskPath: run.task_path!,
    deps: productionRecoveryDeps(run),
  });
  spec = supervised.spec;
  task = supervised.task;
  run.supervisor = supervised.state;
  if (supervised.loopResultPath) run.loop_result = supervised.loopResultPath;
  review = applyCanonicalFinalReview(
    overlaySupervisorReview(finalReviewData(run, spec, run.loop_result), supervised.snapshot, supervised.decision.report),
  );

  const ready =
    supervised.decision.recommendation === "READY_FOR_HUMAN_REVIEW" && shouldOpenFinalReview(review);
  const human = humanFacingDisposition(supervised.decision.recommendation);
  persistCanonicalFinalReviewStatus(run, {
    disposition: ready && human === HUMAN_REVIEW_REQUIRED ? HUMAN_REVIEW_REQUIRED : HUMAN_INTERVENTION_REQUIRED,
  });
  const history = loadHistory();
  setStatus(history, {
    id: approved.id,
    name: approved.name,
    status: review.filesChanged.length > 0 ? "BUILT" : "APPROVED",
    runId: run.run_id,
    note: ready
      ? `${HUMAN_REVIEW_REQUIRED}. Supervisor READY_FOR_HUMAN_REVIEW. QA ${review.qa.status}. Evaluator ${review.evaluator.overall ?? "n/a"}.`
      : interventionReason(review),
  });
  saveHistory(history);
  if (ready && human === HUMAN_REVIEW_REQUIRED) {
    session.finalData = review;
    run.phase = "AWAITING_FINAL_REVIEW";
    saveRun(run);
    for (const line of supervisorUserFacingLines(supervised.decision)) console.log(line);
    return;
  }
  session.finalData = null;
  run.phase = "HUMAN_INTERVENTION_REQUIRED";
  session.message = interventionReason(review);
  saveRun(run);
  for (const line of supervisorUserFacingLines(supervised.decision)) console.log(line);
  console.log(`Retry Builder: npm run atlas:auto -- --retry-builder ${run.run_id}`);
}

async function reconcileAssignment(
  session: Session,
  spec: BlueprintSpec,
  task: AgentTask,
): Promise<{ ok: true; spec: BlueprintSpec; task: AgentTask } | { ok: false; reason: string }> {
  const { run } = session;
  let currentSpec = spec;
  let currentTask = task;
  let assignment = validateBuilderAssignment({ spec: currentSpec, task: currentTask });
  if (assignment.ok) return { ok: true, spec: currentSpec, task: currentTask };
  const snapshot = snapshotFromLoop({
    assignment,
    spec: currentSpec,
    task: currentTask,
    builderCompleted: false,
    build: "not_run",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
  });
  let state = run.supervisor ?? emptySupervisorState();
  const decision = decideSupervisor(snapshot, state);
  state = applyPlannedAction(state, decision, new Date().toISOString());
  if (decision.action !== "REPAIR_TASK" && decision.action !== "RECONCILE_SPEC_TASK") {
    run.supervisor = state;
    saveRun(run);
    return { ok: false, reason: assignment.reason };
  }
  const executed = await executeRecovery(
    decision,
    {
      snapshot,
      spec: currentSpec,
      task: currentTask,
      specPath: run.spec_path!,
      taskPath: run.task_path!,
    },
    productionRecoveryDeps(run),
  );
  currentSpec = executed.spec;
  currentTask = executed.task;
  assignment = validateBuilderAssignment({ spec: currentSpec, task: currentTask });
  run.supervisor = completeRecovery(state, executed.recovered ? "recovered" : "failed", executed.detail);
  saveRun(run);
  if (!assignment.ok) return { ok: false, reason: assignment.reason };
  console.log(`Supervisor ${decision.action}: assignment is valid. Builder was not invoked during repair.`);
  return { ok: true, spec: currentSpec, task: currentTask };
}

async function escalateIntervention(session: Session, reason: string) {
  const { run } = session;
  run.phase = "HUMAN_INTERVENTION_REQUIRED";
  persistCanonicalFinalReviewStatus(run, { disposition: HUMAN_INTERVENTION_REQUIRED });
  run.notes.push(reason);
  saveRun(run);
  session.message = reason;
  console.error(reason);
  await closeSoon(session);
}

function loopIssues(loopResultPath: string | null): NonNullable<SupervisorSnapshot["issues"]> {
  const loop = loopResultPath
    ? readJson<{ unresolved_issues?: NonNullable<SupervisorSnapshot["issues"]> }>(loopResultPath)
    : null;
  return loop?.unresolved_issues ?? [];
}

function snapshotFromReview(
  data: FinalReviewData,
  spec: BlueprintSpec,
  task: AgentTask,
  assignment: SupervisorSnapshot["assignment"],
  issues?: SupervisorSnapshot["issues"],
): SupervisorSnapshot {
  const structured = issues && issues.length > 0 ? issues : loopIssues(data.loopResultPath);
  return snapshotFromLoop({
    builderCompleted: true,
    build: data.build,
    qa: {
      status: data.qa.status,
      passed: data.qa.passed,
      failed: data.qa.failed,
      skipped: data.qa.skipped,
    },
    evaluator: {
      status: data.evaluator.status,
      decision: data.evaluator.decision,
      overall: data.evaluator.overall,
    },
    issues: structured,
    findings: data.evaluator.findings,
    criticalIssues: structured.length > 0 ? [] : data.criticalIssues,
    spec,
    task,
    assignment,
  });
}

function overlaySupervisorReview(
  data: FinalReviewData,
  snapshot: SupervisorSnapshot,
  report: FinalReviewData["supervisor"],
): FinalReviewData {
  const human = report ? humanFacingDisposition(report.recommendation) : null;
  return applyCanonicalFinalReview({
    ...data,
    disposition: human ?? data.disposition,
    build: snapshot.build ?? data.build,
    qa: {
      ...data.qa,
      status: snapshot.qa?.status ?? data.qa.status,
      passed: snapshot.qa?.passed ?? data.qa.passed,
      failed: snapshot.qa?.failed ?? data.qa.failed,
      skipped: snapshot.qa?.skipped ?? data.qa.skipped,
    },
    evaluator: {
      ...data.evaluator,
      status: snapshot.evaluator?.status ?? data.evaluator.status,
      decision: snapshot.evaluator?.decision ?? data.evaluator.decision,
      overall: snapshot.evaluator?.overall ?? data.evaluator.overall,
    },
    criticalIssues: snapshot.criticalIssues ?? data.criticalIssues,
    supervisor: report,
    requiresAuthenticatedQa: data.requiresAuthenticatedQa,
  });
}

function productionRecoveryDeps(run: RunRecord): RecoveryDeps {
  return {
    now: () => new Date().toISOString(),
    prepareAuthSession: prepareAuthenticatedSession,
    rerunQa: async (ctx) => {
      const before = listQaReports();
      await runInherited("npm run qa");
      const qa = readNewQaReport(before);
      const skipped = qa.report?.tests_skipped ?? 0;
      const issues = qa.failures.map((failure) => ({
        issue_id: failure.issue_id,
        test: failure.test,
        actual: failure.actual,
        classification: failure.classification,
      }));
      if (ctx.task.requires_authenticated_qa && skipped > 0 && !issues.some((item) => item.classification === "AUTH_SESSION_REFRESH_REQUIRED")) {
        issues.push({
          issue_id: "AUTH_SESSION_REFRESH_REQUIRED",
          test: "authenticated QA",
          actual: "AUTH_SESSION_REFRESH_REQUIRED",
          classification: "AUTH_SESSION_REFRESH_REQUIRED",
        });
      }
      const qaStatus = qa.report?.status ?? "fail";
      if (qaStatus !== "pass" || issues.length > 0) {
        return {
          qa: {
            status: qaStatus,
            passed: qa.report?.tests_passed ?? 0,
            failed: qa.report?.tests_failed ?? 0,
            skipped,
          },
          evaluator: { status: "not_run", decision: null },
          issues,
          criticalIssues: issues.map((issue) => `${issue.classification ?? "ISSUE"} · ${issue.test}: ${issue.actual}`),
        };
      }
      const evaluator = await runEvaluator({
        task: ctx.task,
        taskPath: ctx.taskPath,
        qaReportPath: qa.reportPath || "",
        qaStatus,
        testsPassed: qa.report?.tests_passed ?? 0,
        testsFailed: qa.report?.tests_failed ?? 0,
        testsSkipped: skipped,
        builderReportPath: run.loop_result ?? "",
        gitDiffSummary: "",
        outputPath: `${runReportDir(run.run_id)}/supervisor-evaluator.json`,
      });
      return {
        qa: {
          status: "pass",
          passed: qa.report?.tests_passed ?? 0,
          failed: 0,
          skipped: 0,
        },
        evaluator: {
          status: evaluator.status,
          decision: evaluator.decision,
          overall: evaluator.overall_score,
        },
        findings: evaluator.findings,
        issues: [],
        criticalIssues: [],
      };
    },
    rerunBuilder: async (ctx) => {
      console.log("Supervisor rerunning Builder: npm run agent:run -- " + ctx.taskPath);
      const before = listLoopDirs();
      await runInherited(`npm run agent:run -- ${ctx.taskPath}`);
      const loopDir = listLoopDirs().find(
        (dir) => !before.includes(dir) && dir.endsWith(`-${path.basename(ctx.taskPath, ".json")}`),
      );
      const nextLoop = loopDir ? `${LOOPS_DIR}/${loopDir}/loop-result.json` : null;
      const loopResultPath = nextLoop && fs.existsSync(nextLoop) ? nextLoop : null;
      const data = finalReviewData(run, ctx.spec, loopResultPath);
      return { ...snapshotFromReview(data, ctx.spec, ctx.task, { ok: true }), loopResultPath };
    },
    writeAssignment: (nextSpec, nextTask, specPath, taskPath) => {
      writeJson(specPath, nextSpec);
      writeJson(taskPath, nextTask);
    },
  };
}

async function finalReview(session: Session) {
  const { run } = session;
  const data = session.finalData!;
  session.message = "";
  const file = `${runReportDir(run.run_id)}/final-review.html`;
  fs.writeFileSync(file, renderFinalReview({ run, data, state: dashboardState(session), token: "" }));
  run.dashboard_file = file;
  saveRun(run);
  console.log("");
  console.log(data.disposition);
  console.log("Atlas final review ready:");
  console.log(session.server!.url);
  console.log(`Final review file: ${file}`);
  console.log("");
  console.log("Waiting for final human review...");
  const decision = await waitForFinalDecision(session);
  run.final_review_decision = decision.decision;
  run.final_review_file = `${runMemoryDir(run.run_id)}/final-review.json`;
  run.phase = run.commerce?.statuses.includes("READY_FOR_PREVIEW") ? "READY_FOR_PREVIEW" : "FINISHED";
  saveRun(run);
  fs.writeFileSync(file, renderFinalReview({ run, data, state: dashboardState(session), token: "" }));
  console.log(`Final review: ${decision.decision}`);
  console.log("Committed: false. Pushed: false. Published: false.");
  await closeSoon(session);
}

function finalReviewData(run: RunRecord, spec: BlueprintSpec, loopResultPath: string | null): FinalReviewData {
  type LoopResult = {
    disposition: string;
    iterations_used: number;
    max_iterations: number;
    files_changed: string[];
    qa_result: { status: string; tests_passed: number; tests_failed: number; tests_skipped: number; report: string | null } | null;
    unresolved_issues: { issue_id: string; test: string; actual: string; classification?: string }[];
    evaluator_result: {
      status: string;
      reason: string;
      decision: string | null;
      overall_score: number | null;
      evaluation_file: string | null;
      scores: { dimension: string; score: number }[] | null;
    } | null;
    iterations: { validate?: string; build?: string }[];
  };
  const loop = loopResultPath ? readJson<LoopResult>(loopResultPath) : null;
  const report = loop?.evaluator_result?.evaluation_file
    ? readJson<{ findings: { finding_id: string; severity: string; description: string; recommendation: string }[] }>(
        loop.evaluator_result.evaluation_file,
      )
    : null;
  const findings = (report?.findings ?? []).map((finding) => ({
    id: finding.finding_id,
    severity: finding.severity,
    description: finding.description,
    recommendation: finding.recommendation,
  }));
  const last = loop?.iterations.at(-1);
  const critical = [
    ...(loop?.unresolved_issues ?? []).map(
      (issue) => `${issue.classification ?? "ISSUE"} · ${issue.test}: ${issue.actual}`,
    ),
    ...findings
      .filter((finding) => finding.severity === "CRITICAL" || finding.severity === "HIGH")
      .map((finding) => `Evaluator ${finding.severity} · ${finding.id}: ${finding.description}`),
  ];
  if (!loop) critical.unshift("The agent loop did not produce a loop-result.json.");
  return applyCanonicalFinalReview({
    blueprintName: spec.name,
    candidateId: spec.id,
    specPath: run.spec_path ?? "",
    taskPath: run.task_path ?? "",
    loopResultPath,
    disposition: "PENDING_SUPERVISOR",
    iterationsUsed: loop?.iterations_used ?? 0,
    maxIterations: loop?.max_iterations ?? 3,
    filesChanged: loop?.files_changed ?? [],
    validate: last?.validate ?? "not_run",
    build: last?.build ?? "not_run",
    qa: {
      status: loop?.qa_result?.status ?? "not_run",
      passed: loop?.qa_result?.tests_passed ?? 0,
      failed: loop?.qa_result?.tests_failed ?? 0,
      skipped: loop?.qa_result?.tests_skipped ?? 0,
      report: loop?.qa_result?.report ?? null,
    },
    evaluator: {
      status: loop?.evaluator_result?.status ?? "not_run",
      decision: loop?.evaluator_result?.decision ?? null,
      overall: loop?.evaluator_result?.overall_score ?? null,
      reason: loop?.evaluator_result?.reason ?? "The Evaluator runs only after QA passes.",
      reportPath: loop?.evaluator_result?.evaluation_file ?? null,
      scores: loop?.evaluator_result?.scores ?? [],
      findings,
    },
    criticalIssues: critical.map((item) => redact(item)),
    sampleInput: spec.guided_demo.sample_input,
    sampleOutput: spec.guided_demo.sample_output,
    suggestedPriceCents: suggestPriceCents(candidateValue(run, spec.id)),
    suggestedPaymentType: "ONE_TIME",
    commercialRationale: candidateRationale(run, spec.id),
    requiresAuthenticatedQa: spec.qa_checks.some((check) => check.requires_auth) ?? true,
    supervisor: run.supervisor?.last_report ?? null,
  });
}

function candidateValue(run: RunRecord, candidateId: string): string {
  return loadRunCandidates(run.run_id).find((item) => item.id === candidateId)?.estimated_premium_value ?? "";
}

function candidateRationale(run: RunRecord, candidateId: string): string {
  return (
    loadRunCandidates(run.run_id).find((item) => item.id === candidateId)?.why_pay ??
    "One-time Premium Blueprint for this workflow."
  );
}

function postDecision(session: Session, body: Record<string, unknown>) {
  const { run } = session;
  if (run.approved_candidate_id) {
    return { status: 409, body: { error: "A candidate is already approved for this run. Only one Blueprint is built per run." } };
  }
  if (session.ended) return { status: 409, body: { error: "This review has ended." } };
  const candidate = session.candidates.find((item) => item.id === body.candidate_id);
  if (!candidate) return { status: 400, body: { error: "Unknown candidate." } };
  const decision = body.decision as CandidateDecisionValue;
  if (!CANDIDATE_DECISIONS.includes(decision)) return { status: 400, body: { error: "Unknown decision." } };
  recordCandidateDecision(session, candidate, decision, typeof body.note === "string" ? body.note : "", "dashboard");
  return { status: 200, body: dashboardState(session) };
}

function recordCandidateDecision(
  session: Session,
  candidate: ScoredCandidate,
  decision: CandidateDecisionValue,
  note: string,
  source: CandidateDecision["source"],
) {
  const { run } = session;
  const record: CandidateDecision = {
    schema_version: "atlas-auto-decision-v1",
    run_id: run.run_id,
    candidate_id: candidate.id,
    candidate_name: candidate.name,
    decision,
    note: redact(note.slice(0, 2000)),
    decided_at: new Date().toISOString(),
    source,
  };
  appendDecision(record);
  const history = loadHistory();
  setStatus(history, {
    id: candidate.id,
    name: candidate.name,
    status: decision,
    runId: run.run_id,
    note: record.note || `${decision} from the ${source}.`,
  });
  saveHistory(history);
  if (decision === "APPROVED") {
    writeJson(run.approval_file, record);
    run.approved_candidate_id = candidate.id;
    session.message =
      run.mode === "dry-run"
        ? `Dry run: ${candidate.name} approved and recorded. Nothing will be built.`
        : `${candidate.name} approved. Atlas is writing the spec and starting the Builder. Watch the terminal.`;
    saveRun(run);
  }
  console.log(`Decision recorded: ${decision} ${candidate.id}`);
  writeCandidateSnapshot(session);
}

function postEndReview(session: Session) {
  if (session.run.approved_candidate_id) return { status: 409, body: { error: "A candidate is already approved." } };
  session.ended = true;
  session.message = "Review ended without approving a candidate. Hold and reject decisions are saved for future research.";
  return { status: 200, body: dashboardState(session) };
}

async function postFinalReview(session: Session, body: Record<string, unknown>) {
  if (!session.finalData) return { status: 409, body: { error: "The Blueprint has not been built yet." } };
  if (session.finalDecision) return { status: 409, body: { error: "A final decision is already recorded." } };
  const decision = body.decision as FinalDecisionValue;
  if (!FINAL_DECISIONS.includes(decision)) return { status: 400, body: { error: "Unknown decision." } };
  const note = typeof body.note === "string" ? body.note : "";
  if (decision !== "APPROVE_PRODUCT_AND_PRICE") {
    recordFinalDecision(session, decision, note, null);
    return { status: 200, body: dashboardState(session) };
  }
  if (
    !canApproveProductAndPrice(session.finalData)
  ) {
    return { status: 409, body: { error: "Build, QA, and Evaluator must complete successfully before the product and price can be approved." } };
  }
  const amount = parseApprovedAmount({ choice: body.price_choice, customDollars: body.custom_dollars });
  if (!amount.ok) return { status: 400, body: { error: amount.error } };
  const provisioned = await approveProductAndPrice(session, amount.cents, note);
  if (!provisioned.ok) return { status: provisioned.status, body: { error: provisioned.error } };
  return { status: 200, body: dashboardState(session) };
}

async function approveProductAndPrice(
  session: Session,
  approvedCents: number,
  note: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const data = session.finalData!;
  const existing =
    (await readMergedRegistry()).find(
      (item) =>
        item.product_slug === data.candidateId &&
        item.market === "US" &&
        item.locale === "en" &&
        item.currency === "usd" &&
        item.stripe_environment === "SANDBOX",
    ) ?? null;
  const key = usSandboxSecret();
  const stripe: SandboxStripe = {
    async findProductBySlug() {
      throw new Error("Stripe lookup was not configured.");
    },
    async findPrice() {
      throw new Error("Stripe lookup was not configured.");
    },
    async createProduct() {
      throw new Error("Stripe create was not configured.");
    },
    async createPrice() {
      throw new Error("Stripe create was not configured.");
    },
  };
  const sandboxKey = key.startsWith("sk_test_") || key.startsWith("rk_test_");
  const client = session.run.mode === "dry-run" || !sandboxKey ? stripe : sandboxStripe(new Stripe(key));
  const result = await provisionSandboxProduct({
    humanApproved: true,
    stripeKey: session.run.mode === "dry-run" ? key : key,
    dryRun: session.run.mode === "dry-run",
    slug: data.candidateId,
    name: data.blueprintName,
    approvedAmountCents: approvedCents,
    suggestedAmountCents: data.suggestedPriceCents,
    rationale: data.commercialRationale,
    existing,
    stripe: client,
  });
  if (!result.ok) {
    return {
      ok: false,
      status: result.code === "LIVE_STRIPE_PROVISIONING_BLOCKED" ? 409 : 503,
      error: result.code,
    };
  }
  if (result.row) await saveRegistryRow(result.row);
  const commerce: CommerceRecord = {
    schema_version: "atlas-commerce-v1",
    run_id: session.run.run_id,
    product_slug: data.candidateId,
    product_name: data.blueprintName,
    suggested_price_cents: data.suggestedPriceCents,
    approved_price_cents: approvedCents,
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    statuses: result.statuses,
    provisioning: result.dryRun ? "not_started" : result.reused ? "reused" : "created",
    committed: false,
    pushed: false,
    published: false,
    decided_at: new Date().toISOString(),
  };
  writeJson(`${runMemoryDir(session.run.run_id)}/commerce.json`, commerce);
  session.run.commerce = commerce;
  recordFinalDecision(session, "APPROVE_PRODUCT_AND_PRICE", note, approvedCents);
  session.message = result.dryRun
    ? "Price approved for this dry run. Stripe was not called. Nothing was published, committed, or pushed."
    : result.reused
      ? "Price approved. The existing Sandbox product was reused. Nothing was published, committed, or pushed."
      : "Price approved. Stripe Sandbox product and price are recorded. Ready for preview. Nothing was published, committed, or pushed.";
  return { ok: true };
}

function recordFinalDecision(
  session: Session,
  decision: FinalDecisionValue,
  note: string,
  approvedCents: number | null,
) {
  const { run } = session;
  const data = session.finalData!;
  const record: FinalReviewDecision = {
    schema_version: "atlas-auto-final-review-v1",
    run_id: run.run_id,
    candidate_id: data.candidateId,
    decision,
    note: redact(note.slice(0, 2000)),
    decided_at: new Date().toISOString(),
    published: false,
    committed: false,
    suggested_price_cents: data.suggestedPriceCents,
    approved_price_cents: approvedCents,
  };
  writeJson(`${runMemoryDir(run.run_id)}/final-review.json`, record);
  session.finalDecision = record;
  const history = loadHistory();
  setStatus(history, {
    id: data.candidateId,
    name: data.blueprintName,
    status:
      decision === "APPROVED_FOR_LATER_PUBLISHING" || decision === "APPROVE_PRODUCT_AND_PRICE"
        ? "COMPLETED"
        : decision === "REJECTED"
          ? "REJECTED"
          : "BUILT",
    runId: run.run_id,
    note: record.note || `Final review: ${decision}.`,
  });
  saveHistory(history);
  if (decision !== "APPROVE_PRODUCT_AND_PRICE") {
    session.message =
      decision === "APPROVED_FOR_LATER_PUBLISHING"
        ? "Approved for later publishing. Nothing was published, committed, or pushed."
        : decision === "CHANGES_REQUESTED"
          ? "Changes requested. The working copy is left as-is for the next task."
          : "Rejected. The working copy is left as-is; nothing was committed.";
  }
}

function waitForApproval(session: Session): Promise<void> {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (session.ended || session.run.approved_candidate_id) {
        clearInterval(timer);
        resolve();
        return;
      }
      const file = readJson<Partial<CandidateDecision>>(session.run.approval_file);
      if (file?.decision === "APPROVED") {
        const candidate = session.candidates.find((item) => item.id === file.candidate_id);
        if (candidate) {
          recordCandidateDecision(session, candidate, "APPROVED", file.note ?? "Approved by writing approval.json.", "file");
        } else {
          console.error(`Ignoring ${session.run.approval_file}: unknown candidate ${file.candidate_id}.`);
          fs.renameSync(session.run.approval_file, `${session.run.approval_file}.invalid`);
        }
      }
    }, 1000);
  });
}

function waitForFinalDecision(session: Session): Promise<FinalReviewDecision> {
  const file = `${runMemoryDir(session.run.run_id)}/final-review.json`;
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (!session.finalDecision) {
        const written = readJson<Partial<FinalReviewDecision>>(file);
        if (written?.decision && FINAL_DECISIONS.includes(written.decision)) {
          recordFinalDecision(session, written.decision, written.note ?? "", written.approved_price_cents ?? null);
        }
      }
      if (session.finalDecision) {
        clearInterval(timer);
        resolve(session.finalDecision);
      }
    }, 1000);
  });
}

function dashboardState(session: Session): DashboardState {
  const decisions = latestDecisions(loadDecisions(session.run.run_id));
  return {
    phase: session.run.phase,
    mode: session.run.mode,
    locked: Boolean(session.run.approved_candidate_id) || session.ended,
    final_locked: Boolean(session.finalDecision),
    approved_candidate_id: session.run.approved_candidate_id,
    decisions: Object.fromEntries(
      [...decisions.entries()].map(([id, decision]) => [
        id,
        { decision: decision.decision, note: decision.note, decided_at: decision.decided_at },
      ]),
    ),
    final_review: session.finalDecision
      ? {
          decision: session.finalDecision.decision,
          note: session.finalDecision.note,
          decided_at: session.finalDecision.decided_at,
        }
      : null,
    commerce_statuses: session.run.commerce?.statuses ?? [],
    message: session.message,
    price_approval_enabled: session.finalData ? canApproveProductAndPrice(session.finalData) : false,
  };
}

function candidatePage(session: Session): string {
  return renderCandidateDashboard({
    run: session.run,
    candidates: session.candidates,
    state: dashboardState(session),
    token: session.token,
  });
}

function finalPage(session: Session): string {
  return renderFinalReview({
    run: session.run,
    data: session.finalData!,
    state: dashboardState(session),
    token: session.token,
  });
}

/** Static copy on disk. It carries no token, so it cannot record decisions. */
function writeCandidateSnapshot(session: Session) {
  const file = `${runReportDir(session.run.run_id)}/candidates.html`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    renderCandidateDashboard({
      run: session.run,
      candidates: session.candidates,
      state: dashboardState(session),
      token: "",
    }),
  );
  if (!session.finalData) {
    session.run.dashboard_file = file;
    saveRun(session.run);
  }
}

function printCandidates(session: Session) {
  console.log("");
  console.log(`Candidates (research: ${session.run.research_source}, scoring: ${session.run.scoring_source})`);
  console.log("Rank  Overall  Commercial  AtlasFit  Buildability  Candidate");
  for (const candidate of session.candidates) {
    const s = candidate.summary_scores;
    console.log(
      `${String(candidate.rank).padEnd(6)}${s.overall.toFixed(2).padEnd(9)}${s.commercial.toFixed(1).padEnd(12)}${s.atlas_fit.toFixed(1).padEnd(10)}${s.buildability.toFixed(1).padEnd(14)}${candidate.name}`,
    );
  }
  for (const item of session.run.filtered_candidates) console.log(`Filtered: ${item.name} — ${item.reason}`);
}

function finishDryRun(session: Session, baseline: ReturnType<typeof captureBaseline>, loopsBefore: string[], head: string) {
  const { run } = session;
  const changed = changesSince(baseline)
    .map((change) => change.path)
    .filter((file) => !file.startsWith(`${MEMORY_DIR}/`));
  const newLoops = listLoopDirs().filter((dir) => !loopsBefore.includes(dir));
  const headChanged = currentHead() !== head;
  console.log("");
  console.log("DRY RUN COMPLETE");
  console.log(`Candidates: ${session.candidates.length}`);
  console.log(`Dashboard file: ${run.dashboard_file}`);
  if (run.dashboard_url) console.log(`Dashboard URL (while served): ${run.dashboard_url}`);
  console.log(`Run memory: ${runMemoryDir(run.run_id)}/`);
  console.log(`Builder ran: ${run.builder_ran || newLoops.length > 0 ? "YES" : "no"}`);
  console.log(`Product files changed: ${changed.length === 0 ? "none" : changed.join(", ")}`);
  console.log(`Commits created: ${headChanged ? "YES" : "none"}`);
  if (changed.length > 0 || newLoops.length > 0 || headChanged || run.builder_ran) {
    run.notes.push("Dry-run safety check failed.");
    saveRun(run);
    process.exit(1);
  }
}

async function closeSoon(session: Session) {
  if (!session.server) return;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await session.server.close();
  session.server = null;
}

function runInherited(command: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: process.cwd(),
      shell: true,
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, ATLAS_SUPERVISOR_MANAGED: "1" },
    });
    const forward = (stream: NodeJS.ReadableStream | null, dest: NodeJS.WriteStream) => {
      if (!stream) return;
      let leftover = "";
      stream.on("data", (chunk: Buffer) => {
        const parts = (leftover + chunk.toString()).split(/\r?\n/);
        leftover = parts.pop() ?? "";
        for (const line of parts) {
          const kept = redactChildHumanStatusLine(line);
          if (kept !== null) dest.write(`${kept}\n`);
        }
      });
      stream.on("end", () => {
        if (!leftover) return;
        const kept = redactChildHumanStatusLine(leftover);
        if (kept !== null) dest.write(kept);
      });
    };
    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

function listLoopDirs(): string[] {
  if (!fs.existsSync(LOOPS_DIR)) return [];
  return fs.readdirSync(LOOPS_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
