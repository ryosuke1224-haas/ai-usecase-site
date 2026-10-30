import { formatZodError, taskSchema, type AgentTask } from "../atlas-agent/schema";
import { pathMatches } from "../atlas-agent/guards";
import type { BlueprintSpec } from "./spec";
import {
  applyPlannedAction,
  completeRecovery,
  decideSupervisor,
  mergeSnapshot,
  type RecoveryAction,
  type SupervisorDecision,
  type SupervisorSnapshot,
  type SupervisorState,
} from "./supervisor";
import {
  existingAuthenticatedSpec,
  normalizeRepoPath,
  scopeForbiddenOverlap,
  specRequiresCatalogListing,
  staleAcceptanceCriteria,
} from "./task-paths";
import { validateBuilderAssignment, withProtectedAuthTest } from "./task-assignment";

export type RecoveryContext = {
  snapshot: SupervisorSnapshot;
  spec: BlueprintSpec;
  task: AgentTask;
  specPath: string;
  taskPath: string;
};

export type RecoveryDeps = {
  now: () => string;
  prepareAuthSession: () => Promise<{ status: "ready" | "AUTH_SESSION_REFRESH_REQUIRED"; reason?: string }>;
  rerunQa: (ctx: RecoveryContext) => Promise<Partial<SupervisorSnapshot>>;
  rerunBuilder: (
    ctx: RecoveryContext,
  ) => Promise<Partial<SupervisorSnapshot> & { loopResultPath?: string | null }>;
  writeAssignment: (spec: BlueprintSpec, task: AgentTask, specPath: string, taskPath: string) => void;
};

export type RecoveryExecution = {
  snapshot: SupervisorSnapshot;
  spec: BlueprintSpec;
  task: AgentTask;
  loopResultPath?: string | null;
  detail: string;
  recovered: boolean;
  builderInvoked: boolean;
};

export function repairTaskForConflict(spec: BlueprintSpec, task: AgentTask): AgentTask {
  const protectedTask = withProtectedAuthTest(task, spec.id);
  let scope = [...protectedTask.scope];
  for (const allowed of spec.allowed_paths ?? []) {
    const inScope =
      pathMatches(normalizeRepoPath(allowed), scope) ||
      scope.some((item) => normalizeRepoPath(item) === normalizeRepoPath(allowed));
    if (!inScope) scope.push(allowed);
  }
  const forbidden_changes = protectedTask.forbidden_changes.filter(
    (item) => scopeForbiddenOverlap(scope, [item]).length === 0,
  );
  let acceptance_criteria = specRequiresCatalogListing(spec)
    ? protectedTask.acceptance_criteria.filter((item) => staleAcceptanceCriteria([item]).length === 0)
    : [...protectedTask.acceptance_criteria];
  for (const criterion of spec.acceptance_criteria) {
    if (staleAcceptanceCriteria([criterion]).length > 0) continue;
    if (!acceptance_criteria.includes(criterion)) acceptance_criteria.push(criterion);
  }
  const auth = existingAuthenticatedSpec(spec.id);
  const raw = {
    ...protectedTask,
    scope,
    forbidden_changes,
    acceptance_criteria,
    protected_files: auth
      ? [...new Set([...(protectedTask.protected_files ?? []), auth])]
      : protectedTask.protected_files,
    permits_qa_changes: auth ? false : protectedTask.permits_qa_changes,
    requires_authenticated_qa: spec.qa_checks.some((check) => check.requires_auth)
      ? true
      : protectedTask.requires_authenticated_qa,
  };
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Task repair produced an invalid assignment:\n${formatZodError(parsed.error)}`);
  return parsed.data;
}

export function reconcileSpecAndTask(
  spec: BlueprintSpec,
  task: AgentTask,
): { spec: BlueprintSpec; task: AgentTask } {
  const acceptance_criteria = specRequiresCatalogListing(spec)
    ? spec.acceptance_criteria.filter((item) => staleAcceptanceCriteria([item]).length === 0)
    : spec.acceptance_criteria;
  const nextSpec = { ...spec, acceptance_criteria };
  return { spec: nextSpec, task: repairTaskForConflict(nextSpec, task) };
}

export function restoreProtectedTestAssignment(spec: BlueprintSpec, task: AgentTask): AgentTask {
  const auth = existingAuthenticatedSpec(spec.id);
  const next = withProtectedAuthTest(task, spec.id);
  return {
    ...next,
    permits_qa_changes: auth ? false : next.permits_qa_changes,
  };
}

export async function executeRecovery(
  decision: SupervisorDecision,
  ctx: RecoveryContext,
  deps: RecoveryDeps,
): Promise<RecoveryExecution> {
  switch (decision.action) {
    case "PREPARE_AUTH_SESSION":
      return prepareAuthThenQa(ctx, deps);
    case "RERUN_QA":
      return rerunQaOnly(ctx, deps);
    case "RESTORE_PROTECTED_TEST":
      return restoreThenBuilder(ctx, deps);
    case "RERUN_BUILDER":
      return rerunBuilderOnly(ctx, deps);
    case "REPAIR_TASK":
      return repairAssignment(ctx, deps, "repair");
    case "RECONCILE_SPEC_TASK":
      return repairAssignment(ctx, deps, "reconcile");
    default:
      return {
        snapshot: ctx.snapshot,
        spec: ctx.spec,
        task: ctx.task,
        detail: "No safe recovery action.",
        recovered: false,
        builderInvoked: false,
      };
  }
}

export async function runRecoveryLoop(input: {
  snapshot: SupervisorSnapshot;
  state: SupervisorState;
  spec: BlueprintSpec;
  task: AgentTask;
  specPath: string;
  taskPath: string;
  deps: RecoveryDeps;
}): Promise<{
  snapshot: SupervisorSnapshot;
  state: SupervisorState;
  spec: BlueprintSpec;
  task: AgentTask;
  decision: SupervisorDecision;
  loopResultPath?: string | null;
}> {
  let { snapshot, state, spec, task } = input;
  let loopResultPath: string | null | undefined;
  for (;;) {
    const decision = decideSupervisor(snapshot, state);
    state = applyPlannedAction(state, decision, input.deps.now());
    if (decision.recommendation !== "NEEDS_INTERNAL_RECOVERY") {
      return { snapshot, state, spec, task, decision, loopResultPath };
    }
    const executed = await executeRecovery(decision, {
      snapshot,
      spec,
      task,
      specPath: input.specPath,
      taskPath: input.taskPath,
    }, input.deps);
    snapshot = executed.snapshot;
    spec = executed.spec;
    task = executed.task;
    if (executed.loopResultPath) loopResultPath = executed.loopResultPath;
    state = completeRecovery(state, executed.recovered ? "recovered" : "failed", executed.detail);
  }
}

async function prepareAuthThenQa(ctx: RecoveryContext, deps: RecoveryDeps): Promise<RecoveryExecution> {
  const prepared = await deps.prepareAuthSession();
  if (prepared.status !== "ready") {
    return {
      snapshot: mergeSnapshot(ctx.snapshot, {
        issues: [
          {
            issue_id: "AUTH_SESSION_REFRESH_REQUIRED",
            test: "authenticated QA",
            actual: prepared.reason ?? "AUTH_SESSION_REFRESH_REQUIRED",
            classification: "AUTH_SESSION_REFRESH_REQUIRED",
          },
        ],
      }),
      spec: ctx.spec,
      task: ctx.task,
      detail: prepared.reason ?? "AUTH_SESSION_REFRESH_REQUIRED",
      recovered: false,
      builderInvoked: false,
    };
  }
  const qa = await deps.rerunQa(ctx);
  return {
    snapshot: mergeSnapshot(ctx.snapshot, { ...qa, issues: qa.issues ?? [] }),
    spec: ctx.spec,
    task: ctx.task,
    detail: "Prepared authenticated session and reran QA. Builder was not invoked.",
    recovered: qa.qa?.status === "pass",
    builderInvoked: false,
  };
}

async function rerunQaOnly(ctx: RecoveryContext, deps: RecoveryDeps): Promise<RecoveryExecution> {
  const qa = await deps.rerunQa(ctx);
  return {
    snapshot: mergeSnapshot(ctx.snapshot, qa),
    spec: ctx.spec,
    task: ctx.task,
    detail: "Reran QA without invoking Builder.",
    recovered: qa.qa?.status === "pass",
    builderInvoked: false,
  };
}

async function restoreThenBuilder(ctx: RecoveryContext, deps: RecoveryDeps): Promise<RecoveryExecution> {
  const task = restoreProtectedTestAssignment(ctx.spec, ctx.task);
  deps.writeAssignment(ctx.spec, task, ctx.specPath, ctx.taskPath);
  const built = await deps.rerunBuilder({ ...ctx, task });
  return {
    snapshot: mergeSnapshot(ctx.snapshot, built),
    spec: ctx.spec,
    task,
    loopResultPath: built.loopResultPath,
    detail: "Restored the protected test as read-only and reran Builder. The test was not rewritten.",
    recovered: built.qa?.status === "pass" && built.build === "pass",
    builderInvoked: true,
  };
}

async function rerunBuilderOnly(ctx: RecoveryContext, deps: RecoveryDeps): Promise<RecoveryExecution> {
  const built = await deps.rerunBuilder(ctx);
  return {
    snapshot: mergeSnapshot(ctx.snapshot, built),
    spec: ctx.spec,
    task: ctx.task,
    loopResultPath: built.loopResultPath,
    detail: "Sent the failure packet to Builder and reran build + QA.",
    recovered: built.qa?.status === "pass" && built.build === "pass",
    builderInvoked: true,
  };
}

function repairAssignment(
  ctx: RecoveryContext,
  deps: RecoveryDeps,
  kind: "repair" | "reconcile",
): RecoveryExecution {
  const next =
    kind === "reconcile" ? reconcileSpecAndTask(ctx.spec, ctx.task) : { spec: ctx.spec, task: repairTaskForConflict(ctx.spec, ctx.task) };
  deps.writeAssignment(next.spec, next.task, ctx.specPath, ctx.taskPath);
  const assignment = validateBuilderAssignment(next);
  return {
    snapshot: mergeSnapshot(ctx.snapshot, {
      assignment,
      spec: next.spec,
      task: next.task,
    }),
    spec: next.spec,
    task: next.task,
    detail:
      kind === "reconcile"
        ? "Reconciled Spec/Task from the current approved product state. Builder was not invoked while the conflict remained."
        : "Repaired task scope/forbidden overlap. Builder was not invoked while the conflict remained.",
    recovered: assignment.ok,
    builderInvoked: false,
  };
}

export function actionInvokesBuilder(action: RecoveryAction): boolean {
  return action === "RERUN_BUILDER" || action === "RESTORE_PROTECTED_TEST";
}
