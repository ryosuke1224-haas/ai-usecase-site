import type { EnvMap } from "../../src/lib/env-map";

export const ATLAS_SUPERVISOR_MANAGED = "ATLAS_SUPERVISOR_MANAGED";

export type LoopStatus = "COMPLETED" | "FAILED" | "BLOCKED" | "RECOVERY_REQUIRED";

export type LoopStatusInput = {
  disposition?: string;
  qaStatus?: string | null;
  evaluatorStatus?: string | null;
  issues?: { classification?: string; issue_id?: string }[];
};

export function loopStatusFromResult(input: LoopStatusInput): LoopStatus {
  if (input.disposition === "READY_FOR_HUMAN_REVIEW") return "COMPLETED";
  const issues = input.issues ?? [];
  if (
    issues.some(
      (issue) =>
        issue.classification === "AUTH_SESSION_REFRESH_REQUIRED" ||
        issue.issue_id === "AUTH_SESSION_REFRESH_REQUIRED",
    )
  ) {
    return "RECOVERY_REQUIRED";
  }
  if (input.qaStatus === "blocked") return "BLOCKED";
  return "FAILED";
}

export function formatLoopUserFacingLines(status: LoopStatus): string[] {
  return [`Loop status: ${status}`];
}

export function isSupervisorManaged(env: EnvMap = process.env): boolean {
  return env[ATLAS_SUPERVISOR_MANAGED] === "1";
}

/** Drop or rewrite child human-status lines so only the Supervisor can emit them. */
export function redactChildHumanStatusLine(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed === "HUMAN_REVIEW_REQUIRED" || trimmed === "READY_FOR_HUMAN_REVIEW") return null;
  if (trimmed === "HUMAN_INTERVENTION_REQUIRED") return null;
  if (/(?<!READY_FOR_)HUMAN_REVIEW_REQUIRED/.test(line)) {
    return line.replace(/(?<!READY_FOR_)HUMAN_REVIEW_REQUIRED/g, "internal");
  }
  return line;
}

export function formatEvaluatorUserLine(input: {
  status?: string | null;
  decision?: string | null;
  overall?: number | null;
}): string {
  const decision =
    input.decision === "HUMAN_REVIEW_REQUIRED" || input.decision === "READY_FOR_HUMAN_REVIEW"
      ? "internal"
      : input.decision;
  return (
    `Evaluator: ${input.status ?? "not_run"}` +
    (decision ? ` ${decision}` : "") +
    (input.overall != null ? ` overall ${input.overall}` : "")
  );
}
