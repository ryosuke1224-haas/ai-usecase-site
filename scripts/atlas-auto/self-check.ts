import assert from "node:assert/strict";
import { guardChanges } from "../atlas-agent/guards";
import { escapeHtml } from "./dashboard";
import { setStatus } from "./memory";
import { isSameIdea, summarize } from "./scoring";
import { blueprintPaths, buildTask } from "./spec";
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
  });
  assert.deepEqual(guarded.keep, [`${paths.route}page.tsx`, `${paths.tests}public.spec.ts`]);
  assert.equal(guarded.restore.length, 4);
}

export function runAutoSelfCheck(): void {
  checkScoring();
  checkDedupe();
  checkHistoryKeepsHumanDecisions();
  checkEscaping();
  checkGeneratedTask();
  console.log("Atlas Auto self-check passed.");
}
