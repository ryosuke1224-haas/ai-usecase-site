import { HUMAN_INTERVENTION_REQUIRED } from "./task-paths";
import { HUMAN_REVIEW_REQUIRED, type SupervisorReport } from "./supervisor";
import type { RunRecord } from "./types";

export const PENDING_SUPERVISOR = "PENDING_SUPERVISOR";

export type CanonicalFinalStatus =
  | typeof HUMAN_REVIEW_REQUIRED
  | typeof HUMAN_INTERVENTION_REQUIRED
  | typeof PENDING_SUPERVISOR;

export type FinalReviewStatusInput = {
  disposition?: string;
  build?: string;
  qa?: { status?: string; skipped?: number; passed?: number; failed?: number };
  evaluator?: { status?: string; decision?: string | null };
  supervisor?: { recommendation?: string | null; authenticatedQa?: string | null; blockingFindings?: number } | null;
  supervisorRecommendation?: string | null;
  authenticatedQa?: string | null;
  blockingFindings?: number;
  requiresAuthenticatedQa?: boolean;
};

export function supervisorRecommendationOf(
  input: FinalReviewStatusInput | Pick<RunRecord, "supervisor">,
): string | null {
  if ("supervisorRecommendation" in input && input.supervisorRecommendation) return input.supervisorRecommendation;
  const supervisor = "supervisor" in input ? input.supervisor : null;
  if (supervisor && "recommendation" in supervisor && supervisor.recommendation) return supervisor.recommendation;
  if (supervisor && "last_report" in supervisor) {
    const report = (supervisor as { last_report?: SupervisorReport | null }).last_report;
    if (report?.recommendation) return report.recommendation;
  }
  return null;
}

/** PENDING_SUPERVISOR only while Supervisor has not finished. READY never pairs with PENDING. */
export function canonicalFinalReviewStatus(input: FinalReviewStatusInput): CanonicalFinalStatus {
  const rec = supervisorRecommendationOf(input);
  if (rec === "READY_FOR_HUMAN_REVIEW") return HUMAN_REVIEW_REQUIRED;
  if (rec === "HUMAN_INTERVENTION_REQUIRED") return HUMAN_INTERVENTION_REQUIRED;
  return PENDING_SUPERVISOR;
}

export function applyCanonicalFinalReview<T extends FinalReviewStatusInput>(data: T): T & { disposition: CanonicalFinalStatus } {
  return { ...data, disposition: canonicalFinalReviewStatus(data) };
}

export function persistCanonicalFinalReviewStatus(
  run: Pick<RunRecord, "loop_disposition"> & { status?: string | null },
  data: { disposition: string },
): void {
  run.loop_disposition = data.disposition;
  run.status = data.disposition;
}

export function canonicalStatusFromRun(
  run: Pick<RunRecord, "supervisor" | "loop_disposition" | "status">,
): CanonicalFinalStatus {
  const report = run.supervisor?.last_report ?? null;
  return canonicalFinalReviewStatus({
    build: report?.build,
    qa: {
      status: qaStatusFromReport(report),
      passed: report?.qaPassed,
      failed: report?.qaFailed,
      skipped: report?.qaSkipped,
    },
    evaluator: {
      status: report?.evaluatorDecision ? "executed" : "not_run",
      decision: report?.evaluatorDecision ?? null,
    },
    supervisor: report,
    supervisorRecommendation: supervisorRecommendationOf(run),
    authenticatedQa: report?.authenticatedQa,
    blockingFindings: report?.blockingFindings,
  });
}

export function planFinalReviewResume(run: Pick<RunRecord, "phase" | "loop_result" | "supervisor" | "loop_disposition" | "status">): {
  reuseExistingResults: boolean;
  invokeBuilder: false;
  invokeQa: false;
  invokeEvaluator: false;
  status: CanonicalFinalStatus;
} {
  const status = canonicalStatusFromRun(run);
  return {
    reuseExistingResults: run.phase === "AWAITING_FINAL_REVIEW" && Boolean(run.loop_result),
    invokeBuilder: false,
    invokeQa: false,
    invokeEvaluator: false,
    status,
  };
}

export function isContradictoryFinalReview(input: FinalReviewStatusInput): boolean {
  return input.disposition === PENDING_SUPERVISOR && supervisorRecommendationOf(input) === "READY_FOR_HUMAN_REVIEW";
}

export function finalReviewGatesSatisfied(input: FinalReviewStatusInput): boolean {
  if (input.build !== "pass") return false;
  if (input.qa?.status !== "pass") return false;
  if ((input.qa.skipped ?? 0) > 0) return false;
  const auth = input.authenticatedQa ?? input.supervisor?.authenticatedQa;
  if (input.requiresAuthenticatedQa !== false && auth && auth !== "pass" && auth !== "not_required") return false;
  const decision = input.evaluator?.decision;
  if (decision !== "PASS" && decision !== "PASS_WITH_RECOMMENDATIONS") return false;
  if ((input.blockingFindings ?? input.supervisor?.blockingFindings ?? 0) > 0) return false;
  return supervisorRecommendationOf(input) === "READY_FOR_HUMAN_REVIEW";
}

function qaStatusFromReport(report: SupervisorReport | null): string {
  if (!report) return "not_run";
  if (report.qaFailed > 0) return "fail";
  if (report.build === "pass" && report.qaPassed > 0 && report.qaFailed === 0) return "pass";
  return "not_run";
}
