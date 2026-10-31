import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { guardChanges } from "../atlas-agent/guards";
import { escapeHtml } from "./dashboard";
import { ATOMIC_WRITE_FAILED, writeAtomicJson } from "./atomic-write";
import {
  PENDING_SUPERVISOR,
  applyCanonicalFinalReview,
  canonicalFinalReviewStatus,
  isContradictoryFinalReview,
} from "./final-review-status";
import {
  planProductPriceResume,
  recoverApprovedAmountCents,
} from "./product-price-approval";
import { canApproveProductAndPrice } from "./retry-builder";
import { setStatus, writeJson } from "./memory";
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
import { loadAtlasLocalEnv } from "./local-env";
import { dryRunSecurityRetryAssignment } from "./orchestration";
import {
  BATCH_CANARY_CHECKPOINT,
  BATCH_HUMAN_REVIEW_REQUIRED,
  CANARY_CHECKPOINT,
  canEnterBatchReview,
  createBatch,
  parseBatchCli,
  shouldPauseForCanary,
} from "./batch";
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
  checkLocalEnvLoaderDoesNotReturnSecrets();
  checkAtomicJsonWrite();
  checkFinalReviewStatusInvariant();
  checkProductPriceApprovalRecovery();
  checkBatchReviewMode();
  console.log("Atlas Auto self-check passed.");
}

function checkBatchReviewMode() {
  assert.equal(parseBatchCli([]).batchSize, null);
  assert.equal(parseBatchCli([]).canarySuccessCount, null);
  assert.equal(parseBatchCli(["--batch", "8"]).batchSize, 8);
  assert.equal(parseBatchCli(["--batch", "8"]).canarySuccessCount, null);
  assert.equal(parseBatchCli(["--batch", "8", "--canary", "2"]).canarySuccessCount, 2);
  assert.match(parseBatchCli(["--canary", "2"]).error ?? "", /--batch/);
  const incomplete = {
    disposition: HUMAN_REVIEW_REQUIRED,
    build: "fail",
    qa: { status: "fail", passed: 0, failed: 1, skipped: 0, report: null },
    evaluator: { status: "not_run", decision: null, overall: null, reason: "", reportPath: null, scores: [], findings: [] },
    supervisor: { recommendation: "HUMAN_INTERVENTION_REQUIRED", blockingFindings: 1, authenticatedQa: "fail" },
    requiresAuthenticatedQa: true,
    criticalIssues: ["fail"],
  };
  assert.equal(canEnterBatchReview(incomplete as never), false);
  const batch = createBatch({ batchId: "self-check", requestedSuccessCount: 8, now: "t" });
  assert.notEqual(batch.phase, BATCH_HUMAN_REVIEW_REQUIRED);
  assert.notEqual(batch.phase, CANARY_CHECKPOINT);
  assert.equal(batch.canary_success_count, null);
  assert.equal(shouldPauseForCanary(batch), false);
  assert.equal(batch.stripe_invoked_during_build, false);
  const canary = createBatch({ batchId: "self-check-canary", requestedSuccessCount: 8, canarySuccessCount: 2, now: "t" });
  assert.equal(canary.canary_success_count, 2);
  assert.equal(canary.canary_passed, false);
  assert.notEqual(BATCH_CANARY_CHECKPOINT, BATCH_HUMAN_REVIEW_REQUIRED);
}

function checkProductPriceApprovalRecovery() {
  assert.equal(
    recoverApprovedAmountCents({
      finalReview: { decision: "APPROVE_PRODUCT_AND_PRICE", approved_price_cents: 4900 },
    }),
    4900,
  );
  assert.equal(recoverApprovedAmountCents({}), null);
  const plan = planProductPriceResume(
    {
      phase: "READY_FOR_PREVIEW",
      status: "HUMAN_REVIEW_REQUIRED",
      final_review_decision: "APPROVE_PRODUCT_AND_PRICE",
      commerce: {
        schema_version: "atlas-commerce-v1",
        run_id: "r",
        product_slug: "security-readiness-action-pack",
        product_name: "Security",
        suggested_price_cents: 4900,
        approved_price_cents: 4900,
        payment_type: "ONE_TIME",
        stripe_environment: "SANDBOX",
        statuses: ["READY_FOR_PREVIEW"],
        provisioning: "created",
        committed: false,
        pushed: false,
        published: false,
        decided_at: "t",
      },
    },
    { decision: "APPROVE_PRODUCT_AND_PRICE", approved_price_cents: 4900 },
  );
  assert.equal(plan.kind, "already_complete");
  assert.equal(plan.invokeBuilder, false);
  assert.equal(plan.invokeQa, false);
  assert.equal(plan.invokeEvaluator, false);
  assert.equal(plan.invokeStripe, false);
}

function checkFinalReviewStatusInvariant() {
  const ready = {
    disposition: PENDING_SUPERVISOR,
    build: "pass",
    qa: { status: "pass", skipped: 0 },
    evaluator: { status: "executed", decision: "PASS" },
    supervisor: { recommendation: "READY_FOR_HUMAN_REVIEW" },
  };
  assert.equal(isContradictoryFinalReview(ready), true);
  const fixed = applyCanonicalFinalReview(ready);
  assert.equal(fixed.disposition, HUMAN_REVIEW_REQUIRED);
  assert.equal(isContradictoryFinalReview(fixed), false);
  assert.equal(canonicalFinalReviewStatus(fixed), HUMAN_REVIEW_REQUIRED);
  assert.equal(canApproveProductAndPrice({ ...ready, disposition: PENDING_SUPERVISOR }), false);
  assert.equal(canApproveProductAndPrice({ ...ready, disposition: HUMAN_REVIEW_REQUIRED }), true);
}

function checkAtomicJsonWrite() {
  const file = `${os.tmpdir().replace(/\\/g, "/")}/atlas-atomic-self-check.json`;
  writeJson(file, { ok: true });
  assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).ok, true);
  const io = {
    mkdirSync() {},
    writeFileSync() {},
    renameSync() {
      throw Object.assign(new Error("EPERM"), { code: "EPERM" });
    },
    unlinkSync() {},
    existsSync() {
      return true;
    },
    readdirSync() {
      return [];
    },
  };
  assert.throws(() => writeAtomicJson("run.json", { secret: "nope" }, io, { sleep() {} }), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.equal(error.message.includes(ATOMIC_WRITE_FAILED), true);
    assert.equal(error.message.includes("nope"), false);
    return true;
  });
}

function checkLocalEnvLoaderDoesNotReturnSecrets() {
  const loaded = loadAtlasLocalEnv();
  assert.equal(Object.keys(loaded).join(","), "loadedFileNames");
  assert.equal(JSON.stringify(loaded).includes("sk_"), false);
  assert.equal(JSON.stringify(loaded).includes("rk_"), false);
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
