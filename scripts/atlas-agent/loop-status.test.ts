import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatEvaluatorUserLine,
  formatLoopUserFacingLines,
  isSupervisorManaged,
  loopStatusFromResult,
  redactChildHumanStatusLine,
} from "./loop-status";

test("Supervisor-managed lower loop never owns HUMAN_REVIEW_REQUIRED", () => {
  assert.equal(isSupervisorManaged({ ATLAS_SUPERVISOR_MANAGED: "1" }), true);
  assert.equal(isSupervisorManaged({}), false);
  const failed = formatLoopUserFacingLines(
    loopStatusFromResult({
      disposition: "HUMAN_REVIEW_REQUIRED",
      qaStatus: "not_run",
      evaluatorStatus: "not_run",
    }),
  );
  assert.deepEqual(failed, ["Loop status: FAILED"]);
  assert.equal(failed.join("\n").includes("HUMAN_REVIEW_REQUIRED"), false);
  assert.equal(redactChildHumanStatusLine("HUMAN_REVIEW_REQUIRED"), null);
  assert.equal(redactChildHumanStatusLine("READY_FOR_HUMAN_REVIEW"), null);
  assert.equal(redactChildHumanStatusLine("Loop status: FAILED"), "Loop status: FAILED");
  assert.equal(
    redactChildHumanStatusLine("Evaluator: executed HUMAN_REVIEW_REQUIRED"),
    "Evaluator: executed internal",
  );
  assert.equal(
    formatEvaluatorUserLine({
      status: "executed",
      decision: "HUMAN_REVIEW_REQUIRED",
      overall: 7.1,
    }),
    "Evaluator: executed internal overall 7.1",
  );
});
