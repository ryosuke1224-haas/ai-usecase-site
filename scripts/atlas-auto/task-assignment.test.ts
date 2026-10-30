import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { guardChanges } from "../atlas-agent/guards";
import { retryAssignmentFromCurrentFiles, shouldOpenFinalReview, validateBuilderAssignment } from "./task-assignment";
import { HUMAN_INTERVENTION_REQUIRED, scopeForbiddenOverlap, staleAcceptanceCriteria, TASK_SCOPE_CONFLICT } from "./task-paths";
import type { BlueprintSpec } from "./spec";
import type { AgentTask } from "../atlas-agent/schema";

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

test("scope and forbidden overlap is TASK_SCOPE_CONFLICT", () => {
  const overlap = scopeForbiddenOverlap(
    [`app/blueprints/${SECURITY}/`, `e2e/${SECURITY}/`],
    [`app/blueprints/${SECURITY}/`, `e2e/${SECURITY}/`],
  );
  assert.deepEqual(overlap.sort(), [`app/blueprints/${SECURITY}`, `e2e/${SECURITY}`].sort());
  const result = validateBuilderAssignment({
    spec: spec(),
    task: task({
      scope: [`app/blueprints/${SECURITY}/`, "src/lib/blueprints.ts"],
      forbidden_changes: [`app/blueprints/${SECURITY}/`],
    }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, TASK_SCOPE_CONFLICT);
    assert.match(result.reason, /TASK_SCOPE_CONFLICT/);
  }
});

test("a protected authenticated spec is not the same as forbidding the E2E directory", () => {
  const publicFile = `e2e/${SECURITY}/public.spec.ts`;
  const authFile = `e2e/${SECURITY}/authenticated.spec.ts`;
  assert.deepEqual(scopeForbiddenOverlap([`e2e/${SECURITY}/`, publicFile], [authFile]), []);
  const guarded = guardChanges({
    changes: [
      { path: publicFile, before: "expect(1)", after: "expect(1); expect(2)" },
      { path: authFile, before: "expect(true)", after: "test.skip(true)" },
    ],
    scope: [`app/blueprints/${SECURITY}/`, `e2e/${SECURITY}/`],
    forbidden: ["e2e/daily-inbox-briefing/"],
    permitsQaChanges: false,
    taskPath: "agent-tasks/example.json",
    protectedFiles: [authFile],
  });
  assert.deepEqual(guarded.keep, [publicFile]);
  assert.equal(guarded.restore.includes(authFile), true);
  assert.equal(guarded.issues.some((issue) => issue.classification === "TEST_PROTECTION_VIOLATION"), true);
});

test("current Spec/Task override a stale parent-run snapshot on retry", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-retry-assignment-"));
  const specPath = path.join(dir, "spec.json");
  const taskPath = path.join(dir, "task.json");
  const parentSpec = spec({
    acceptance_criteria: ["Old parent-run criterion: My Blueprints must contain zero Security links."],
    allowed_paths: [`app/blueprints/${SECURITY}/`],
  });
  const current = spec({
    acceptance_criteria: [
      "Security Readiness Action Pack is registered in src/lib/blueprints.ts with access premium.",
      "NEW RETRY CRITERION from the current Spec.",
    ],
  });
  const currentTask = task({
    acceptance_criteria: current.acceptance_criteria,
    scope: current.allowed_paths.concat([`e2e/${SECURITY}/public.spec.ts`]),
  });
  fs.writeFileSync(specPath, `${JSON.stringify(current)}\n`);
  fs.writeFileSync(taskPath, `${JSON.stringify(currentTask)}\n`);
  const assignment = retryAssignmentFromCurrentFiles({
    spec_path: specPath,
    task_path: taskPath,
  });
  assert.equal(assignment.ok, true);
  if (assignment.ok) {
    assert.equal(assignment.task.acceptance_criteria.includes("NEW RETRY CRITERION from the current Spec."), true);
    assert.equal(
      assignment.task.acceptance_criteria.includes("Old parent-run criterion: My Blueprints must contain zero Security links."),
      false,
    );
    assert.equal(assignment.task.scope.includes("src/lib/blueprints.ts"), true);
    assert.equal(assignment.task.forbidden_changes.includes("src/lib/blueprints.ts"), false);
  }
  assert.equal(
    staleAcceptanceCriteria([
      "With a signed-in session, /my-blueprints contains zero links whose href includes '/blueprints/security-readiness-action-pack'.",
    ]).length,
    1,
  );
  fs.rmSync(dir, { recursive: true, force: true });
  void parentSpec;
});

test("stale parent-run My Blueprints isolation is rejected before Builder", () => {
  const result = validateBuilderAssignment({
    spec: spec(),
    task: task({
      acceptance_criteria: [
        ...spec().acceptance_criteria,
        "Both pages set robots noindex and are not linked from the homepage, header, or My Blueprints.",
      ],
    }),
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "STALE_ACCEPTANCE_CRITERIA");
});

test("authenticated QA requirement is preserved", () => {
  const result = validateBuilderAssignment({
    spec: spec(),
    task: task({ requires_authenticated_qa: false }),
  });
  assert.equal(result.ok, false);
});

test("final review stays closed unless Build, QA, and Evaluator complete", () => {
  assert.equal(
    shouldOpenFinalReview({
      disposition: "HUMAN_REVIEW_REQUIRED",
      build: "not_run",
      qa: { status: "not_run" },
      evaluator: { status: "not_run", decision: null },
    }),
    false,
  );
  assert.equal(
    shouldOpenFinalReview({
      disposition: HUMAN_INTERVENTION_REQUIRED,
      build: "pass",
      qa: { status: "fail" },
      evaluator: { status: "not_run", decision: null },
    }),
    false,
  );
  assert.equal(
    shouldOpenFinalReview({
      disposition: "READY_FOR_HUMAN_REVIEW",
      build: "pass",
      qa: { status: "pass" },
      evaluator: { status: "executed", decision: "PASS_WITH_RECOMMENDATIONS" },
    }),
    true,
  );
});
