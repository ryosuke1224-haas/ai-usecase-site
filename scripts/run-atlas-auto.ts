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
import { redact } from "./atlas-agent/redact";
import { captureBaseline, changesSince, currentBranch, currentHead } from "./atlas-agent/workspace";
import {
  renderCandidateDashboard,
  renderFinalReview,
  type DashboardState,
  type FinalReviewData,
} from "./atlas-auto/dashboard";
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
import { runAutoSelfCheck } from "./atlas-auto/self-check";
import { startReviewServer, type ReviewServer } from "./atlas-auto/server";
import { runSpecAgent, writeBuildTask, type BlueprintSpec } from "./atlas-auto/spec";
import {
  CANDIDATE_DECISIONS,
  FINAL_DECISIONS,
  type CandidateDecision,
  type CandidateDecisionValue,
  type FinalDecisionValue,
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
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  if (args.includes("--self-check")) {
    runAutoSelfCheck();
    return;
  }
  const resumeIndex = args.indexOf("--resume");
  const options: Options = {
    dryRun: args.includes("--dry-run"),
    offline: args.includes("--offline"),
    serve: !args.includes("--no-serve"),
    resume: resumeIndex >= 0 ? args[resumeIndex + 1] ?? null : null,
  };
  if (resumeIndex >= 0 && !options.resume) fail("Usage: npm run atlas:auto -- --resume <run-id>");

  const branch = currentBranch();
  if (branch !== REQUIRED_BRANCH) {
    fail(`Refusing to run on ${branch || "a detached commit"}. Atlas Auto only runs on ${REQUIRED_BRANCH}.`);
  }
  const head = currentHead();
  const baseline = captureBaseline();
  const loopsBefore = listLoopDirs();

  const session = options.resume ? resumeSession(options) : await newSession(options, branch);
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
  await finalReview(session);
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
  if (run.phase === "FINISHED") fail(`Run ${runId} is already finished.`);
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
    if (spec) session.finalData = finalReviewData(run, spec, run.loop_result);
  }
  console.log("Atlas Auto v1");
  console.log(`Resuming run: ${runId} (${run.phase})`);
  saveRun(run);
  return session;
}

async function buildApproved(session: Session, approved: ScoredCandidate) {
  const { run } = session;
  const reportDir = runReportDir(run.run_id);
  const approval = readJson<CandidateDecision>(run.approval_file)!;
  session.message = `${approved.name} approved. Writing the Blueprint spec, then running Builder → Build → QA → Evaluator. Watch the terminal; this page switches to the final review when the loop finishes.`;

  run.phase = "SPEC";
  saveRun(run);
  let spec: BlueprintSpec;
  try {
    const result = await runSpecAgent({ candidate: approved, approval, runId: run.run_id, reportDir });
    spec = result.spec;
    run.spec_path = result.specPath;
    const { taskPath } = writeBuildTask(spec);
    run.task_path = taskPath;
    console.log(`Spec: ${result.specPath}`);
    console.log(`Task: ${taskPath}`);
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

  session.finalData = finalReviewData(run, spec, run.loop_result);
  run.loop_disposition = session.finalData.disposition;
  const history = loadHistory();
  setStatus(history, {
    id: approved.id,
    name: approved.name,
    status: session.finalData.filesChanged.length > 0 ? "BUILT" : "APPROVED",
    runId: run.run_id,
    note: `Agent loop finished: ${session.finalData.disposition}. QA ${session.finalData.qa.status}. Evaluator ${session.finalData.evaluator.overall ?? "n/a"}.`,
  });
  saveHistory(history);
  run.phase = "AWAITING_FINAL_REVIEW";
  saveRun(run);
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
  run.phase = "FINISHED";
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
  return {
    blueprintName: spec.name,
    candidateId: spec.id,
    specPath: run.spec_path ?? "",
    taskPath: run.task_path ?? "",
    loopResultPath,
    disposition: loop?.disposition ?? "HUMAN_REVIEW_REQUIRED",
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
  };
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

function postFinalReview(session: Session, body: Record<string, unknown>) {
  if (!session.finalData) return { status: 409, body: { error: "The Blueprint has not been built yet." } };
  if (session.finalDecision) return { status: 409, body: { error: "A final decision is already recorded." } };
  const decision = body.decision as FinalDecisionValue;
  if (!FINAL_DECISIONS.includes(decision)) return { status: 400, body: { error: "Unknown decision." } };
  recordFinalDecision(session, decision, typeof body.note === "string" ? body.note : "");
  return { status: 200, body: dashboardState(session) };
}

function recordFinalDecision(session: Session, decision: FinalDecisionValue, note: string) {
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
  };
  writeJson(`${runMemoryDir(run.run_id)}/final-review.json`, record);
  session.finalDecision = record;
  const history = loadHistory();
  setStatus(history, {
    id: data.candidateId,
    name: data.blueprintName,
    status: decision === "APPROVED_FOR_LATER_PUBLISHING" ? "COMPLETED" : decision === "REJECTED" ? "REJECTED" : "BUILT",
    runId: run.run_id,
    note: record.note || `Final review: ${decision}.`,
  });
  saveHistory(history);
  session.message =
    decision === "APPROVED_FOR_LATER_PUBLISHING"
      ? "Approved for later publishing. Nothing was published, committed, or pushed."
      : decision === "CHANGES_REQUESTED"
        ? "Changes requested. The working copy is left as-is for the next task."
        : "Rejected. The working copy is left as-is; nothing was committed.";
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
          recordFinalDecision(session, written.decision, written.note ?? "");
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
    message: session.message,
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
    const child = spawn(command, { cwd: process.cwd(), shell: true, stdio: "inherit", env: process.env });
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
