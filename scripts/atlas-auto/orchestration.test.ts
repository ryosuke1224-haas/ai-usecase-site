import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adoptTrustedAuthSession,
  blockUnexpectedSecretChanges,
  SECRET_FILE_BLOCKING_MESSAGE,
  secretIssuePrintsContents,
} from "../atlas-agent/secret-guard";
import { formatLoopUserFacingLines, loopStatusFromResult } from "../atlas-agent/loop-status";
import { TRUSTED_AUTH_SESSION_FILE } from "../atlas-agent/workspace";
import type { AgentTask } from "../atlas-agent/schema";
import {
  dryRunSecurityRetryAssignment,
  emptyBaseline,
  memorySecretIo,
  summarizeOrchestration,
} from "./orchestration";
import {
  applyPlannedAction,
  classifyFailure,
  countHumanStatusToken,
  emptySupervisorState,
  HUMAN_REVIEW_REQUIRED,
  humanFacingDisposition,
  snapshotFromLoop,
  supervisorUserFacingLines,
  SUPERVISOR_LIMITS,
} from "./supervisor";
import { runRecoveryLoop, type RecoveryDeps } from "./recovery";
import type { BlueprintSpec } from "./spec";
import { HUMAN_INTERVENTION_REQUIRED, TASK_SCOPE_CONFLICT } from "./task-paths";

const SECURITY = "security-readiness-action-pack";
const SESSION = TRUSTED_AUTH_SESSION_FILE;

function spec(overrides: Partial<BlueprintSpec> = {}): BlueprintSpec {
  return {
    schema_version: "atlas-blueprint-spec-v1",
    id: SECURITY,
    tier: "premium",
    status: "private-preview",
    name: "Security Readiness Action Pack",
    value_proposition: "v",
    persona: "p",
    problem: "p",
    workflow: ["1", "2", "3"],
    before: "b",
    after: "a",
    guided_demo: {
      summary: "s",
      steps: ["1", "2"],
      sample_input: "in",
      sample_output: "out",
      fictional_data_notice: "n",
    },
    kit_contents: [
      { id: "a", title: "A", purpose: "p" },
      { id: "b", title: "B", purpose: "p" },
      { id: "c", title: "C", purpose: "p" },
    ],
    decision_rules: ["r"],
    human_ai_boundary: ["h"],
    safety: ["s"],
    required_data_tools: ["t"],
    acceptance_criteria: [
      "Security Readiness Action Pack is registered in src/lib/blueprints.ts with access premium.",
      "With an authenticated entitled session, /my-blueprints shows an Open Blueprint link.",
    ],
    qa_checks: [
      { id: "kit-logged-out-redirect", description: "auth", viewport: "both", requires_auth: false },
      { id: "kit-loads-signed-in", description: "kit", viewport: "desktop", requires_auth: true },
    ],
    out_of_scope: [],
    source: {
      run_id: "r",
      candidate_id: SECURITY,
      approved_at: "t",
      approval_note: "",
      summary_scores: { commercial: 1, atlas_fit: 1, buildability: 1, overall: 1 },
    },
    routes: { guided_demo: "/d", kit: "/k" },
    allowed_paths: [
      `app/blueprints/${SECURITY}/`,
      `components/premium/${SECURITY}/`,
      `src/lib/premium/${SECURITY}/`,
      "src/lib/blueprints.ts",
    ],
    constraints: [],
    ...overrides,
  };
}

function task(overrides: Partial<AgentTask> = {}): AgentTask {
  return {
    schema_version: "atlas-agent-task-v1",
    id: `${SECURITY}-premium-build`,
    title: "Build",
    objective: "Implement the spec.",
    target_use_case: SECURITY,
    scope: [
      `app/blueprints/${SECURITY}/`,
      `components/premium/${SECURITY}/`,
      `src/lib/premium/${SECURITY}/`,
      "src/lib/blueprints.ts",
      `e2e/${SECURITY}/public.spec.ts`,
    ],
    acceptance_criteria: spec().acceptance_criteria,
    forbidden_changes: ["app/blueprints/daily-inbox-briefing/", "src/lib/payments/"],
    protected_files: [`e2e/${SECURITY}/authenticated.spec.ts`],
    permits_qa_changes: false,
    requires_authenticated_qa: true,
    product_changes_required: true,
    max_iterations: 3,
    evaluation_targets: [],
    ...overrides,
  };
}

function readySnapshot() {
  return snapshotFromLoop({
    builderCompleted: true,
    build: "pass",
    qa: { status: "pass", passed: 12, failed: 0, skipped: 0 },
    evaluator: { status: "executed", decision: "PASS", overall: 8.8 },
    issues: [],
    findings: [{ severity: "LOW", description: "Optional copy tweak." }],
    criticalIssues: [],
    spec: spec(),
    task: task(),
    assignment: { ok: true },
  });
}

function deps(overrides: Partial<RecoveryDeps> = {}): RecoveryDeps {
  return {
    now: () => "t",
    prepareAuthSession: async () => ({ status: "ready" }),
    rerunQa: async () => ({
      qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
      evaluator: { status: "executed", decision: "PASS", overall: 8 },
      issues: [],
      criticalIssues: [],
    }),
    rerunBuilder: async () => ({
      build: "pass",
      qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
      evaluator: { status: "executed", decision: "PASS", overall: 8 },
      issues: [],
      criticalIssues: [],
    }),
    writeAssignment: () => undefined,
    ...overrides,
  };
}

function printed(snapshot: ReturnType<typeof snapshotFromLoop>, loopDisposition = "HUMAN_REVIEW_REQUIRED") {
  const summary = summarizeOrchestration(snapshot);
  const loopLines = formatLoopUserFacingLines(
    loopStatusFromResult({
      disposition: loopDisposition,
      qaStatus: snapshot.qa?.status,
      evaluatorStatus: snapshot.evaluator?.status,
      issues: snapshot.issues,
    }),
  );
  const decision = {
    recommendation: summary.recommendation,
    intervention: summary.humanIntervention ? "x" : undefined,
  };
  const text = [...loopLines, ...supervisorUserFacingLines({
    classification: summary.owner,
    action: summary.action,
    recommendation: summary.recommendation,
    invokeBuilder: summary.invokeBuilder,
    reason: "",
    ready: summary.phase === "AWAITING_FINAL_REVIEW",
    intervention: summary.humanIntervention ? HUMAN_INTERVENTION_REQUIRED : undefined,
    report: {
      recommendation: summary.recommendation,
      classification: summary.owner,
      build: snapshot.build ?? "not_run",
      qaPassed: snapshot.qa?.passed ?? 0,
      qaFailed: snapshot.qa?.failed ?? 0,
      qaSkipped: snapshot.qa?.skipped ?? 0,
      authenticatedQa: "not_run",
      evaluatorDecision: snapshot.evaluator?.decision ?? null,
      evaluatorScore: null,
      blockingFindings: 0,
      nonBlockingFindings: 0,
      recoveryCyclesUsed: 0,
    },
  })].join("\n");
  return { summary, text, decision };
}

test("1. expired auth session is Supervisor-owned AUTH recovery", async () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [{ issue_id: "AUTH_SESSION_REFRESH_REQUIRED", classification: "AUTH_SESSION_REFRESH_REQUIRED" }],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "AUTH_SESSION_FAILURE");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.invokeQa, true);
  assert.equal(summary.recovers, true);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.humanIntervention, false);
  const recovered = await runRecoveryLoop({
    snapshot,
    state: emptySupervisorState(),
    spec: spec(),
    task: task(),
    specPath: "s",
    taskPath: "t",
    deps: deps(),
  });
  assert.equal(recovered.decision.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.equal(recovered.decision.invokeBuilder, false);
});

test("2. trusted session refresh is not a secret-file SCOPE_VIOLATION", () => {
  const io = memorySecretIo({ [SESSION]: "before" });
  io.writeBytes(SESSION, Buffer.from("after-refresh"));
  const adopted = adoptTrustedAuthSession(
    emptyBaseline({ [SESSION]: "before" }),
    { status: "ready", path: SESSION, refreshed: true },
    io,
  );
  assert.equal(adopted.status, "continue");
  if (adopted.status !== "continue") return;
  assert.equal(blockUnexpectedSecretChanges(adopted.baseline, io).blocked, false);
  const summary = summarizeOrchestration(readySnapshot());
  assert.equal(summary.owner, "NONE");
  assert.equal(summary.humanReview, true);
  assert.equal(summary.humanIntervention, false);
});

test("3. Builder modifying the protected authenticated test restores and retries read-only", async () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [
      {
        issue_id: "TEST_PROTECTION_VIOLATION",
        classification: "TEST_PROTECTION_VIOLATION",
        test: `e2e/${SECURITY}/authenticated.spec.ts`,
        actual: "Protected test file changed.",
      },
    ],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "TEST_PROTECTION_VIOLATION");
  assert.equal(summary.invokeBuilder, true);
  assert.equal(summary.humanReview, false);
  let wrote = false;
  const recovered = await runRecoveryLoop({
    snapshot,
    state: emptySupervisorState(),
    spec: spec(),
    task: task(),
    specPath: "s",
    taskPath: "t",
    deps: deps({
      writeAssignment: (_nextSpec, next) => {
        wrote = true;
        assert.equal(next.permits_qa_changes, false);
        assert.ok(next.protected_files.includes(`e2e/${SECURITY}/authenticated.spec.ts`));
      },
    }),
  });
  assert.equal(wrote, true);
  assert.equal(recovered.decision.recommendation === "READY_FOR_HUMAN_REVIEW" || recovered.decision.invokeBuilder, true);
});

test("4. Task scope/forbidden overlap is repaired before Builder", async () => {
  const snapshot = snapshotFromLoop({
    assignment: { ok: false, code: TASK_SCOPE_CONFLICT, reason: "overlap" },
    spec: spec(),
    task: task({
      scope: [`app/blueprints/${SECURITY}/`, "e2e/"],
      forbidden_changes: ["e2e/"],
    }),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "TASK_SCOPE_CONFLICT");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.recovers, true);
  const recovered = await runRecoveryLoop({
    snapshot,
    state: emptySupervisorState(),
    spec: spec(),
    task: task({
      scope: [`app/blueprints/${SECURITY}/`, "src/lib/blueprints.ts", `e2e/${SECURITY}/public.spec.ts`],
      forbidden_changes: ["e2e/", "src/lib/payments/"],
    }),
    specPath: "s",
    taskPath: "t",
    deps: deps(),
  });
  assert.equal(recovered.decision.invokeBuilder, false);
  assert.notEqual(recovered.decision.recommendation, "READY_FOR_HUMAN_REVIEW");
});

test("5. stale Spec contradicting Premium entitlement is reconciled", async () => {
  const stale = spec({
    acceptance_criteria: [
      "The Blueprint is not linked from the homepage, header, or My Blueprints.",
      "Security Readiness Action Pack is registered in src/lib/blueprints.ts with access premium.",
    ],
  });
  const snapshot = snapshotFromLoop({ spec: stale, task: task(), assignment: { ok: true } });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "STALE_SPEC");
  assert.equal(summary.invokeBuilder, false);
  const recovered = await runRecoveryLoop({
    snapshot,
    state: emptySupervisorState(),
    spec: stale,
    task: task(),
    specPath: "s",
    taskPath: "t",
    deps: deps(),
  });
  assert.equal(
    recovered.spec.acceptance_criteria.some((item) => /not linked from the homepage, header, or My Blueprints/i.test(item)),
    false,
  );
  assert.equal(recovered.decision.invokeBuilder, false);
});

test("6. Atlas infrastructure build failure is not a Security product defect", () => {
  const snapshot = snapshotFromLoop({
    build: "fail",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [
      {
        issue_id: "build",
        classification: "BUILD_FAILURE",
        actual: "Type error: scripts/atlas-auto/supervisor.ts",
        relevant_files: ["scripts/atlas-auto/supervisor.ts"],
      },
    ],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "ORCHESTRATION_FAILURE");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.invokeQa, false);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.humanIntervention, true);
  assert.equal(summary.phase, "HUMAN_INTERVENTION_REQUIRED");
});

test("7. QA not_run recovers internally and never opens final review", () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    spec: spec(),
    task: task(),
    assignment: { ok: true },
  });
  const printedOut = printed(snapshot);
  assert.equal(printedOut.summary.owner, "ORCHESTRATION_FAILURE");
  assert.equal(printedOut.summary.invokeQa, true);
  assert.equal(printedOut.summary.invokeBuilder, false);
  assert.equal(printedOut.summary.humanReview, false);
  assert.equal(countHumanStatusToken(printedOut.text, HUMAN_REVIEW_REQUIRED), 0);
});

test("8. Evaluator not_run recovers internally and never opens final review", () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
    evaluator: { status: "not_run", decision: null },
    spec: spec(),
    task: task(),
    assignment: { ok: true },
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "ORCHESTRATION_FAILURE");
  assert.equal(summary.invokeQa, true);
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.humanIntervention, false);
});

test("9. Cursor Builder connection failure is infrastructure, not a product defect", () => {
  const snapshot = snapshotFromLoop({
    builderCompleted: false,
    build: "not_run",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [
      {
        issue_id: "builder-unavailable",
        classification: "BUILD_INFRA_FAILURE",
        actual: "No Builder is available.",
      },
    ],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "BUILD_INFRA_FAILURE");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.invokeQa, false);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.humanIntervention, true);
});

test("10. successful full run emits HUMAN_REVIEW_REQUIRED only after READY_FOR_HUMAN_REVIEW", () => {
  const snapshot = readySnapshot();
  const printedOut = printed(snapshot, "READY_FOR_HUMAN_REVIEW");
  assert.equal(printedOut.summary.owner, "NONE");
  assert.equal(printedOut.summary.invokeBuilder, false);
  assert.equal(printedOut.summary.phase, "AWAITING_FINAL_REVIEW");
  assert.equal(printedOut.summary.humanReview, true);
  assert.equal(printedOut.summary.humanIntervention, false);
  assert.equal(countHumanStatusToken(printedOut.text, HUMAN_REVIEW_REQUIRED), 1);
  assert.equal(countHumanStatusToken(printedOut.text, HUMAN_INTERVENTION_REQUIRED), 0);
  assert.equal(humanFacingDisposition(printedOut.summary.recommendation), HUMAN_REVIEW_REQUIRED);
});

test("11. repeated product defect reruns Builder then escalates", () => {
  const snapshot = snapshotFromLoop({
    build: "fail",
    qa: { status: "fail", failed: 2 },
    evaluator: { status: "not_run", decision: null },
    issues: [{ issue_id: "qa", classification: "QA_FAILURE", actual: "kit heading missing" }],
    spec: spec(),
    task: task(),
  });
  let state = emptySupervisorState();
  for (let i = 0; i < SUPERVISOR_LIMITS.maxProductFixIterations; i += 1) {
    const summary = summarizeOrchestration(snapshot, state);
    assert.equal(summary.owner, "PRODUCT_DEFECT");
    assert.equal(summary.invokeBuilder, true);
    assert.equal(summary.humanReview, false);
    state = applyPlannedAction(state, {
      classification: "PRODUCT_DEFECT",
      action: "RERUN_BUILDER",
      recommendation: "NEEDS_INTERNAL_RECOVERY",
      invokeBuilder: true,
      reason: "fix",
      ready: false,
      report: {
        recommendation: "NEEDS_INTERNAL_RECOVERY",
        classification: "PRODUCT_DEFECT",
        build: "fail",
        qaPassed: 0,
        qaFailed: 2,
        qaSkipped: 0,
        authenticatedQa: "not_run",
        evaluatorDecision: null,
        evaluatorScore: null,
        blockingFindings: 0,
        nonBlockingFindings: 0,
        recoveryCyclesUsed: state.cycles_used,
      },
    }, `t${i}`);
  }
  const exhausted = summarizeOrchestration(snapshot, state);
  assert.equal(exhausted.humanIntervention, true);
  assert.equal(exhausted.invokeBuilder, false);
  assert.equal(exhausted.humanReview, false);
});

test("12. evaluator actionable rejection returns to Builder", () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
    evaluator: { status: "executed", decision: "HUMAN_REVIEW_REQUIRED", overall: 7 },
    issues: [{ issue_id: "evaluator-review", classification: "EVALUATOR_REJECTED", actual: "kit heading" }],
    findings: [{ severity: "HIGH", description: "Kit heading does not match the spec.", relevant_files: [`app/blueprints/${SECURITY}/kit/page.tsx`] }],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "EVALUATOR_REJECTED");
  assert.equal(summary.invokeBuilder, true);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.humanIntervention, false);
});

test("13. evaluator strategic rejection escalates", () => {
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
    evaluator: { status: "executed", decision: "HUMAN_REVIEW_REQUIRED", overall: 8 },
    issues: [{ issue_id: "evaluator-review", classification: "EVALUATOR_REJECTED" }],
    findings: [{ severity: "HIGH", description: "Pricing and market strategy need a human decision." }],
    spec: spec(),
    task: task(),
  });
  const summary = summarizeOrchestration(snapshot);
  assert.equal(summary.owner, "EVALUATOR_REJECTED");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.humanIntervention, true);
  assert.equal(summary.humanReview, false);
});

test("14. unexpected secret mutation blocks immediately and prints no secret", () => {
  const io = memorySecretIo({ [SESSION]: "before", ".env.local": "STRIPE_SECRET=sk_test_fake" });
  const started = emptyBaseline({ [SESSION]: "before", ".env.local": "STRIPE_SECRET=sk_test_fake" });
  io.writeBytes(".env.local", Buffer.from("STRIPE_SECRET=sk_test_changed"));
  const blocked = blockUnexpectedSecretChanges(started, io);
  assert.equal(blocked.blocked, true);
  assert.deepEqual(blocked.files, [".env.local"]);
  assert.equal(secretIssuePrintsContents(blocked.message, ["sk_test_fake", "sk_test_changed"]), false);
  assert.equal(blocked.message, SECRET_FILE_BLOCKING_MESSAGE);
  const summary = summarizeOrchestration(
    snapshotFromLoop({
      issues: [{ issue_id: "secret-file-modified", classification: "SCOPE_VIOLATION" }],
      qa: { status: "not_run" },
      spec: spec(),
      task: task(),
    }),
  );
  assert.equal(summary.owner, "ORCHESTRATION_FAILURE");
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.humanIntervention, true);
  assert.equal(summary.humanReview, false);
});

test("15. recovery exhaustion escalates once", () => {
  const snapshot = snapshotFromLoop({
    build: "fail",
    qa: { status: "fail", failed: 1 },
    issues: [{ issue_id: "qa", classification: "QA_FAILURE" }],
    spec: spec(),
    task: task(),
  });
  const state = emptySupervisorState();
  state.cycles_used = SUPERVISOR_LIMITS.maxTotalCycles;
  const summary = summarizeOrchestration(snapshot, state);
  assert.equal(summary.humanIntervention, true);
  assert.equal(summary.invokeBuilder, false);
  assert.equal(summary.humanReview, false);
  assert.equal(summary.phase, "HUMAN_INTERVENTION_REQUIRED");
});

test("Security retry dry-run uses current Spec/Task and cannot open incomplete final review", () => {
  const dry = dryRunSecurityRetryAssignment();
  assert.equal(dry.specLoaded, true);
  assert.equal(dry.taskLoaded, true);
  assert.equal(dry.staleParentRules, false);
  assert.deepEqual(dry.scopeForbiddenConflict, []);
  assert.equal(dry.protectedAuthReadOnly, true);
  assert.equal(dry.publicTestEditable, true);
  assert.equal(dry.authPreparationTrusted, true);
  assert.equal(dry.sessionRefreshTripsSecretGuard, false);
  assert.equal(dry.incompleteOpensFinalReview, false);
  assert.equal(dry.ok, true);
  assert.equal(classifyFailure(readySnapshot()), "NONE");
});
