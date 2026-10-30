import type { AgentTask } from "../atlas-agent/schema";
import type { AssignmentError } from "./task-assignment";
import { HUMAN_INTERVENTION_REQUIRED } from "./task-paths";
import type { BlueprintSpec } from "./spec";

export const HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED";

export const SUPERVISOR_LIMITS = {
  maxProductFixIterations: 3,
  maxAuthSessionAttempts: 2,
  maxTaskSpecReconcileAttempts: 2,
  maxEvaluatorRebuilds: 2,
  maxTotalCycles: 6,
  maxBuildInfraRetries: 1,
} as const;

export type FailureCategory =
  | "NONE"
  | "PRODUCT_DEFECT"
  | "BUILD_INFRA_FAILURE"
  | "AUTH_SESSION_FAILURE"
  | "QA_INFRA_FAILURE"
  | "TEST_PROTECTION_VIOLATION"
  | "TASK_SCOPE_CONFLICT"
  | "STALE_SPEC"
  | "TASK_SPEC_MISMATCH"
  | "EVALUATOR_REJECTED"
  | "ORCHESTRATION_FAILURE";

export type RecoveryAction =
  | "NONE"
  | "PREPARE_AUTH_SESSION"
  | "RERUN_QA"
  | "RERUN_BUILDER"
  | "REPAIR_TASK"
  | "RECONCILE_SPEC_TASK"
  | "RESTORE_PROTECTED_TEST"
  | "ESCALATE";

export type SupervisorRecommendation =
  | "READY_FOR_HUMAN_REVIEW"
  | "NEEDS_INTERNAL_RECOVERY"
  | "HUMAN_INTERVENTION_REQUIRED";

export type RecoveryEvent = {
  at: string;
  classification: FailureCategory;
  action: RecoveryAction;
  result: "planned" | "recovered" | "failed" | "escalated";
  detail: string;
};

export type SupervisorState = {
  cycles_used: number;
  product_fix_iterations: number;
  auth_session_attempts: number;
  task_spec_reconcile_attempts: number;
  evaluator_rebuilds: number;
  protected_test_violations: number;
  infra_retries: number;
  history: RecoveryEvent[];
  recommendation: SupervisorRecommendation | null;
  last_classification: FailureCategory | null;
  last_report?: SupervisorReport | null;
};

export type IssueSnapshot = {
  issue_id?: string;
  test?: string;
  actual?: string;
  classification?: string;
  severity?: string;
};

export type EvaluatorFinding = {
  severity?: string;
  description?: string;
  relevant_files?: string[];
};

export type SupervisorSnapshot = {
  assignment?: AssignmentError | { ok: true };
  spec?: Pick<BlueprintSpec, "acceptance_criteria" | "allowed_paths" | "qa_checks">;
  task?: Pick<AgentTask, "requires_authenticated_qa" | "scope" | "forbidden_changes" | "acceptance_criteria">;
  builderCompleted?: boolean;
  build?: string;
  qa?: { status: string; passed?: number; failed?: number; skipped?: number };
  evaluator?: { status: string; decision: string | null; overall?: number | null };
  issues?: IssueSnapshot[];
  findings?: EvaluatorFinding[];
  criticalIssues?: string[];
};

export type SupervisorDecision = {
  classification: FailureCategory;
  action: RecoveryAction;
  recommendation: SupervisorRecommendation;
  invokeBuilder: boolean;
  reason: string;
  ready: boolean;
  intervention?: string;
  report: SupervisorReport;
};

export type SupervisorReport = {
  recommendation: SupervisorRecommendation;
  classification: FailureCategory;
  build: string;
  qaPassed: number;
  qaFailed: number;
  qaSkipped: number;
  authenticatedQa: "pass" | "fail" | "not_run" | "not_required";
  evaluatorDecision: string | null;
  evaluatorScore: number | null;
  blockingFindings: number;
  nonBlockingFindings: number;
  recoveryCyclesUsed: number;
  intervention?: string;
};

export function emptySupervisorState(): SupervisorState {
  return {
    cycles_used: 0,
    product_fix_iterations: 0,
    auth_session_attempts: 0,
    task_spec_reconcile_attempts: 0,
    evaluator_rebuilds: 0,
    protected_test_violations: 0,
    infra_retries: 0,
    history: [],
    recommendation: null,
    last_classification: null,
    last_report: null,
  };
}

export function authenticatedQaStatus(snapshot: SupervisorSnapshot): "pass" | "fail" | "not_run" | "not_required" {
  const required =
    snapshot.task?.requires_authenticated_qa ??
    snapshot.spec?.qa_checks?.some((check) => check.requires_auth) ??
    true;
  if (!required) return "not_required";
  if (hasIssue(snapshot, "AUTH_SESSION_REFRESH_REQUIRED") || hasIssue(snapshot, "AUTH_SESSION_FAILURE")) {
    return "fail";
  }
  if (snapshot.qa?.status === "not_run" || !snapshot.qa) return "not_run";
  if ((snapshot.qa.skipped ?? 0) > 0) return "fail";
  if (snapshot.qa.status === "pass") return "pass";
  return "fail";
}

export function classifyFailure(snapshot: SupervisorSnapshot): FailureCategory {
  const assignment = snapshot.assignment;
  if (assignment && assignment.ok === false) {
    if (assignment.code === "TASK_SCOPE_CONFLICT") return "TASK_SCOPE_CONFLICT";
    if (assignment.code === "STALE_ACCEPTANCE_CRITERIA") return "STALE_SPEC";
    return "TASK_SPEC_MISMATCH";
  }
  if (snapshot.spec && staleSpec(snapshot.spec)) return "STALE_SPEC";

  if (hasIssue(snapshot, "TEST_PROTECTION_VIOLATION")) return "TEST_PROTECTION_VIOLATION";
  if (hasIssue(snapshot, "AUTH_SESSION_REFRESH_REQUIRED") || hasIssue(snapshot, "AUTH_SESSION_FAILURE")) {
    return "AUTH_SESSION_FAILURE";
  }
  if (hasIssue(snapshot, "TASK_SCOPE_CONFLICT")) return "TASK_SCOPE_CONFLICT";
  if (hasIssue(snapshot, "BUILDER_TIMEOUT")) return "BUILD_INFRA_FAILURE";
  if (secretFileIssue(snapshot)) return "ORCHESTRATION_FAILURE";
  if (qaInfraIssue(snapshot)) return "QA_INFRA_FAILURE";
  if (hasIssue(snapshot, "SCOPE_VIOLATION") || hasIssue(snapshot, "VALIDATION_FAILURE")) return "PRODUCT_DEFECT";
  if (hasIssue(snapshot, "BUILD_FAILURE") && infraBuild(snapshot)) return "BUILD_INFRA_FAILURE";
  if (hasIssue(snapshot, "BUILD_FAILURE") || snapshot.build === "fail") {
    return infraBuild(snapshot) ? "BUILD_INFRA_FAILURE" : "PRODUCT_DEFECT";
  }
  if (hasIssue(snapshot, "QA_FAILURE") || snapshot.qa?.status === "fail") return "PRODUCT_DEFECT";
  if (snapshot.evaluator?.decision === "HUMAN_REVIEW_REQUIRED" || blockingFindings(snapshot).length > 0) {
    return "EVALUATOR_REJECTED";
  }
  if (snapshot.qa?.status === "not_run" || snapshot.build === "not_run" || snapshot.evaluator?.status === "not_run") {
    return "ORCHESTRATION_FAILURE";
  }
  return "NONE";
}

export function routeRecovery(
  classification: FailureCategory,
  state: SupervisorState,
  snapshot: SupervisorSnapshot = {},
): RecoveryAction {
  if (classification === "NONE") return "NONE";
  if (limitsExhausted(state, classification)) return "ESCALATE";
  switch (classification) {
    case "PRODUCT_DEFECT":
      return "RERUN_BUILDER";
    case "AUTH_SESSION_FAILURE":
      return "PREPARE_AUTH_SESSION";
    case "QA_INFRA_FAILURE":
      return "ESCALATE";
    case "TEST_PROTECTION_VIOLATION":
      return "RESTORE_PROTECTED_TEST";
    case "TASK_SCOPE_CONFLICT":
      return "REPAIR_TASK";
    case "STALE_SPEC":
    case "TASK_SPEC_MISMATCH":
      return "RECONCILE_SPEC_TASK";
    case "BUILD_INFRA_FAILURE":
      return "RERUN_BUILDER";
    case "EVALUATOR_REJECTED":
      return evaluatorActionable(snapshot) ? "RERUN_BUILDER" : "ESCALATE";
    case "ORCHESTRATION_FAILURE":
      return safeOrchestrationRepair(snapshot);
    default:
      return "ESCALATE";
  }
}

export function isReadyForHumanReview(snapshot: SupervisorSnapshot): boolean {
  if (classifyFailure(snapshot) !== "NONE") return false;
  if (snapshot.builderCompleted === false) return false;
  if (snapshot.build !== "pass") return false;
  if (snapshot.qa?.status !== "pass") return false;
  const auth = authenticatedQaStatus(snapshot);
  if (auth !== "pass" && auth !== "not_required") return false;
  if (snapshot.evaluator?.status === "not_run" || !snapshot.evaluator?.decision) return false;
  if (snapshot.evaluator.decision !== "PASS" && snapshot.evaluator.decision !== "PASS_WITH_RECOMMENDATIONS") {
    return false;
  }
  if (blockingFindings(snapshot).length > 0) return false;
  if ((snapshot.criticalIssues ?? []).length > 0) return false;
  return true;
}

export function decideSupervisor(snapshot: SupervisorSnapshot, state: SupervisorState): SupervisorDecision {
  if (isReadyForHumanReview(snapshot)) {
    return decision(snapshot, state, {
      classification: "NONE",
      action: "NONE",
      recommendation: "READY_FOR_HUMAN_REVIEW",
      invokeBuilder: false,
      reason: "Build, QA, authenticated QA, and Evaluator completed with no blocking issues.",
      ready: true,
    });
  }
  const classification = classifyFailure(snapshot);
  const action = routeRecovery(classification, state, snapshot);
  if (action === "ESCALATE" || (classification === "ORCHESTRATION_FAILURE" && action === "ESCALATE")) {
    const intervention = interventionFor(classification, state);
    return decision(snapshot, state, {
      classification,
      action: "ESCALATE",
      recommendation: "HUMAN_INTERVENTION_REQUIRED",
      invokeBuilder: false,
      reason: `${HUMAN_INTERVENTION_REQUIRED}. ${intervention}`,
      ready: false,
      intervention,
    });
  }
  return decision(snapshot, state, {
    classification,
    action,
    recommendation: "NEEDS_INTERNAL_RECOVERY",
    invokeBuilder: action === "RERUN_BUILDER" || action === "RESTORE_PROTECTED_TEST",
    reason: `Supervisor will ${action} for ${classification}.`,
    ready: false,
  });
}

export function applyPlannedAction(state: SupervisorState, decision: SupervisorDecision, at: string): SupervisorState {
  const next: SupervisorState = {
    ...state,
    history: [...state.history],
    recommendation: decision.recommendation,
    last_classification: decision.classification,
    last_report: decision.report,
  };
  if (decision.action === "NONE" && decision.recommendation === "READY_FOR_HUMAN_REVIEW") {
    return next;
  }
  next.cycles_used += 1;
  if (decision.classification === "PRODUCT_DEFECT") next.product_fix_iterations += 1;
  if (decision.classification === "AUTH_SESSION_FAILURE" || decision.action === "PREPARE_AUTH_SESSION") {
    next.auth_session_attempts += 1;
  }
  if (decision.action === "REPAIR_TASK" || decision.action === "RECONCILE_SPEC_TASK") {
    next.task_spec_reconcile_attempts += 1;
  }
  if (decision.classification === "EVALUATOR_REJECTED") next.evaluator_rebuilds += 1;
  if (decision.classification === "TEST_PROTECTION_VIOLATION") next.protected_test_violations += 1;
  if (decision.classification === "BUILD_INFRA_FAILURE") next.infra_retries += 1;
  next.history.push({
    at,
    classification: decision.classification,
    action: decision.action,
    result: decision.recommendation === "HUMAN_INTERVENTION_REQUIRED" ? "escalated" : "planned",
    detail: decision.reason,
  });
  return next;
}

export function completeRecovery(state: SupervisorState, result: RecoveryEvent["result"], detail: string): SupervisorState {
  const history = [...state.history];
  const last = history.at(-1);
  if (last) history[history.length - 1] = { ...last, result, detail };
  return { ...state, history };
}

export function humanFacingDisposition(
  recommendation: SupervisorRecommendation,
): typeof HUMAN_REVIEW_REQUIRED | typeof HUMAN_INTERVENTION_REQUIRED | null {
  if (recommendation === "READY_FOR_HUMAN_REVIEW") return HUMAN_REVIEW_REQUIRED;
  if (recommendation === "HUMAN_INTERVENTION_REQUIRED") return HUMAN_INTERVENTION_REQUIRED;
  return null;
}

export function mergeSnapshot(base: SupervisorSnapshot, patch: Partial<SupervisorSnapshot>): SupervisorSnapshot {
  return {
    ...base,
    ...patch,
    qa: patch.qa ? { ...base.qa, ...patch.qa } : base.qa,
    evaluator: patch.evaluator ? { ...base.evaluator, ...patch.evaluator } : base.evaluator,
    issues: patch.issues ?? base.issues,
    findings: patch.findings ?? base.findings,
    criticalIssues: patch.criticalIssues ?? base.criticalIssues,
    assignment: patch.assignment ?? base.assignment,
    spec: patch.spec ?? base.spec,
    task: patch.task ?? base.task,
  };
}

export function snapshotFromLoop(input: {
  builderCompleted?: boolean;
  build?: string;
  qa?: SupervisorSnapshot["qa"];
  evaluator?: SupervisorSnapshot["evaluator"];
  issues?: IssueSnapshot[];
  findings?: EvaluatorFinding[];
  criticalIssues?: string[];
  spec?: SupervisorSnapshot["spec"];
  task?: SupervisorSnapshot["task"];
  assignment?: SupervisorSnapshot["assignment"];
}): SupervisorSnapshot {
  return {
    builderCompleted: input.builderCompleted ?? true,
    build: input.build ?? "not_run",
    qa: input.qa ?? { status: "not_run", passed: 0, failed: 0, skipped: 0 },
    evaluator: input.evaluator ?? { status: "not_run", decision: null },
    issues: input.issues ?? [],
    findings: input.findings ?? [],
    criticalIssues: input.criticalIssues ?? [],
    spec: input.spec,
    task: input.task,
    assignment: input.assignment,
  };
}

function decision(
  snapshot: SupervisorSnapshot,
  state: SupervisorState,
  fields: Omit<SupervisorDecision, "report">,
): SupervisorDecision {
  const auth = authenticatedQaStatus(snapshot);
  const blocking = blockingFindings(snapshot);
  return {
    ...fields,
    report: {
      recommendation: fields.recommendation,
      classification: fields.classification,
      build: snapshot.build ?? "not_run",
      qaPassed: snapshot.qa?.passed ?? 0,
      qaFailed: snapshot.qa?.failed ?? 0,
      qaSkipped: snapshot.qa?.skipped ?? 0,
      authenticatedQa: auth,
      evaluatorDecision: snapshot.evaluator?.decision ?? null,
      evaluatorScore: snapshot.evaluator?.overall ?? null,
      blockingFindings: blocking.length,
      nonBlockingFindings: Math.max(0, (snapshot.findings ?? []).length - blocking.length),
      recoveryCyclesUsed: state.cycles_used,
      intervention: fields.intervention,
    },
  };
}

function hasIssue(snapshot: SupervisorSnapshot, classification: string): boolean {
  return (snapshot.issues ?? []).some(
    (issue) =>
      issue.classification === classification ||
      issue.issue_id === classification ||
      (typeof issue.actual === "string" && issue.actual.includes(classification)),
  );
}

function secretFileIssue(snapshot: SupervisorSnapshot): boolean {
  return (snapshot.issues ?? []).some((issue) => issue.issue_id === "secret-file-modified");
}

function qaInfraIssue(snapshot: SupervisorSnapshot): boolean {
  const text = (snapshot.issues ?? []).map((issue) => `${issue.actual ?? ""} ${issue.test ?? ""}`).join(" ");
  return /playwright browsers|webServer|ECONNREFUSED|Executable doesn't exist/i.test(text);
}

function infraBuild(snapshot: SupervisorSnapshot): boolean {
  const text = [...(snapshot.issues ?? []).map((issue) => issue.actual ?? ""), ...(snapshot.criticalIssues ?? [])].join(
    " ",
  );
  return /ECONNREFUSED|ENOENT|timed out|timeout|webServer|playwright/i.test(text);
}

function staleSpec(spec: { acceptance_criteria: string[] }): boolean {
  return spec.acceptance_criteria.some((item) =>
    /my-blueprints contains zero|not linked from the homepage, header, or My Blueprints|does not add an entry to src\/lib\/blueprints/i.test(
      item,
    ),
  );
}

function blockingFindings(snapshot: SupervisorSnapshot): EvaluatorFinding[] {
  return (snapshot.findings ?? []).filter((finding) => finding.severity === "CRITICAL" || finding.severity === "HIGH");
}

function evaluatorActionable(snapshot: SupervisorSnapshot): boolean {
  const findings = snapshot.findings ?? [];
  if (findings.length === 0) return snapshot.evaluator?.decision === "HUMAN_REVIEW_REQUIRED";
  if (findings.every((finding) => strategicText(finding.description ?? ""))) return false;
  return findings.some((finding) => {
    if (strategicText(finding.description ?? "")) return false;
    return (
      finding.severity === "HIGH" ||
      finding.severity === "CRITICAL" ||
      (finding.relevant_files ?? []).length > 0
    );
  });
}

function strategicText(text: string): boolean {
  return /pricing|positioning|market strategy|legal|business model|brand|go-to-market|strategic/i.test(text);
}

function safeOrchestrationRepair(snapshot: SupervisorSnapshot): RecoveryAction {
  if (secretFileIssue(snapshot)) return "ESCALATE";
  if (snapshot.build === "pass" && snapshot.qa?.status === "not_run") return "RERUN_QA";
  if (snapshot.build === "pass" && snapshot.qa?.status === "pass" && snapshot.evaluator?.status === "not_run") {
    return "RERUN_QA";
  }
  return "ESCALATE";
}

function limitsExhausted(state: SupervisorState, classification: FailureCategory): boolean {
  if (state.cycles_used >= SUPERVISOR_LIMITS.maxTotalCycles) return true;
  if (classification === "PRODUCT_DEFECT" && state.product_fix_iterations >= SUPERVISOR_LIMITS.maxProductFixIterations) {
    return true;
  }
  if (
    classification === "AUTH_SESSION_FAILURE" &&
    state.auth_session_attempts >= SUPERVISOR_LIMITS.maxAuthSessionAttempts
  ) {
    return true;
  }
  if (
    (classification === "STALE_SPEC" ||
      classification === "TASK_SPEC_MISMATCH" ||
      classification === "TASK_SCOPE_CONFLICT") &&
    state.task_spec_reconcile_attempts >= SUPERVISOR_LIMITS.maxTaskSpecReconcileAttempts
  ) {
    return true;
  }
  if (classification === "EVALUATOR_REJECTED" && state.evaluator_rebuilds >= SUPERVISOR_LIMITS.maxEvaluatorRebuilds) {
    return true;
  }
  if (classification === "TEST_PROTECTION_VIOLATION" && state.protected_test_violations >= 1) return true;
  if (classification === "BUILD_INFRA_FAILURE" && state.infra_retries >= SUPERVISOR_LIMITS.maxBuildInfraRetries) {
    return true;
  }
  return false;
}

function interventionFor(classification: FailureCategory, state: SupervisorState): string {
  if (classification === "TEST_PROTECTION_VIOLATION") return "protected test repeatedly modified";
  if (classification === "STALE_SPEC" || classification === "TASK_SPEC_MISMATCH" || classification === "TASK_SCOPE_CONFLICT") {
    return state.task_spec_reconcile_attempts >= SUPERVISOR_LIMITS.maxTaskSpecReconcileAttempts
      ? "task/spec cannot be reconciled safely"
      : "task/spec cannot be reconciled safely";
  }
  if (classification === "AUTH_SESSION_FAILURE" || classification === "QA_INFRA_FAILURE") {
    return "QA infrastructure unavailable";
  }
  if (classification === "EVALUATOR_REJECTED") return "evaluator requires strategic decision";
  if (classification === "ORCHESTRATION_FAILURE") return "unknown orchestration failure";
  if (state.cycles_used >= SUPERVISOR_LIMITS.maxTotalCycles) return "recovery exhausted";
  if (classification === "PRODUCT_DEFECT" || classification === "BUILD_INFRA_FAILURE") return "recovery exhausted";
  return "unknown orchestration failure";
}
