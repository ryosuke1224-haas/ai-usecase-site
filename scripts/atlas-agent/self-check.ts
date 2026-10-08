import assert from "node:assert/strict";
import { decideEvaluation } from "./evaluator";
import { guardChanges } from "./guards";
import { taskSchema } from "./schema";

const taskPath = "agent-tasks/v1-loop-dry-run.json";

function checkScopeKeepsDocumentation() {
  const result = guardChanges({
    changes: [
      {
        path: "agents/v1-loop-dry-run.md",
        before: null,
        after: "This file is a loop dry run and does not change product behavior.\n",
      },
    ],
    scope: ["agents/v1-loop-dry-run.md"],
    forbidden: ["app/", "e2e/"],
    permitsQaChanges: false,
    taskPath,
  });
  assert.deepEqual(result.keep, ["agents/v1-loop-dry-run.md"]);
  assert.deepEqual(result.restore, []);
}

function checkTestEditIsRestored() {
  const result = guardChanges({
    changes: [
      {
        path: "e2e/daily-inbox-briefing/authenticated.spec.ts",
        before: "expect(true)",
        after: "test.skip(true)",
      },
    ],
    scope: ["e2e/daily-inbox-briefing/authenticated.spec.ts"],
    forbidden: [],
    permitsQaChanges: false,
    taskPath,
  });
  assert.deepEqual(result.keep, []);
  assert.equal(result.restore[0], "e2e/daily-inbox-briefing/authenticated.spec.ts");
  assert.equal(result.issues[0]?.classification, "TEST_PROTECTION_VIOLATION");
}

function checkOutOfScopeProductFileIsRestored() {
  const result = guardChanges({
    changes: [
      {
        path: "app/page.tsx",
        before: "before",
        after: "after",
      },
    ],
    scope: ["agents/v1-loop-dry-run.md"],
    forbidden: ["app/"],
    permitsQaChanges: false,
    taskPath,
  });
  assert.deepEqual(result.restore, ["app/page.tsx"]);
  assert.equal(result.issues[0]?.classification, "SCOPE_VIOLATION");
}

function checkTaskFileIsAlwaysProtected() {
  const result = guardChanges({
    changes: [
      {
        path: taskPath,
        before: "{\"acceptance_criteria\":[\"original\"]}",
        after: "{\"acceptance_criteria\":[\"weaker\"]}",
      },
    ],
    scope: [taskPath],
    forbidden: [],
    permitsQaChanges: true,
    taskPath,
  });
  assert.deepEqual(result.restore, [taskPath]);
}

function checkIterationCap() {
  const parsed = taskSchema.safeParse({
    schema_version: "atlas-agent-task-v1",
    id: "too-many",
    title: "Too many",
    objective: "Exceed the cap",
    target_use_case: "daily-inbox-briefing",
    scope: ["agents/note.md"],
    acceptance_criteria: ["The note exists."],
    forbidden_changes: [],
    requires_authenticated_qa: true,
    max_iterations: 4,
  });
  assert.equal(parsed.success, false);
}

function scores(safety = 9, accuracy = 9) {
  return [
    { dimension: "clarity", score: 9 },
    { dimension: "accuracy_and_grounding", score: accuracy },
    { dimension: "actionability", score: 9 },
    { dimension: "smb_relevance", score: 9 },
    { dimension: "ai_literacy_value", score: 9 },
    { dimension: "safety", score: safety },
    { dimension: "setup_usability", score: 9 },
    { dimension: "human_ai_boundary", score: 9 },
  ];
}

function checkEvaluatorDecisions() {
  assert.equal(
    decideEvaluation({ overallScore: 9, scores: scores(), findings: [] }),
    "PASS",
  );
  assert.equal(
    decideEvaluation({
      overallScore: 8,
      scores: scores(),
      findings: [{ severity: "LOW" }],
    }),
    "PASS_WITH_RECOMMENDATIONS",
  );
  assert.equal(
    decideEvaluation({
      overallScore: 9,
      scores: scores(),
      findings: [{ severity: "CRITICAL" }],
    }),
    "HUMAN_REVIEW_REQUIRED",
  );
  assert.equal(
    decideEvaluation({ overallScore: 9, scores: scores(6.5, 9), findings: [] }),
    "HUMAN_REVIEW_REQUIRED",
  );
  assert.equal(
    decideEvaluation({ overallScore: 7.4, scores: scores(), findings: [] }),
    "HUMAN_REVIEW_REQUIRED",
  );
}

export function runAgentLoopSelfCheck(): void {
  checkScopeKeepsDocumentation();
  checkTestEditIsRestored();
  checkOutOfScopeProductFileIsRestored();
  checkTaskFileIsAlwaysProtected();
  checkIterationCap();
  checkEvaluatorDecisions();
  console.log("Agent loop self-check passed.");
}
