import { pathMatches } from "../atlas-agent/guards";
import { formatZodError, taskSchema, type AgentTask } from "../atlas-agent/schema";
import { readJson, writeJson } from "./memory";
import type { BlueprintSpec } from "./spec";
import {
  existingAuthenticatedSpec,
  HUMAN_INTERVENTION_REQUIRED,
  normalizeRepoPath,
  scopeForbiddenOverlap,
  specRequiresCatalogListing,
  staleAcceptanceCriteria,
  TASK_SCOPE_CONFLICT,
} from "./task-paths";

export { HUMAN_INTERVENTION_REQUIRED, TASK_SCOPE_CONFLICT } from "./task-paths";
export {
  existingAuthenticatedSpec,
  normalizeRepoPath,
  scopeForbiddenOverlap,
  specRequiresCatalogListing,
  staleAcceptanceCriteria,
} from "./task-paths";

export type AssignmentError = {
  ok: false;
  code: typeof TASK_SCOPE_CONFLICT | "TASK_SPEC_MISMATCH" | "STALE_ACCEPTANCE_CRITERIA";
  reason: string;
};

export type AssignmentOk = {
  ok: true;
  spec: BlueprintSpec;
  task: AgentTask;
  specPath: string;
  taskPath: string;
};

export function withProtectedAuthTest(task: AgentTask, candidateId: string): AgentTask {
  const auth = existingAuthenticatedSpec(candidateId);
  if (!auth) return task;
  const protectedFiles = [...new Set([...(task.protected_files ?? []), auth])];
  return { ...task, protected_files: protectedFiles };
}

export function taskAgreesWithSpec(
  spec: Pick<BlueprintSpec, "allowed_paths" | "acceptance_criteria" | "qa_checks">,
  task: AgentTask,
): string[] {
  const problems: string[] = [];
  for (const allowed of spec.allowed_paths ?? []) {
    const inScope =
      pathMatches(normalizeRepoPath(allowed), task.scope) ||
      task.scope.some((item) => normalizeRepoPath(item) === normalizeRepoPath(allowed));
    if (!inScope) problems.push(`Spec allowed path ${allowed} is missing from the task scope.`);
    if (scopeForbiddenOverlap([allowed], task.forbidden_changes).length > 0) {
      problems.push(`Spec allowed path ${allowed} is also forbidden.`);
    }
  }
  for (const criterion of spec.acceptance_criteria) {
    if (!task.acceptance_criteria.includes(criterion)) {
      problems.push("Task acceptance criteria are missing a current Spec requirement.");
      break;
    }
  }
  if (spec.qa_checks.some((check) => check.requires_auth) && !task.requires_authenticated_qa) {
    problems.push("The Spec requires authenticated QA, but the task does not.");
  }
  return problems;
}

export function validateBuilderAssignment(input: {
  spec: BlueprintSpec;
  task: AgentTask;
}): AssignmentError | { ok: true } {
  const overlap = scopeForbiddenOverlap(input.task.scope, input.task.forbidden_changes);
  if (overlap.length > 0) {
    return {
      ok: false,
      code: TASK_SCOPE_CONFLICT,
      reason: `${TASK_SCOPE_CONFLICT}. These paths are in both scope and forbidden_changes: ${overlap.join(", ")}. Builder was not invoked.`,
    };
  }
  const auth = existingAuthenticatedSpec(input.spec.id);
  if (auth && !(input.task.protected_files ?? []).some((item) => normalizeRepoPath(item) === normalizeRepoPath(auth))) {
    return {
      ok: false,
      code: TASK_SCOPE_CONFLICT,
      reason: `${TASK_SCOPE_CONFLICT}. Protected file ${auth} is writable. Add it to protected_files instead of forbidding the whole E2E directory.`,
    };
  }
  if (specRequiresCatalogListing(input.spec)) {
    const stale = staleAcceptanceCriteria(input.task.acceptance_criteria);
    if (stale.length > 0) {
      return {
        ok: false,
        code: "STALE_ACCEPTANCE_CRITERIA",
        reason: `${TASK_SCOPE_CONFLICT}. Retry assignment reintroduced stale isolation criteria. Current Spec/Task are the source of truth.`,
      };
    }
  }
  const agreement = taskAgreesWithSpec(input.spec, input.task);
  if (agreement.length > 0) {
    return {
      ok: false,
      code: "TASK_SPEC_MISMATCH",
      reason: `${TASK_SCOPE_CONFLICT}. Current task does not agree with the current Spec: ${agreement[0]}`,
    };
  }
  return { ok: true };
}

export function loadCurrentBuilderAssignment(input: {
  specPath: string;
  taskPath: string;
}): AssignmentOk | AssignmentError {
  const spec = readJson<BlueprintSpec>(input.specPath);
  const rawTask = readJson<unknown>(input.taskPath);
  if (!spec || spec.schema_version !== "atlas-blueprint-spec-v1") {
    return {
      ok: false,
      code: "TASK_SPEC_MISMATCH",
      reason: `${TASK_SCOPE_CONFLICT}. Current Spec was not found at ${input.specPath}.`,
    };
  }
  const parsed = taskSchema.safeParse(rawTask);
  if (!parsed.success) {
    return {
      ok: false,
      code: "TASK_SPEC_MISMATCH",
      reason: `${TASK_SCOPE_CONFLICT}. Current task is invalid:\n${formatZodError(parsed.error)}`,
    };
  }
  const task = withProtectedAuthTest(parsed.data, spec.id);
  const validated = validateBuilderAssignment({ spec, task });
  if (!validated.ok) return validated;
  if (JSON.stringify(task.protected_files ?? []) !== JSON.stringify(parsed.data.protected_files ?? [])) {
    writeJson(input.taskPath, task);
  }
  return {
    ok: true,
    spec,
    task,
    specPath: input.specPath,
    taskPath: input.taskPath,
  };
}

export function retryAssignmentFromCurrentFiles(source: {
  spec_path: string | null;
  task_path: string | null;
}): AssignmentOk | AssignmentError {
  if (!source.spec_path || !source.task_path) {
    return {
      ok: false,
      code: "TASK_SPEC_MISMATCH",
      reason: `${TASK_SCOPE_CONFLICT}. Parent run has no Spec/Task paths. Current Spec/Task files are the source of truth.`,
    };
  }
  return loadCurrentBuilderAssignment({ specPath: source.spec_path, taskPath: source.task_path });
}

export function shouldOpenFinalReview(data: {
  disposition: string;
  build: string;
  qa: { status: string };
  evaluator: { status: string; decision: string | null };
}): boolean {
  return (
    data.build === "pass" &&
    data.qa.status === "pass" &&
    data.evaluator.status !== "not_run" &&
    (data.evaluator.decision === "PASS" || data.evaluator.decision === "PASS_WITH_RECOMMENDATIONS")
  );
}

export function interventionReason(data: { criticalIssues: string[]; disposition: string }): string {
  const issue = data.criticalIssues[0] ?? data.disposition;
  return `${HUMAN_INTERVENTION_REQUIRED}. ${issue} This is not a product/price final review. Build/QA/Evaluator did not all complete successfully.`;
}
