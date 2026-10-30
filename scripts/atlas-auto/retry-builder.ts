import fs from "node:fs";
import { loadRun, readJson, runMemoryDir, saveRun, writeJson } from "./memory";
import { blueprintPaths } from "./spec";
import type { BlueprintSpec } from "./spec";
import type { CandidateDecision, RunRecord, ScoredCandidate } from "./types";

export type BuilderLoopSnapshot = {
  disposition?: string;
  files_changed?: string[];
  qa_result?: { status?: string };
  unresolved_issues?: { classification?: string }[];
};

export type BuilderRetryInspection = {
  source: RunRecord;
  approval: CandidateDecision | null;
  spec: BlueprintSpec | null;
  specExists: boolean;
  loop: BuilderLoopSnapshot | null;
  productPresent: boolean;
};

export function inspectBuilderRetry(runId: string): BuilderRetryInspection {
  const source = loadRun(runId);
  if (!source) throw new Error(`Run not found: ${runMemoryDir(runId)}/run.json`);
  const specPath = source.spec_path;
  const specExists = Boolean(specPath && fs.existsSync(specPath));
  return {
    source,
    approval: readJson<CandidateDecision>(source.approval_file),
    spec: specExists ? readJson<BlueprintSpec>(specPath!) : null,
    specExists,
    loop: source.loop_result ? readJson<BuilderLoopSnapshot>(source.loop_result) : null,
    productPresent: approvedProductPresent(source.approved_candidate_id),
  };
}

export function approvedProductPresent(candidateId: string | null): boolean {
  if (!candidateId) return false;
  const paths = blueprintPaths(candidateId);
  return [paths.route, paths.components, paths.lib, paths.tests].some((dir) => fs.existsSync(dir));
}

export function previousBuildSucceeded(source: RunRecord, loop: BuilderLoopSnapshot | null): boolean {
  const disposition = loop?.disposition ?? source.loop_disposition;
  const qa = loop?.qa_result?.status;
  if (qa === "pass" && source.supervisor?.recommendation === "READY_FOR_HUMAN_REVIEW") return true;
  if (disposition === "READY_FOR_HUMAN_REVIEW" && qa === "pass") return true;
  return false;
}

export function evaluateBuilderRetry(
  input: BuilderRetryInspection,
): { ok: true } | { ok: false; reason: string } {
  const { source, approval, spec, specExists, loop, productPresent } = input;
  if (source.committed || source.pushed || source.published) {
    return { ok: false, reason: "The source run already committed, pushed, or published." };
  }
  if (source.phase === "READY_FOR_PREVIEW" || source.commerce?.statuses.includes("READY_FOR_PREVIEW")) {
    return { ok: false, reason: "The source run already reached preview or has a priced product." };
  }
  const approvedId = source.approved_candidate_id;
  if (!approvedId || approval?.decision !== "APPROVED" || approval.candidate_id !== approvedId) {
    return { ok: false, reason: "The candidate was not human approved." };
  }
  if (!specExists || !spec || spec.id !== approvedId || spec.schema_version !== "atlas-blueprint-spec-v1") {
    return { ok: false, reason: "A valid Spec for the approved candidate was not found." };
  }
  if (previousBuildSucceeded(source, loop)) {
    return {
      ok: false,
      reason: productPresent
        ? "A successful build already exists. Retry would overwrite it."
        : "The previous build already completed successfully.",
    };
  }
  return { ok: true };
}

export function resumeBlockedMessage(run: RunRecord, retryEligible: boolean): string {
  if (run.phase === "HUMAN_INTERVENTION_REQUIRED" && retryEligible) {
    return `Run ${run.run_id} needs HUMAN_INTERVENTION_REQUIRED, not a product/price final review. To retry the Builder: npm run atlas:auto -- --retry-builder ${run.run_id}`;
  }
  if (run.phase !== "FINISHED" && run.phase !== "READY_FOR_PREVIEW") {
    return `Run ${run.run_id} cannot be resumed from ${run.phase}.`;
  }
  if (retryEligible && run.phase === "FINISHED") {
    return `Run ${run.run_id} is already FINISHED. To retry the Builder without rerunning Research, Scoring, approval, or Spec: npm run atlas:auto -- --retry-builder ${run.run_id}`;
  }
  return `Run ${run.run_id} is already ${run.phase}.`;
}

export function createBuilderRetryRun(input: {
  source: RunRecord;
  approval: CandidateDecision;
  specPath: string;
  taskPath: string;
  runId: string;
  now: string;
}): { run: RunRecord; approval: CandidateDecision } {
  const { source, approval, specPath, taskPath, runId, now } = input;
  return {
    run: {
      schema_version: "atlas-auto-run-v1",
      run_id: runId,
      parent_run_id: source.run_id,
      retry_kind: "builder",
      mode: "full",
      branch: source.branch,
      started_at: now,
      updated_at: now,
      phase: "BUILD",
      research_source: source.research_source,
      scoring_source: source.scoring_source,
      research_notes: [
        ...source.research_notes,
        `Builder retry of ${source.run_id}. The approved candidate and Spec were reused. Research, scoring, approval, and the Spec Agent were not rerun.`,
      ],
      candidates: source.candidates,
      filtered_candidates: source.filtered_candidates,
      dashboard_file: null,
      dashboard_url: null,
      approval_file: `${runMemoryDir(runId)}/approval.json`,
      approved_candidate_id: source.approved_candidate_id,
      spec_path: specPath,
      task_path: taskPath,
      loop_result: null,
      loop_disposition: null,
      final_review_file: null,
      final_review_decision: null,
      commerce: null,
      builder_ran: false,
      committed: false,
      pushed: false,
      published: false,
      notes: [
        `Builder retry of ${source.run_id}. Reusing ${specPath}. Research, scoring, approval, and Spec were not rerun.`,
      ],
    },
    approval: {
      ...approval,
      run_id: runId,
      note: approval.note || `Reused human approval from ${source.run_id}.`,
      source: "file",
    },
  };
}

export function persistBuilderRetry(input: {
  run: RunRecord;
  approval: CandidateDecision;
  candidates: ScoredCandidate[];
}): void {
  writeJson(`${runMemoryDir(input.run.run_id)}/candidates.json`, input.candidates);
  writeJson(`${runMemoryDir(input.run.run_id)}/decisions.json`, []);
  writeJson(input.run.approval_file, input.approval);
  saveRun(input.run);
}

export function canApproveProductAndPrice(data: {
  disposition: string;
  build: string;
  qa: { status: string; skipped?: number };
  evaluator: { status: string; decision: string | null };
  supervisor?: { recommendation?: string } | null;
}): boolean {
  if (
    data.supervisor?.recommendation === "HUMAN_INTERVENTION_REQUIRED" ||
    data.supervisor?.recommendation === "NEEDS_INTERNAL_RECOVERY"
  ) {
    return false;
  }
  const dispositionOk =
    data.disposition === "READY_FOR_HUMAN_REVIEW" ||
    (data.disposition === "HUMAN_REVIEW_REQUIRED" && data.supervisor?.recommendation === "READY_FOR_HUMAN_REVIEW");
  if (!dispositionOk) return false;
  if ((data.qa.skipped ?? 0) > 0) return false;
  return (
    data.build === "pass" &&
    data.qa.status === "pass" &&
    data.evaluator.status !== "not_run" &&
    (data.evaluator.decision === "PASS" || data.evaluator.decision === "PASS_WITH_RECOMMENDATIONS")
  );
}