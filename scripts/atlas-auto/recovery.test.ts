import assert from "node:assert/strict";
import { test } from "node:test";
import type { AgentTask } from "../atlas-agent/schema";
import {
  executeRecovery,
  reconcileSpecAndTask,
  repairTaskForConflict,
  restoreProtectedTestAssignment,
  runRecoveryLoop,
  type RecoveryDeps,
} from "./recovery";
import { decideSupervisor, emptySupervisorState, snapshotFromLoop } from "./supervisor";
import type { BlueprintSpec } from "./spec";
import { validateBuilderAssignment } from "./task-assignment";
import { TASK_SCOPE_CONFLICT } from "./task-paths";

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

function deps(overrides: Partial<RecoveryDeps> = {}): RecoveryDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    now: () => "2026-10-30T15:00:00.000Z",
    prepareAuthSession: async () => {
      calls.push("prepareAuthSession");
      return { status: "ready" };
    },
    rerunQa: async () => {
      calls.push("rerunQa");
      return {
        qa: { status: "pass", passed: 12, failed: 0, skipped: 0 },
        evaluator: { status: "executed", decision: "PASS", overall: 8.7 },
        issues: [],
        criticalIssues: [],
      };
    },
    rerunBuilder: async () => {
      calls.push("rerunBuilder");
      return { build: "pass", qa: { status: "pass" } };
    },
    writeAssignment: () => {
      calls.push("writeAssignment");
    },
    ...overrides,
  };
}

test("task repair removes scope/forbidden overlap and keeps the protected test read-only", () => {
  const broken = task({
    scope: [...task().scope, `e2e/${SECURITY}/`],
    forbidden_changes: [...task().forbidden_changes, `e2e/${SECURITY}/`, "src/lib/blueprints.ts"],
    protected_files: [],
  });
  const repaired = repairTaskForConflict(spec(), broken);
  const check = validateBuilderAssignment({ spec: spec(), task: repaired });
  assert.equal(check.ok, true);
  assert.ok(!repaired.forbidden_changes.includes(`e2e/${SECURITY}/`));
  assert.ok(!repaired.forbidden_changes.includes("src/lib/blueprints.ts"));
  assert.ok(repaired.protected_files?.includes(`e2e/${SECURITY}/authenticated.spec.ts`));
  assert.equal(repaired.permits_qa_changes, false);
});

test("spec/task reconciliation strips stale My Blueprints isolation", () => {
  const stale = spec({
    acceptance_criteria: [
      ...spec().acceptance_criteria,
      "Both pages set robots noindex and are not linked from the homepage, header, or My Blueprints.",
      "The product does not add an entry to src/lib/blueprints.ts.",
    ],
  });
  const { spec: nextSpec, task: nextTask } = reconcileSpecAndTask(stale, task({ acceptance_criteria: stale.acceptance_criteria }));
  assert.equal(
    nextSpec.acceptance_criteria.some((item) => /not linked from the homepage, header, or My Blueprints/i.test(item)),
    false,
  );
  assert.equal(nextSpec.acceptance_criteria.some((item) => /does not add an entry to src\/lib\/blueprints/i.test(item)), false);
  assert.equal(validateBuilderAssignment({ spec: nextSpec, task: nextTask }).ok, true);
});

test("A. auth recovery reruns QA and does not invoke Builder", async () => {
  const tracked = deps();
  const snapshot = snapshotFromLoop({
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    issues: [{ issue_id: "AUTH_SESSION_REFRESH_REQUIRED", classification: "AUTH_SESSION_REFRESH_REQUIRED" }],
    spec: spec(),
    task: task(),
  });
  const executed = await executeRecovery(decideSupervisor(snapshot, emptySupervisorState()), {
    snapshot,
    spec: spec(),
    task: task(),
    specPath: "agent-specs/security-readiness-action-pack.json",
    taskPath: "agent-tasks/security-readiness-action-pack-premium-build.json",
  }, tracked);
  assert.deepEqual(tracked.calls, ["prepareAuthSession", "rerunQa"]);
  assert.equal(executed.builderInvoked, false);
  assert.equal(executed.snapshot.qa?.status, "pass");
});

test("B. protected-test recovery restores the assignment and retries Builder without rewriting the test", async () => {
  const tracked = deps();
  const snapshot = snapshotFromLoop({
    issues: [{ issue_id: "TEST_PROTECTION_VIOLATION", classification: "TEST_PROTECTION_VIOLATION" }],
    qa: { status: "not_run" },
    spec: spec(),
    task: task({ protected_files: [] }),
  });
  const executed = await executeRecovery(decideSupervisor(snapshot, emptySupervisorState()), {
    snapshot,
    spec: spec(),
    task: task({ protected_files: [] }),
    specPath: "spec.json",
    taskPath: "task.json",
  }, tracked);
  assert.ok(tracked.calls.includes("writeAssignment"));
  assert.ok(tracked.calls.includes("rerunBuilder"));
  assert.equal(executed.builderInvoked, true);
  assert.ok(executed.task.protected_files?.includes(`e2e/${SECURITY}/authenticated.spec.ts`));
  assert.match(executed.detail, /was not rewritten/);
});

test("C. task repair path does not invoke Builder until the conflict is gone", async () => {
  const tracked = deps();
  const broken = task({
    scope: [...task().scope, `e2e/${SECURITY}/`],
    forbidden_changes: [...task().forbidden_changes, `e2e/${SECURITY}/`],
  });
  const snapshot = snapshotFromLoop({
    assignment: { ok: false, code: TASK_SCOPE_CONFLICT, reason: "overlap" },
    spec: spec(),
    task: broken,
  });
  const executed = await executeRecovery(decideSupervisor(snapshot, emptySupervisorState()), {
    snapshot,
    spec: spec(),
    task: broken,
    specPath: "spec.json",
    taskPath: "task.json",
  }, tracked);
  assert.equal(executed.builderInvoked, false);
  assert.equal(tracked.calls.includes("rerunBuilder"), false);
  assert.equal(executed.recovered, true);
  assert.equal(executed.snapshot.assignment && "ok" in executed.snapshot.assignment && executed.snapshot.assignment.ok, true);
});

test("D. stale spec reconciliation does not call Builder", async () => {
  const tracked = deps();
  const stale = spec({
    acceptance_criteria: [
      ...spec().acceptance_criteria,
      "Both pages set robots noindex and are not linked from the homepage, header, or My Blueprints.",
    ],
  });
  const snapshot = snapshotFromLoop({ spec: stale, task: task(), assignment: { ok: true } });
  const executed = await executeRecovery(decideSupervisor(snapshot, emptySupervisorState()), {
    snapshot,
    spec: stale,
    task: task({ acceptance_criteria: stale.acceptance_criteria }),
    specPath: "spec.json",
    taskPath: "task.json",
  }, tracked);
  assert.equal(executed.builderInvoked, false);
  assert.equal(tracked.calls.includes("rerunBuilder"), false);
  assert.equal(executed.recovered, true);
});

test("auth then passing QA/Evaluator reaches READY_FOR_HUMAN_REVIEW without a product-fix Builder call", async () => {
  const tracked = deps();
  const result = await runRecoveryLoop({
    snapshot: snapshotFromLoop({
      builderCompleted: true,
      build: "pass",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
      issues: [{ issue_id: "AUTH_SESSION_REFRESH_REQUIRED", classification: "AUTH_SESSION_REFRESH_REQUIRED" }],
      spec: spec(),
      task: task(),
      assignment: { ok: true },
    }),
    state: emptySupervisorState(),
    spec: spec(),
    task: task(),
    specPath: "spec.json",
    taskPath: "task.json",
    deps: tracked,
  });
  assert.equal(result.decision.recommendation, "READY_FOR_HUMAN_REVIEW");
  assert.equal(tracked.calls.includes("rerunBuilder"), false);
  assert.ok(tracked.calls.includes("prepareAuthSession"));
  assert.ok(tracked.calls.includes("rerunQa"));
  assert.equal(result.state.history.length >= 1, true);
});

test("protected test restore keeps authenticated.spec.ts on the task as read-only", () => {
  const restored = restoreProtectedTestAssignment(spec(), task({ protected_files: [], permits_qa_changes: true }));
  assert.deepEqual(restored.protected_files, [`e2e/${SECURITY}/authenticated.spec.ts`]);
  assert.equal(restored.permits_qa_changes, false);
});
