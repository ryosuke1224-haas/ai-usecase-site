import assert from "node:assert/strict";
import { guardChanges } from "../atlas-agent/guards";
import { escapeHtml } from "./dashboard";
import { setStatus } from "./memory";
import { isSameIdea, summarize } from "./scoring";
import { blueprintPaths, buildTask } from "./spec";
import {
  classifyFailure,
  countHumanStatusToken,
  decideSupervisor,
  emptySupervisorState,
  HUMAN_REVIEW_REQUIRED,
  humanFacingDisposition,
  isReadyForHumanReview,
  snapshotFromLoop,
  supervisorUserFacingLines,
} from "./supervisor";
import { dryRunSecurityRetryAssignment } from "./orchestration";
import { CRITERIA, type CandidateHistory, type Criterion } from "./types";

function criteria(value: number, overrides: Partial<Record<Criterion, number>> = {}) {
  return { ...Object.fromEntries(CRITERIA.map((key) => [key, value])), ...overrides } as Record<Criterion, number>;
}

function checkScoring() {
  assert.deepEqual(summarize(criteria(8)), { commercial: 8, atlas_fit: 8, buildability: 8, overall: 8 });
  const s = summarize(criteria(6, { smb_value: 10, willingness_to_pay: 10, frequency: 10, smb_breadth: 10 }));
  assert.equal(s.commercial, 10);
  assert.equal(s.overall, 7.6);
}

function checkDedupe() {
  assert.ok(isSameIdea({ id: "a", name: "AI Collections Assistant" }, { id: "b", name: "Collections Assistant" }));
  assert.ok(isSameIdea({ id: "x", name: "One" }, { id: "x", name: "Two" }));
  assert.ok(!isSameIdea({ id: "quote-intake", name: "Quote Request Triage" }, { id: "expense-watch", name: "Expense Watchdog" }));
}

function checkHistoryKeepsHumanDecisions() {
  const history: CandidateHistory = { schema_version: "atlas-candidate-history-v1", updated_at: "", candidates: [] };
  setStatus(history, { id: "c", name: "C", status: "HOLD", runId: "r1", note: "" });
  setStatus(history, { id: "c", name: "C", status: "PROPOSED", runId: "r2", note: "" });
  assert.equal(history.candidates[0].status, "HOLD");
  setStatus(history, { id: "c", name: "C", status: "REJECTED", runId: "r2", note: "" });
  assert.equal(history.candidates[0].status, "REJECTED");
  assert.deepEqual(history.candidates[0].runs, ["r1", "r2"]);
}

function checkEscaping() {
  assert.equal(escapeHtml(`<script>"x"&'y'</script>`), "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
}

function checkGeneratedTask() {
  const task = buildTask({
    id: "sample-blueprint",
    name: "Sample",
    kit_contents: [{ id: "a", title: "A", purpose: "p" }],
    acceptance_criteria: ["One"],
  });
  const paths = blueprintPaths("sample-blueprint");
  assert.equal(task.max_iterations, 3);
  assert.equal(task.target_use_case, "sample-blueprint");
  const guarded = guardChanges({
    changes: [
      { path: `${paths.route}page.tsx`, before: null, after: "x" },
      { path: `${paths.tests}public.spec.ts`, before: null, after: "expect(1)" },
      { path: "e2e/daily-inbox-briefing/public.spec.ts", before: "expect(1)", after: "expect(1);" },
      { path: "src/lib/blueprints.ts", before: "a", after: "b" },
      { path: "app/blueprints/daily-inbox-briefing/starter-kit/page.tsx", before: "a", after: "b" },
      { path: `${paths.tests}skip.spec.ts`, before: null, after: "test.skip()" },
    ],
    scope: task.scope,
    forbidden: task.forbidden_changes,
    permitsQaChanges: task.permits_qa_changes,
    taskPath: paths.task,
    protectedFiles: task.protected_files,
  });
  assert.deepEqual(guarded.keep, [`${paths.route}page.tsx`, `${paths.tests}public.spec.ts`]);
  assert.equal(guarded.restore.length, 4);
}

function checkSupervisorGatesHumanReview() {
  const incomplete = snapshotFromLoop({
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
  });
  const incompleteDecision = decideSupervisor(incomplete, emptySupervisorState());
  assert.notEqual(humanFacingDisposition(incompleteDecision.recommendation), "HUMAN_REVIEW_REQUIRED");
  assert.equal(isReadyForHumanReview(incomplete), false);
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "AUTH_SESSION_REFRESH_REQUIRED", classification: "AUTH_SESSION_REFRESH_REQUIRED" }],
      }),
    ),
    "AUTH_SESSION_FAILURE",
  );
  const ready = snapshotFromLoop({
    build: "pass",
    qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
    evaluator: { status: "executed", decision: "PASS", overall: 9 },
    task: {
      requires_authenticated_qa: true,
      scope: ["app/"],
      forbidden_changes: [],
      acceptance_criteria: ["ok"],
    },
    assignment: { ok: true },
  });
  const readyDecision = decideSupervisor(ready, emptySupervisorState());
  assert.equal(readyDecision.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.equal(humanFacingDisposition(readyDecision.recommendation), "HUMAN_REVIEW_REQUIRED");
  const failedLines = supervisorUserFacingLines(incompleteDecision).join("\n");
  assert.equal(countHumanStatusToken(failedLines, HUMAN_REVIEW_REQUIRED), 0);
  const readyLines = supervisorUserFacingLines(readyDecision).join("\n");
  assert.equal(countHumanStatusToken(readyLines, HUMAN_REVIEW_REQUIRED), 1);
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        build: "fail",
        issues: [
          {
            issue_id: "build",
            classification: "BUILD_FAILURE",
            actual: "Type error in scripts/atlas-auto/supervisor.ts",
            relevant_files: ["scripts/atlas-auto/supervisor.ts"],
          },
        ],
      }),
    ),
    "ORCHESTRATION_FAILURE",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [
          {
            issue_id: "AUTH_SESSION_REFRESH_REQUIRED",
            classification: "AUTH_SESSION_REFRESH_REQUIRED",
          },
        ],
        qa: { status: "not_run" },
      }),
    ),
    "AUTH_SESSION_FAILURE",
  );
  const unexpectedSecret = decideSupervisor(
    snapshotFromLoop({
      issues: [{ issue_id: "secret-file-modified", classification: "SCOPE_VIOLATION" }],
      qa: { status: "not_run" },
    }),
    emptySupervisorState(),
  );
  assert.equal(unexpectedSecret.classification, "ORCHESTRATION_FAILURE");
  assert.equal(unexpectedSecret.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(unexpectedSecret.invokeBuilder, false);
}

export function runAutoSelfCheck(): void {
  checkScoring();
  checkDedupe();
  checkHistoryKeepsHumanDecisions();
  checkEscaping();
  checkGeneratedTask();
  checkSupervisorGatesHumanReview();
  checkSecurityRetryDryRun();
  console.log("Atlas Auto self-check passed.");
}

function checkSecurityRetryDryRun() {
  const dry = dryRunSecurityRetryAssignment();
  assert.equal(dry.ok, true);
  assert.equal(dry.specLoaded, true);
  assert.equal(dry.taskLoaded, true);
  assert.deepEqual(dry.scopeForbiddenConflict, []);
  assert.equal(dry.protectedAuthReadOnly, true);
  assert.equal(dry.sessionRefreshTripsSecretGuard, false);
  assert.equal(dry.incompleteOpensFinalReview, false);
}
