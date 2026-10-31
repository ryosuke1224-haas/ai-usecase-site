import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentTask } from "../atlas-agent/schema";
import {
  formatLoopUserFacingLines,
  isSupervisorManaged,
  loopStatusFromResult,
  redactChildHumanStatusLine,
} from "../atlas-agent/loop-status";
import {
  applyPlannedAction,
  classifyFailure,
  countHumanStatusToken,
  decideSupervisor,
  emptySupervisorState,
  HUMAN_REVIEW_REQUIRED,
  humanFacingDisposition,
  isReadyForHumanReview,
  routeRecovery,
  SUPERVISOR_LIMITS,
  snapshotFromLoop,
  supervisorUserFacingLines,
  type SupervisorSnapshot,
  type SupervisorState,
} from "./supervisor";
import type { BlueprintSpec } from "./spec";
import { HUMAN_INTERVENTION_REQUIRED, TASK_SCOPE_CONFLICT } from "./task-paths";

const SECURITY = "security-readiness-action-pack";

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

function readySnapshot(overrides: Partial<SupervisorSnapshot> = {}): SupervisorSnapshot {
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
    ...overrides,
  });
}

function decide(snapshot: SupervisorSnapshot, state: SupervisorState = emptySupervisorState()) {
  return decideSupervisor(snapshot, state);
}

test("classifies structured failures without parsing prose", () => {
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "AUTH_SESSION_REFRESH_REQUIRED", classification: "AUTH_SESSION_REFRESH_REQUIRED" }],
        qa: { status: "fail", skipped: 4 },
        task: task(),
      }),
    ),
    "AUTH_SESSION_FAILURE",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "protected-test", classification: "TEST_PROTECTION_VIOLATION" }],
      }),
    ),
    "TEST_PROTECTION_VIOLATION",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "secret-file-modified", classification: "SCOPE_VIOLATION" }],
      }),
    ),
    "ORCHESTRATION_FAILURE",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "build", classification: "BUILD_FAILURE", actual: "Type error in kit page" }],
        build: "fail",
      }),
    ),
    "PRODUCT_DEFECT",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [{ issue_id: "BUILDER_TIMEOUT", classification: "BUILDER_TIMEOUT", actual: "BUILDER_TIMEOUT" }],
      }),
    ),
    "BUILD_INFRA_FAILURE",
  );
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        assignment: { ok: false, code: TASK_SCOPE_CONFLICT, reason: "overlap" },
      }),
    ),
    "TASK_SCOPE_CONFLICT",
  );
});

test("trusted session refresh is not classified as a secret-file SCOPE_VIOLATION", () => {
  const snapshot = snapshotFromLoop({
    builderCompleted: true,
    build: "pass",
    qa: { status: "pass", passed: 4, failed: 0, skipped: 0 },
    evaluator: { status: "executed", decision: "PASS" },
    issues: [],
    task: task(),
    spec: spec(),
    assignment: { ok: true },
  });
  assert.equal(
    (snapshot.issues ?? []).some((issue) => issue.issue_id === "secret-file-modified"),
    false,
  );
  assert.equal(classifyFailure(snapshot), "NONE");
  assert.notEqual(classifyFailure(snapshot), "PRODUCT_DEFECT");
});

test("unexpected secret mutation requires human intervention", () => {
  const decision = decide(
    snapshotFromLoop({
      issues: [{ issue_id: "secret-file-modified", classification: "SCOPE_VIOLATION" }],
      qa: { status: "not_run" },
      task: task(),
    }),
  );
  assert.equal(decision.classification, "ORCHESTRATION_FAILURE");
  assert.equal(decision.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(decision.invokeBuilder, false);
  assert.equal(decision.ready, false);
});

test("A. expired Playwright session routes to auth recovery without Builder", () => {
  const decision = decide(
    snapshotFromLoop({
      builderCompleted: true,
      build: "pass",
      qa: { status: "not_run", passed: 0, failed: 0, skipped: 0 },
      evaluator: { status: "not_run", decision: null },
      issues: [
        {
          issue_id: "AUTH_SESSION_REFRESH_REQUIRED",
          test: "authenticated QA",
          actual: "AUTH_SESSION_REFRESH_REQUIRED",
          classification: "AUTH_SESSION_REFRESH_REQUIRED",
        },
      ],
      task: task(),
      spec: spec(),
    }),
  );
  assert.equal(decision.classification, "AUTH_SESSION_FAILURE");
  assert.equal(decision.action, "PREPARE_AUTH_SESSION");
  assert.equal(decision.invokeBuilder, false);
  assert.equal(decision.recommendation, "NEEDS_INTERNAL_RECOVERY");
  assert.equal(humanFacingDisposition(decision.recommendation), null);
  assert.equal(decision.ready, false);
});

test("B. weakening the authenticated test restores it and retries Builder as read-only", () => {
  const first = decide(
    snapshotFromLoop({
      build: "pass",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      issues: [
        {
          issue_id: "TEST_PROTECTION_VIOLATION",
          test: `e2e/${SECURITY}/authenticated.spec.ts`,
          actual: "Builder attempted to weaken authenticated.spec.ts",
          classification: "TEST_PROTECTION_VIOLATION",
        },
      ],
      task: task(),
      spec: spec(),
    }),
  );
  assert.equal(first.classification, "TEST_PROTECTION_VIOLATION");
  assert.equal(first.action, "RESTORE_PROTECTED_TEST");
  assert.equal(first.invokeBuilder, true);
  assert.equal(first.recommendation, "NEEDS_INTERNAL_RECOVERY");
  assert.equal(humanFacingDisposition(first.recommendation), null);

  const afterFirst = applyPlannedAction(emptySupervisorState(), first, "t1");
  const second = decide(
    snapshotFromLoop({
      issues: [{ issue_id: "TEST_PROTECTION_VIOLATION", classification: "TEST_PROTECTION_VIOLATION" }],
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      task: task(),
    }),
    afterFirst,
  );
  assert.equal(second.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(second.intervention, "protected test repeatedly modified");
  assert.equal(humanFacingDisposition(second.recommendation), HUMAN_INTERVENTION_REQUIRED);
});

test("C. overlapping scope and forbidden_changes is TASK_SCOPE_CONFLICT without Builder", () => {
  const decision = decide(
    snapshotFromLoop({
      assignment: {
        ok: false,
        code: TASK_SCOPE_CONFLICT,
        reason: `${TASK_SCOPE_CONFLICT}. e2e/${SECURITY}/ is in both scope and forbidden_changes.`,
      },
      spec: spec(),
      task: task({
        scope: [...task().scope, `e2e/${SECURITY}/`],
        forbidden_changes: [...task().forbidden_changes, `e2e/${SECURITY}/`],
      }),
    }),
  );
  assert.equal(decision.classification, "TASK_SCOPE_CONFLICT");
  assert.equal(decision.action, "REPAIR_TASK");
  assert.equal(decision.invokeBuilder, false);
  assert.equal(humanFacingDisposition(decision.recommendation), null);
});

test("D. stale Spec isolating Security from My Blueprints selects Spec/Task reconciliation", () => {
  const stale = spec({
    acceptance_criteria: [
      ...spec().acceptance_criteria,
      "Both pages set robots noindex and are not linked from the homepage, header, or My Blueprints.",
    ],
  });
  const decision = decide(snapshotFromLoop({ spec: stale, task: task(), assignment: { ok: true } }));
  assert.ok(decision.classification === "STALE_SPEC" || decision.classification === "TASK_SPEC_MISMATCH");
  assert.equal(decision.action, "RECONCILE_SPEC_TASK");
  assert.equal(decision.invokeBuilder, false);
});

test("E. QA not_run / Evaluator not_run never emits HUMAN_REVIEW_REQUIRED", () => {
  const incomplete = decide(
    snapshotFromLoop({
      builderCompleted: true,
      build: "pass",
      qa: { status: "not_run", passed: 0, failed: 0, skipped: 0 },
      evaluator: { status: "not_run", decision: null },
      task: task(),
      spec: spec(),
      assignment: { ok: true },
    }),
  );
  assert.equal(isReadyForHumanReview(incomplete.report as unknown as SupervisorSnapshot), false);
  assert.notEqual(incomplete.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.notEqual(humanFacingDisposition(incomplete.recommendation), "HUMAN_REVIEW_REQUIRED");
  assert.ok(
    incomplete.recommendation === "NEEDS_INTERNAL_RECOVERY" ||
      incomplete.recommendation === "HUMAN_INTERVENTION_REQUIRED",
  );

  const neverStarted = decide(
    snapshotFromLoop({
      builderCompleted: true,
      build: "not_run",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      task: task(),
      spec: spec(),
    }),
  );
  assert.equal(neverStarted.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.notEqual(humanFacingDisposition(neverStarted.recommendation), "HUMAN_REVIEW_REQUIRED");
});

test("F. full success is READY_FOR_HUMAN_REVIEW and only then HUMAN_REVIEW_REQUIRED", () => {
  const decision = decide(readySnapshot());
  assert.equal(decision.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.equal(decision.classification, "NONE");
  assert.equal(decision.ready, true);
  assert.equal(decision.invokeBuilder, false);
  assert.equal(humanFacingDisposition(decision.recommendation), "HUMAN_REVIEW_REQUIRED");
  assert.equal(decision.report.build, "pass");
  assert.equal(decision.report.qaPassed, 12);
  assert.equal(decision.report.authenticatedQa, "pass");
  assert.equal(decision.report.evaluatorDecision, "PASS");
  assert.equal(decision.report.blockingFindings, 0);
  assert.equal(decision.report.nonBlockingFindings, 1);
  assert.equal(decision.report.recoveryCyclesUsed, 0);
});

test("retry limits escalate instead of looping forever", () => {
  const defect = snapshotFromLoop({
    build: "fail",
    qa: { status: "fail", failed: 2 },
    evaluator: { status: "not_run", decision: null },
    issues: [{ issue_id: "qa", classification: "QA_FAILURE", actual: "kit heading missing" }],
    task: task(),
  });
  let state = emptySupervisorState();
  for (let i = 0; i < SUPERVISOR_LIMITS.maxProductFixIterations; i += 1) {
    const planned = decide(defect, state);
    assert.equal(planned.action, "RERUN_BUILDER");
    state = applyPlannedAction(state, planned, `t${i}`);
  }
  const exhausted = decide(defect, state);
  assert.equal(exhausted.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(exhausted.intervention, "recovery exhausted");
  assert.equal(state.product_fix_iterations, SUPERVISOR_LIMITS.maxProductFixIterations);
  assert.equal(state.history.length, SUPERVISOR_LIMITS.maxProductFixIterations);

  const auth = snapshotFromLoop({
    issues: [{ classification: "AUTH_SESSION_REFRESH_REQUIRED", issue_id: "AUTH_SESSION_REFRESH_REQUIRED" }],
    qa: { status: "fail", skipped: 3 },
    task: task(),
  });
  let authState = emptySupervisorState();
  for (let i = 0; i < SUPERVISOR_LIMITS.maxAuthSessionAttempts; i += 1) {
    authState = applyPlannedAction(authState, decide(auth, authState), `a${i}`);
  }
  assert.equal(decide(auth, authState).recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(decide(auth, authState).intervention, "QA infrastructure unavailable");
});

test("recovery history is stored on supervisor state", () => {
  const decision = decide(
    snapshotFromLoop({
      issues: [{ classification: "AUTH_SESSION_REFRESH_REQUIRED", issue_id: "AUTH_SESSION_REFRESH_REQUIRED" }],
      qa: { status: "not_run" },
      task: task(),
    }),
  );
  const next = applyPlannedAction(emptySupervisorState(), decision, "2026-10-30T15:00:00.000Z");
  assert.equal(next.cycles_used, 1);
  assert.equal(next.auth_session_attempts, 1);
  assert.equal(next.history[0]?.classification, "AUTH_SESSION_FAILURE");
  assert.equal(next.history[0]?.action, "PREPARE_AUTH_SESSION");
  assert.equal(next.history[0]?.result, "planned");
});

test("final review gating rejects incomplete, infra, conflict, and protection failures", () => {
  assert.equal(isReadyForHumanReview(readySnapshot({ qa: { status: "not_run" } })), false);
  assert.equal(isReadyForHumanReview(readySnapshot({ evaluator: { status: "not_run", decision: null } })), false);
  assert.equal(isReadyForHumanReview(readySnapshot({ qa: { status: "pass", passed: 8, failed: 0, skipped: 2 } })), false);
  assert.equal(
    isReadyForHumanReview(
      readySnapshot({
        issues: [{ classification: "TEST_PROTECTION_VIOLATION", issue_id: "TEST_PROTECTION_VIOLATION" }],
      }),
    ),
    false,
  );
  assert.equal(
    isReadyForHumanReview(
      readySnapshot({
        assignment: { ok: false, code: TASK_SCOPE_CONFLICT, reason: "overlap" },
      }),
    ),
    false,
  );
  assert.equal(
    isReadyForHumanReview(readySnapshot({ findings: [{ severity: "CRITICAL", description: "kit broken" }] })),
    false,
  );
  assert.equal(isReadyForHumanReview(readySnapshot()), true);
});

test("evaluator strategic findings escalate; actionable findings rebuild", () => {
  const strategic = decide(
    readySnapshot({
      evaluator: { status: "executed", decision: "HUMAN_REVIEW_REQUIRED", overall: 8 },
      findings: [{ severity: "MEDIUM", description: "The pricing and go-to-market positioning need a strategic decision." }],
    }),
  );
  assert.equal(strategic.classification, "EVALUATOR_REJECTED");
  assert.equal(strategic.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(strategic.intervention, "evaluator requires strategic decision");
  assert.equal(strategic.invokeBuilder, false);

  const actionable = decide(
    readySnapshot({
      evaluator: { status: "executed", decision: "HUMAN_REVIEW_REQUIRED", overall: 7.6 },
      findings: [
        {
          severity: "HIGH",
          description: "The kit page does not gate Premium entitlement.",
          relevant_files: [`app/blueprints/${SECURITY}/kit/page.tsx`],
        },
      ],
    }),
  );
  assert.equal(actionable.action, "RERUN_BUILDER");
  assert.equal(actionable.invokeBuilder, true);
});

test("QA infrastructure without a supported recovery escalates", () => {
  const decision = decide(
    snapshotFromLoop({
      issues: [
        {
          issue_id: "playwright",
          test: "npm run qa",
          actual: "Executable doesn't exist. Playwright browsers are missing.",
          classification: "QA_FAILURE",
        },
      ],
      qa: { status: "fail" },
      task: task(),
    }),
  );
  assert.equal(decision.classification, "QA_INFRA_FAILURE");
  assert.equal(decision.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(decision.intervention, "QA infrastructure unavailable");
  assert.equal(routeRecovery("QA_INFRA_FAILURE", emptySupervisorState()), "ESCALATE");
});

test("ready path does not increment recovery counters", () => {
  const next = applyPlannedAction(emptySupervisorState(), decide(readySnapshot()), "t");
  assert.equal(next.cycles_used, 0);
  assert.equal(next.history.length, 0);
  assert.equal(next.recommendation, "READY_FOR_HUMAN_REVIEW");
});

function managedOutput(loopInput: Parameters<typeof loopStatusFromResult>[0], snapshot: SupervisorSnapshot) {
  const loopStatus = loopStatusFromResult(loopInput);
  const decision = decide(snapshot);
  const lines = [...formatLoopUserFacingLines(loopStatus), ...supervisorUserFacingLines(decision)];
  const text = lines.join("\n");
  return { loopStatus, decision, lines, text };
}

test("A. build failure in supervisor.ts is orchestration, not a Security product defect", () => {
  const snapshot = snapshotFromLoop({
    builderCompleted: true,
    build: "fail",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [
      {
        issue_id: "build",
        test: "npm run build",
        actual: "Type error: scripts/atlas-auto/supervisor.ts",
        classification: "BUILD_FAILURE",
        relevant_files: ["scripts/atlas-auto/supervisor.ts"],
      },
    ],
    task: task(),
    spec: spec(),
  });
  const output = managedOutput({ disposition: "HUMAN_REVIEW_REQUIRED", qaStatus: "not_run", evaluatorStatus: "not_run" }, snapshot);
  assert.equal(output.decision.classification, "ORCHESTRATION_FAILURE");
  assert.equal(output.decision.invokeBuilder, false);
  assert.equal(output.decision.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(countHumanStatusToken(output.text, HUMAN_REVIEW_REQUIRED), 0);
  assert.equal(countHumanStatusToken(output.text, HUMAN_INTERVENTION_REQUIRED), 1);
  assert.equal(output.loopStatus, "FAILED");
});

test("B. QA not_run / Evaluator not_run never prints HUMAN_REVIEW_REQUIRED", () => {
  const output = managedOutput(
    { disposition: "HUMAN_REVIEW_REQUIRED", qaStatus: "not_run", evaluatorStatus: "not_run" },
    snapshotFromLoop({
      build: "pass",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      task: task(),
      spec: spec(),
      assignment: { ok: true },
    }),
  );
  assert.equal(countHumanStatusToken(output.text, HUMAN_REVIEW_REQUIRED), 0);
  assert.ok(!output.lines.includes(HUMAN_REVIEW_REQUIRED));
});

test("C. Supervisor-managed unsuccessful loop returns structured status only", () => {
  const output = managedOutput(
    {
      disposition: "HUMAN_REVIEW_REQUIRED",
      qaStatus: "not_run",
      evaluatorStatus: "not_run",
      issues: [{ classification: "BUILD_FAILURE", issue_id: "build" }],
    },
    snapshotFromLoop({
      build: "fail",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      issues: [{ issue_id: "build", classification: "BUILD_FAILURE", actual: "Type error in kit page" }],
      task: task(),
    }),
  );
  assert.equal(output.loopStatus, "FAILED");
  assert.deepEqual(formatLoopUserFacingLines(output.loopStatus), ["Loop status: FAILED"]);
  assert.equal(countHumanStatusToken(formatLoopUserFacingLines(output.loopStatus).join("\n"), HUMAN_REVIEW_REQUIRED), 0);
  assert.ok(output.decision.recommendation === "NEEDS_INTERNAL_RECOVERY" || output.decision.recommendation === "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(humanFacingDisposition(output.decision.recommendation) === HUMAN_REVIEW_REQUIRED, false);
});

test("D. successful full run emits exactly one HUMAN_REVIEW_REQUIRED after READY_FOR_HUMAN_REVIEW", () => {
  const output = managedOutput(
    { disposition: "READY_FOR_HUMAN_REVIEW", qaStatus: "pass", evaluatorStatus: "executed" },
    readySnapshot(),
  );
  assert.equal(output.loopStatus, "COMPLETED");
  assert.equal(output.decision.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.equal(countHumanStatusToken(output.text, HUMAN_REVIEW_REQUIRED), 1);
  assert.equal(countHumanStatusToken(output.text, HUMAN_INTERVENTION_REQUIRED), 0);
  assert.equal(output.lines[0], "Loop status: COMPLETED");
  assert.equal(output.lines[1], HUMAN_REVIEW_REQUIRED);
});

test("E. failed run emits exactly one HUMAN_INTERVENTION_REQUIRED and zero HUMAN_REVIEW_REQUIRED", () => {
  const output = managedOutput(
    { disposition: "HUMAN_REVIEW_REQUIRED", qaStatus: "not_run", evaluatorStatus: "not_run" },
    snapshotFromLoop({
      build: "not_run",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      task: task(),
    }),
  );
  assert.equal(output.decision.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(countHumanStatusToken(output.text, HUMAN_INTERVENTION_REQUIRED), 1);
  assert.equal(countHumanStatusToken(output.text, HUMAN_REVIEW_REQUIRED), 0);
});

test("lower agent loop does not own final human disposition when Supervisor-managed", () => {
  assert.equal(isSupervisorManaged({ ATLAS_SUPERVISOR_MANAGED: "1" }), true);
  const child = [
    "Atlas agent loop",
    "HUMAN_REVIEW_REQUIRED",
    "Loop status: FAILED",
    "Evaluator: executed HUMAN_REVIEW_REQUIRED",
  ]
    .map((line) => redactChildHumanStatusLine(line))
    .filter((line): line is string => line !== null);
  assert.equal(child.includes("HUMAN_REVIEW_REQUIRED"), false);
  const output = managedOutput(
    { disposition: "HUMAN_REVIEW_REQUIRED", qaStatus: "not_run", evaluatorStatus: "not_run" },
    snapshotFromLoop({
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
      task: task(),
    }),
  );
  assert.equal(output.decision.invokeBuilder, false);
  assert.equal(countHumanStatusToken([...child, ...output.lines].join("\n"), HUMAN_REVIEW_REQUIRED), 0);
  assert.equal(countHumanStatusToken(output.text, "HUMAN_INTERVENTION_REQUIRED"), 1);
});
