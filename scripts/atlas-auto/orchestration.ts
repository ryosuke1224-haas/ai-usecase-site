import { adoptTrustedAuthSession, blockUnexpectedSecretChanges } from "../atlas-agent/secret-guard";
import {
  TRUSTED_AUTH_SESSION_FILE,
  type Baseline,
  type WorkspaceIo,
} from "../atlas-agent/workspace";
import {
  HUMAN_REVIEW_REQUIRED,
  decideSupervisor,
  emptySupervisorState,
  humanFacingDisposition,
  type SupervisorDecision,
  type SupervisorSnapshot,
  type SupervisorState,
} from "./supervisor";
import { HUMAN_INTERVENTION_REQUIRED } from "./task-paths";
import {
  existingAuthenticatedSpec,
  readAssignmentFiles,
  shouldOpenFinalReview,
  validateBuilderAssignment,
} from "./task-assignment";
import { scopeForbiddenOverlap } from "./task-paths";

export const SECURITY_SPEC_PATH = "agent-specs/security-readiness-action-pack.json";
export const SECURITY_TASK_PATH = "agent-tasks/security-readiness-action-pack-premium-build.json";

export type OrchestrationSummary = {
  owner: SupervisorDecision["classification"];
  action: SupervisorDecision["action"];
  invokeBuilder: boolean;
  invokeQa: boolean;
  recovers: boolean;
  humanReview: boolean;
  humanIntervention: boolean;
  recommendation: SupervisorDecision["recommendation"];
  phase: "AWAITING_FINAL_REVIEW" | "HUMAN_INTERVENTION_REQUIRED" | "RECOVERING";
};

export function summarizeOrchestration(
  snapshot: SupervisorSnapshot,
  state: SupervisorState = emptySupervisorState(),
): OrchestrationSummary {
  const decision = decideSupervisor(snapshot, state);
  const human = humanFacingDisposition(decision.recommendation);
  return {
    owner: decision.classification,
    action: decision.action,
    invokeBuilder: decision.invokeBuilder,
    invokeQa: decision.action === "PREPARE_AUTH_SESSION" || decision.action === "RERUN_QA",
    recovers: decision.recommendation === "NEEDS_INTERNAL_RECOVERY",
    humanReview: human === HUMAN_REVIEW_REQUIRED,
    humanIntervention: human === HUMAN_INTERVENTION_REQUIRED,
    recommendation: decision.recommendation,
    phase:
      decision.ready
        ? "AWAITING_FINAL_REVIEW"
        : human === HUMAN_INTERVENTION_REQUIRED
          ? "HUMAN_INTERVENTION_REQUIRED"
          : "RECOVERING",
  };
}

export function memorySecretIo(initial: Record<string, string>): WorkspaceIo & { store: Map<string, Buffer | null> } {
  const store = new Map<string, Buffer | null>(
    Object.entries(initial).map(([key, value]) => [key, Buffer.from(value)]),
  );
  return {
    store,
    readBytes(file) {
      return store.has(file) ? store.get(file)! : null;
    },
    writeBytes(file, bytes) {
      store.set(file, bytes);
    },
  };
}

export function emptyBaseline(secrets: Record<string, string> = {}): Baseline {
  return {
    head: "audit",
    branch: "private-preview",
    files: new Map(),
    secrets: new Map(Object.entries(secrets).map(([key, value]) => [key, Buffer.from(value)])),
  };
}

export function trustedSessionRefreshContinues(io?: WorkspaceIo): boolean {
  const session = TRUSTED_AUTH_SESSION_FILE;
  const used = io ?? memorySecretIo({ [session]: "before" });
  used.writeBytes(session, Buffer.from("after-refresh"));
  const adopted = adoptTrustedAuthSession(
    emptyBaseline({ [session]: "before" }),
    { status: "ready", path: session, refreshed: true },
    used,
  );
  if (adopted.status !== "continue") return false;
  return !blockUnexpectedSecretChanges(adopted.baseline, used).blocked;
}

export type SecurityRetryDryRun = {
  ok: boolean;
  specPath: string;
  taskPath: string;
  specLoaded: boolean;
  taskLoaded: boolean;
  staleParentRules: boolean;
  scopeForbiddenConflict: string[];
  protectedAuthReadOnly: boolean;
  publicTestEditable: boolean;
  authPreparationTrusted: boolean;
  sessionRefreshTripsSecretGuard: boolean;
  incompleteOpensFinalReview: boolean;
  reasons: string[];
};

export function dryRunSecurityRetryAssignment(): SecurityRetryDryRun {
  const reasons: string[] = [];
  const loaded = readAssignmentFiles({
    specPath: SECURITY_SPEC_PATH,
    taskPath: SECURITY_TASK_PATH,
  });
  if (!("spec" in loaded)) {
    return {
      ok: false,
      specPath: SECURITY_SPEC_PATH,
      taskPath: SECURITY_TASK_PATH,
      specLoaded: false,
      taskLoaded: false,
      staleParentRules: true,
      scopeForbiddenConflict: [],
      protectedAuthReadOnly: false,
      publicTestEditable: false,
      authPreparationTrusted: trustedSessionRefreshContinues(),
      sessionRefreshTripsSecretGuard: !trustedSessionRefreshContinues(),
      incompleteOpensFinalReview: shouldOpenFinalReview({
        disposition: "HUMAN_REVIEW_REQUIRED",
        build: "not_run",
        qa: { status: "not_run" },
        evaluator: { status: "not_run", decision: null },
      }),
      reasons: [loaded.reason],
    };
  }
  const validated = validateBuilderAssignment(loaded);
  const overlap = scopeForbiddenOverlap(loaded.task.scope, loaded.task.forbidden_changes);
  const auth = existingAuthenticatedSpec(loaded.spec.id);
  const protectedAuthReadOnly = Boolean(
    auth && (loaded.task.protected_files ?? []).includes(auth) && loaded.task.permits_qa_changes === false,
  );
  const publicTestEditable = loaded.task.scope.includes(`e2e/${loaded.spec.id}/public.spec.ts`);
  const refreshOk = trustedSessionRefreshContinues();
  const incompleteOpensFinalReview = shouldOpenFinalReview({
    disposition: "HUMAN_REVIEW_REQUIRED",
    build: "pass",
    qa: { status: "not_run" },
    evaluator: { status: "not_run", decision: null },
    supervisor: { recommendation: "NEEDS_INTERNAL_RECOVERY" },
    requiresAuthenticatedQa: loaded.task.requires_authenticated_qa,
  });
  if (!validated.ok) reasons.push(validated.reason);
  if (overlap.length > 0) reasons.push(`scope/forbidden overlap: ${overlap.join(", ")}`);
  if (!protectedAuthReadOnly) reasons.push("authenticated.spec.ts is not read-only.");
  if (!publicTestEditable) reasons.push("public.spec.ts is not in scope.");
  if (!refreshOk) reasons.push("trusted session refresh still trips the secret guard.");
  if (incompleteOpensFinalReview) reasons.push("incomplete results can open final review.");
  if (!loaded.task.requires_authenticated_qa) reasons.push("authenticated QA is not required.");
  return {
    ok: reasons.length === 0,
    specPath: loaded.specPath,
    taskPath: loaded.taskPath,
    specLoaded: true,
    taskLoaded: true,
    staleParentRules: false,
    scopeForbiddenConflict: overlap,
    protectedAuthReadOnly,
    publicTestEditable,
    authPreparationTrusted: refreshOk,
    sessionRefreshTripsSecretGuard: !refreshOk,
    incompleteOpensFinalReview,
    reasons,
  };
}
