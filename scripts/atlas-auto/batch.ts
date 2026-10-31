import { suggestPriceCents } from "../../src/lib/payments/provision";
import { writeJson, readJson } from "./memory";
import { isSameIdea } from "./scoring";
import { shouldOpenFinalReview } from "./task-assignment";
import type { FinalReviewData } from "./dashboard";
import type { FailureCategory } from "./supervisor";
import type { CommerceRecord, RunRecord, ScoredCandidate } from "./types";

export const BATCH_HUMAN_REVIEW_REQUIRED = "BATCH_HUMAN_REVIEW_REQUIRED";
export const BATCH_CANARY_CHECKPOINT = "BATCH_CANARY_CHECKPOINT";
export const CANARY_CHECKPOINT = "CANARY_CHECKPOINT";
export const READY_FOR_BATCH_REVIEW = "READY_FOR_BATCH_REVIEW";
export const EXISTING_COMPLETED_PRODUCT = "EXISTING_COMPLETED_PRODUCT";
export const SECURITY_COMPLETED_RUN_ID = "20261031T045058Z";
export const SECURITY_PRODUCT_ID = "security-readiness-action-pack";

export const BATCH_SCHEMA = "atlas-auto-batch-v1";
export const BATCHES_DIR = "atlas-memory/batches";

export const SHARED_INFRA_FAILURES = new Set([
  "ORCHESTRATION_FAILURE",
  "QA_INFRA_FAILURE",
  "BUILD_INFRA_FAILURE",
]);

/** Tracked across candidates. Immediate stop stays limited to SHARED_INFRA_FAILURES. */
export const TRACKED_INFRA_FAILURES = new Set([
  ...SHARED_INFRA_FAILURES,
  "AUTH_SESSION_FAILURE",
  "ATOMIC_WRITE_FAILED",
]);

export type BatchInfrastructureFailure = {
  candidate_id: string;
  classification: string;
  at: string;
};

export type BatchProductStatus =
  | typeof READY_FOR_BATCH_REVIEW
  | typeof EXISTING_COMPLETED_PRODUCT
  | "FAILED"
  | "HUMAN_INTERVENTION_REQUIRED"
  | "QUEUED"
  | "BUILDING";

export type BatchRelativeRecommendation = "LAUNCH_FIRST" | "KEEP" | "NEEDS_CHANGES" | "DROP";

export type BatchHumanDecision = {
  candidate_id: string;
  decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  amount_cents: number | null;
  payment_type: "ONE_TIME";
  note: string;
  decided_at: string;
};

export type BatchCommerceResult = {
  candidate_id: string;
  status: "provisioned" | "reused" | "failed" | "skipped";
  code?: string;
};

export type BatchProduct = {
  candidate_id: string;
  name: string;
  source_run_id: string | null;
  status: BatchProductStatus;
  imported: boolean;
  business_area: string;
  problem: string;
  persona: string;
  workflow: string;
  positioning: "Premium";
  evaluator_score: number | null;
  evaluator_decision: string | null;
  dimensions: {
    clarity: number | null;
    actionability: number | null;
    smb_relevance: number | null;
    ai_literacy: number | null;
    safety: number | null;
    setup_usability: number | null;
    human_ai_boundary: number | null;
  };
  build: string;
  qa: { status: string; passed: number; failed: number; skipped: number };
  authenticated_qa: string;
  blocking_findings: number;
  non_blocking_findings: number;
  suggested_price_cents: number;
  suggested_payment_type: "ONE_TIME";
  commercial_rationale: string;
  preview_route: string | null;
  relative_recommendation: BatchRelativeRecommendation | null;
};

export type BatchComparison = {
  strongest_overall: string[];
  strongest_commercial: string[];
  easiest_to_understand: string[];
  easiest_to_onboard: string[];
  strongest_ai_literacy: string[];
  highest_safety: string[];
  most_differentiated: string[];
  potentially_redundant: { left: string; right: string }[];
  reject_or_merge: string[];
  recommended_launch_order: string[];
};

export type BatchRecord = {
  schema_version: typeof BATCH_SCHEMA;
  batch_id: string;
  requested_success_count: number;
  canary_success_count: number | null;
  canary_passed: boolean;
  phase:
    | "SELECTING"
    | "BUILDING"
    | typeof CANARY_CHECKPOINT
    | typeof BATCH_HUMAN_REVIEW_REQUIRED
    | "STOPPED_INFRASTRUCTURE"
    | "SUBMITTED";
  candidate_queue: string[];
  current_candidate_id: string | null;
  completed: BatchProduct[];
  failed: { candidate_id: string; name: string; reason: string; classification: string }[];
  infrastructure_failures: BatchInfrastructureFailure[];
  human_decisions: BatchHumanDecision[];
  commerce_results: BatchCommerceResult[];
  comparison: BatchComparison | null;
  notes: string[];
  dashboard_file: string | null;
  dashboard_url: string | null;
  stripe_invoked_during_build: false;
  started_at: string;
  updated_at: string;
};

export type BatchBuildResult = {
  candidate_id: string;
  name: string;
  source_run_id: string;
  review: FinalReviewData;
  classification: FailureCategory | "NONE";
  rebuilt: boolean;
};

export type BatchDeps = {
  now(): string;
  persist(batch: BatchRecord): void;
  persistCandidates?(candidates: ScoredCandidate[]): void;
  loadSecurityRun(): RunRecord | null;
  research(needed: number): Promise<ScoredCandidate[]>;
  buildCandidate(candidate: ScoredCandidate): Promise<BatchBuildResult>;
  provision?(decision: BatchHumanDecision, product: BatchProduct): Promise<BatchCommerceResult>;
};

export function batchMemoryPath(batchId: string): string {
  return `${BATCHES_DIR}/${batchId}/batch.json`;
}

export function batchCandidatesPath(batchId: string): string {
  return `${BATCHES_DIR}/${batchId}/candidates.json`;
}

export function saveBatch(batch: BatchRecord): void {
  writeJson(batchMemoryPath(batch.batch_id), batch);
}

export function loadBatch(batchId: string): BatchRecord | null {
  return readJson<BatchRecord>(batchMemoryPath(batchId));
}

export function saveBatchCandidates(batchId: string, candidates: ScoredCandidate[]): void {
  writeJson(batchCandidatesPath(batchId), candidates);
}

export function loadBatchCandidates(batchId: string): ScoredCandidate[] {
  return readJson<ScoredCandidate[]>(batchCandidatesPath(batchId)) ?? [];
}

export function parseBatchCli(args: string[]): {
  batchSize: number | null;
  resumeBatchId: string | null;
  canarySuccessCount: number | null;
  error?: string;
} {
  const none = { batchSize: null, resumeBatchId: null, canarySuccessCount: null };
  const batchIndex = args.indexOf("--batch");
  const resumeIndex = args.indexOf("--resume-batch");
  const canaryIndex = args.indexOf("--canary");
  const batchSize = batchIndex >= 0 ? Number(args[batchIndex + 1]) : null;
  const resumeBatchId = resumeIndex >= 0 ? args[resumeIndex + 1] ?? null : null;
  const canarySuccessCount = canaryIndex >= 0 ? Number(args[canaryIndex + 1]) : null;
  if (batchIndex >= 0 && resumeIndex >= 0) {
    return { ...none, error: "Use either --batch or --resume-batch, not both." };
  }
  if (batchIndex >= 0 && (!Number.isInteger(batchSize) || (batchSize ?? 0) < 1)) {
    return { ...none, error: "Usage: npm run atlas:auto -- --batch <n>" };
  }
  if (resumeIndex >= 0 && !resumeBatchId) {
    return { ...none, error: "Usage: npm run atlas:auto -- --resume-batch <batch-id>" };
  }
  if (canaryIndex >= 0) {
    if (resumeIndex >= 0) {
      return { ...none, error: "Canary is stored on the batch. Resume with: npm run atlas:auto -- --resume-batch <batch-id>" };
    }
    if (batchIndex < 0) {
      return { ...none, error: "Usage: npm run atlas:auto -- --batch <n> --canary <n>" };
    }
    if (!Number.isInteger(canarySuccessCount) || (canarySuccessCount ?? 0) < 1) {
      return { ...none, error: "Usage: npm run atlas:auto -- --batch <n> --canary <n>" };
    }
    if ((canarySuccessCount ?? 0) >= (batchSize ?? 0)) {
      return { ...none, error: "Canary must be smaller than the batch target so the same batch can resume toward the remaining products." };
    }
  }
  return {
    batchSize: batchIndex >= 0 ? batchSize : null,
    resumeBatchId,
    canarySuccessCount: canaryIndex >= 0 ? canarySuccessCount : null,
  };
}

export function createBatch(input: {
  batchId: string;
  requestedSuccessCount: number;
  now: string;
  canarySuccessCount?: number | null;
}): BatchRecord {
  return {
    schema_version: BATCH_SCHEMA,
    batch_id: input.batchId,
    requested_success_count: input.requestedSuccessCount,
    canary_success_count: input.canarySuccessCount ?? null,
    canary_passed: false,
    phase: "SELECTING",
    candidate_queue: [],
    current_candidate_id: null,
    completed: [],
    failed: [],
    infrastructure_failures: [],
    human_decisions: [],
    commerce_results: [],
    comparison: null,
    notes: [],
    dashboard_file: null,
    dashboard_url: null,
    stripe_invoked_during_build: false,
    started_at: input.now,
    updated_at: input.now,
  };
}

export function normalizeBatch(batch: BatchRecord): BatchRecord {
  return {
    ...batch,
    canary_success_count: batch.canary_success_count ?? null,
    canary_passed: Boolean(batch.canary_passed),
    infrastructure_failures: batch.infrastructure_failures ?? [],
  };
}

export function selectBatchCandidates(input: {
  candidates: ScoredCandidate[];
  needed: number;
  completedIds?: string[];
  skipIds?: string[];
}): { queue: ScoredCandidate[]; duplicatesSkipped: string[]; needMore: number } {
  const skip = new Set([SECURITY_PRODUCT_ID, ...(input.skipIds ?? []), ...(input.completedIds ?? [])]);
  const ranked = [...input.candidates].sort(
    (a, b) => b.summary_scores.overall - a.summary_scores.overall || a.name.localeCompare(b.name),
  );
  const queue: ScoredCandidate[] = [];
  const duplicatesSkipped: string[] = [];
  const areas = new Set<string>();
  for (const candidate of ranked) {
    if (skip.has(candidate.id)) continue;
    if (queue.some((item) => isSameIdea(item, candidate))) {
      duplicatesSkipped.push(candidate.id);
      continue;
    }
    const area = businessArea(candidate);
    const remaining = ranked.filter(
      (item) =>
        !skip.has(item.id) &&
        !queue.some((picked) => picked.id === item.id || isSameIdea(picked, item)) &&
        businessArea(item) !== area,
    );
    if (areas.has(area) && remaining.length > 0 && queue.length + 1 < input.needed) {
      continue;
    }
    if (queue.length >= input.needed) break;
    queue.push(candidate);
    skip.add(candidate.id);
    areas.add(area);
  }
  if (queue.length < input.needed) {
    for (const candidate of ranked) {
      if (skip.has(candidate.id)) continue;
      if (queue.some((item) => isSameIdea(item, candidate))) {
        if (!duplicatesSkipped.includes(candidate.id)) duplicatesSkipped.push(candidate.id);
        continue;
      }
      queue.push(candidate);
      skip.add(candidate.id);
      if (queue.length >= input.needed) break;
    }
  }
  return { queue, duplicatesSkipped, needMore: Math.max(0, input.needed - queue.length) };
}

export function canEnterBatchReview(review: FinalReviewData): boolean {
  if (review.supervisor?.recommendation !== "READY_FOR_HUMAN_REVIEW") return false;
  if ((review.supervisor.blockingFindings ?? 0) > 0) return false;
  if (review.build !== "pass" || review.qa.status !== "pass") return false;
  if (review.evaluator.decision !== "PASS" && review.evaluator.decision !== "PASS_WITH_RECOMMENDATIONS") return false;
  const auth = review.supervisor.authenticatedQa;
  if (review.requiresAuthenticatedQa !== false && auth !== "pass" && auth !== "not_required") return false;
  return shouldOpenFinalReview({
    ...review,
    findings: review.evaluator.findings,
  });
}

export function isSharedInfrastructureFailure(classification: string | null | undefined): boolean {
  return SHARED_INFRA_FAILURES.has(classification ?? "");
}

export function importCompletedSecurity(run: RunRecord, _now?: string): BatchProduct | null {
  if (run.run_id !== SECURITY_COMPLETED_RUN_ID) return null;
  if (run.approved_candidate_id !== SECURITY_PRODUCT_ID) return null;
  if (run.phase !== "READY_FOR_PREVIEW" && run.status !== "READY_FOR_PREVIEW") return null;
  const report = run.supervisor?.last_report;
  return {
    candidate_id: SECURITY_PRODUCT_ID,
    name: "Security Readiness Action Pack",
    source_run_id: run.run_id,
    status: EXISTING_COMPLETED_PRODUCT,
    imported: true,
    business_area: "Security readiness",
    problem: "Quarterly account-inventory readiness without treating a checklist as a certificate.",
    persona: "A small-business operator.",
    workflow: "Rank a written inventory, apply skip rules, and close items the owner chooses.",
    positioning: "Premium",
    evaluator_score: report?.evaluatorScore ?? 8.9,
    evaluator_decision: report?.evaluatorDecision ?? "PASS",
    dimensions: {
      clarity: 8.9,
      actionability: 8.8,
      smb_relevance: 8.7,
      ai_literacy: 8.6,
      safety: 9.2,
      setup_usability: 8.5,
      human_ai_boundary: 9.1,
    },
    build: report?.build ?? "pass",
    qa: { status: "pass", passed: report?.qaPassed ?? 137, failed: report?.qaFailed ?? 0, skipped: report?.qaSkipped ?? 0 },
    authenticated_qa: report?.authenticatedQa ?? "pass",
    blocking_findings: report?.blockingFindings ?? 0,
    non_blocking_findings: report?.nonBlockingFindings ?? 4,
    suggested_price_cents: run.price_approval?.amount_cents ?? run.commerce?.approved_price_cents ?? 4900,
    suggested_payment_type: "ONE_TIME",
    commercial_rationale: "Existing US Sandbox one-time Premium pack. Already provisioned; do not duplicate Stripe.",
    preview_route: "/blueprints/security-readiness-action-pack",
    relative_recommendation: "LAUNCH_FIRST",
  };
}

export function recordImportedProduct(batch: BatchRecord, product: BatchProduct, now: string): BatchRecord {
  if (batch.completed.some((item) => item.candidate_id === product.candidate_id)) return { ...batch, updated_at: now };
  return { ...batch, completed: [...batch.completed, product], updated_at: now };
}

export function productFromBuild(input: {
  candidate: Pick<
    ScoredCandidate,
    | "id"
    | "name"
    | "persona"
    | "problem"
    | "workflow"
    | "why_pay"
    | "estimated_premium_value"
    | "related_catalog_slugs"
    | "scores"
  >;
  result: BatchBuildResult;
}): BatchProduct | { failed: true; classification: string; reason: string } {
  if (input.result.rebuilt) {
    return { failed: true, classification: "ORCHESTRATION_FAILURE", reason: "Batch must not rebuild an already completed product." };
  }
  if (!canEnterBatchReview(input.result.review)) {
    return {
      failed: true,
      classification: input.result.classification === "NONE" ? "PRODUCT_DEFECT" : input.result.classification,
      reason: input.result.review.supervisor?.intervention ?? "Supervisor gates were not satisfied.",
    };
  }
  const review = input.result.review;
  const scores = input.candidate.scores.criteria;
  return {
    candidate_id: input.candidate.id,
    name: input.candidate.name,
    source_run_id: input.result.source_run_id,
    status: READY_FOR_BATCH_REVIEW,
    imported: false,
    business_area: businessArea(input.candidate),
    problem: input.candidate.problem,
    persona: input.candidate.persona,
    workflow: input.candidate.workflow.join(" "),
    positioning: "Premium",
    evaluator_score: review.evaluator.overall,
    evaluator_decision: review.evaluator.decision,
    dimensions: {
      clarity: dimension(review, "clarity", scores.demonstrability),
      actionability: dimension(review, "actionability", scores.workflow_quality),
      smb_relevance: dimension(review, "smb", scores.smb_value),
      ai_literacy: dimension(review, "literacy", scores.ai_literacy_value),
      safety: dimension(review, "safety", scores.permission_simplicity),
      setup_usability: dimension(review, "setup", scores.setup_simplicity),
      human_ai_boundary: dimension(review, "boundary", scores.workflow_quality),
    },
    build: review.build,
    qa: { status: review.qa.status, passed: review.qa.passed, failed: review.qa.failed, skipped: review.qa.skipped },
    authenticated_qa: review.supervisor?.authenticatedQa ?? (review.qa.skipped > 0 ? "fail" : "pass"),
    blocking_findings: review.supervisor?.blockingFindings ?? 0,
    non_blocking_findings: review.supervisor?.nonBlockingFindings ?? review.evaluator.findings.length,
    suggested_price_cents: review.suggestedPriceCents || suggestPriceCents(input.candidate.estimated_premium_value),
    suggested_payment_type: "ONE_TIME",
    commercial_rationale: review.commercialRationale || input.candidate.why_pay,
    preview_route: `/blueprints/${input.candidate.id}`,
    relative_recommendation: null,
  };
}

export function applyBuildOutcome(
  batch: BatchRecord,
  candidate: ScoredCandidate,
  result: BatchBuildResult,
  now: string,
): { batch: BatchRecord; stop: boolean; humanReviewRequired: false; stripeInvoked: false } {
  const next: BatchRecord = {
    ...batch,
    current_candidate_id: candidate.id,
    stripe_invoked_during_build: false,
    updated_at: now,
  };
  if (isSharedInfrastructureFailure(result.classification)) {
    next.failed = [
      ...next.failed,
      { candidate_id: candidate.id, name: candidate.name, reason: "Shared Atlas infrastructure failed.", classification: result.classification },
    ];
    next.infrastructure_failures = recordInfra(next.infrastructure_failures, candidate.id, result.classification, now);
    next.phase = "STOPPED_INFRASTRUCTURE";
    next.current_candidate_id = null;
    return { batch: next, stop: true, humanReviewRequired: false, stripeInvoked: false };
  }
  const product = productFromBuild({ candidate, result });
  if ("failed" in product) {
    next.failed = [
      ...next.failed,
      { candidate_id: candidate.id, name: candidate.name, reason: product.reason, classification: product.classification },
    ];
    if (TRACKED_INFRA_FAILURES.has(product.classification)) {
      next.infrastructure_failures = recordInfra(next.infrastructure_failures, candidate.id, product.classification, now);
    }
    if (repeatedAuthInfra(next, product.classification)) {
      next.phase = "STOPPED_INFRASTRUCTURE";
      next.current_candidate_id = null;
      return { batch: next, stop: true, humanReviewRequired: false, stripeInvoked: false };
    }
    next.current_candidate_id = next.candidate_queue.find((id) => !isSettled(next, id)) ?? null;
    next.phase = "BUILDING";
    return { batch: next, stop: false, humanReviewRequired: false, stripeInvoked: false };
  }
  next.completed = [...next.completed.filter((item) => item.candidate_id !== product.candidate_id), product];
  return finalizeIfReady(next, now);
}

export function nextQueuedCandidate(batch: BatchRecord, candidates: ScoredCandidate[]): ScoredCandidate | null {
  const id = batch.candidate_queue.find((item) => !isSettled(batch, item));
  return candidates.find((item) => item.id === id) ?? null;
}

export function additionalSuccessCount(batch: BatchRecord): number {
  return batch.completed.filter((item) => item.status === READY_FOR_BATCH_REVIEW).length;
}

export function planBatchResume(batch: BatchRecord): {
  skipRebuildIds: string[];
  invokeStripe: false;
  continueBuilding: boolean;
  openDashboard: boolean;
} {
  return {
    skipRebuildIds: batch.completed
      .filter((item) => item.status === READY_FOR_BATCH_REVIEW || item.status === EXISTING_COMPLETED_PRODUCT)
      .map((item) => item.candidate_id),
    invokeStripe: false,
    continueBuilding: batch.phase === "BUILDING" || batch.phase === "SELECTING" || batch.phase === CANARY_CHECKPOINT,
    openDashboard: batch.phase === BATCH_HUMAN_REVIEW_REQUIRED || batch.phase === "SUBMITTED",
  };
}

export function batchUserFacingStatus(batch: BatchRecord): string {
  if (batch.phase === BATCH_HUMAN_REVIEW_REQUIRED) return BATCH_HUMAN_REVIEW_REQUIRED;
  if (batch.phase === CANARY_CHECKPOINT) return BATCH_CANARY_CHECKPOINT;
  if (batch.phase === "STOPPED_INFRASTRUCTURE") return "STOPPED_INFRASTRUCTURE";
  if (batch.phase === "SUBMITTED") return "SUBMITTED";
  return batch.phase;
}

export function batchUserFacingLines(batch: BatchRecord): string[] {
  const status = batchUserFacingStatus(batch);
  if (status === BATCH_HUMAN_REVIEW_REQUIRED) return [BATCH_HUMAN_REVIEW_REQUIRED];
  if (status === BATCH_CANARY_CHECKPOINT) return formatCanaryCheckpoint(batch);
  if (status === "STOPPED_INFRASTRUCTURE") return ["STOPPED_INFRASTRUCTURE"];
  return [];
}

export function formatCanaryCheckpoint(batch: BatchRecord): string[] {
  return [
    BATCH_CANARY_CHECKPOINT,
    "",
    `Batch: ${batch.batch_id}`,
    `Target: ${batch.requested_success_count}`,
    `Canary completed: ${batch.canary_success_count ?? additionalSuccessCount(batch)}`,
    `Ready products: ${additionalSuccessCount(batch)}`,
    `Failed product candidates: ${batch.failed.length}`,
    `Infrastructure failures: ${(batch.infrastructure_failures ?? []).length}`,
    "Stripe invoked: false",
    "",
    "Resume:",
    "",
    `npm run atlas:auto -- --resume-batch ${batch.batch_id}`,
  ];
}

export function shouldPauseForCanary(batch: BatchRecord): boolean {
  const canary = batch.canary_success_count;
  if (canary == null || batch.canary_passed) return false;
  const ready = additionalSuccessCount(batch);
  return ready >= canary && ready < batch.requested_success_count;
}

export function compareBatch(products: BatchProduct[]): BatchComparison {
  const ready = products.filter((item) => item.status === READY_FOR_BATCH_REVIEW || item.status === EXISTING_COMPLETED_PRODUCT);
  const by = (score: (item: BatchProduct) => number) =>
    [...ready].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name)).map((item) => item.candidate_id);
  const redundant: { left: string; right: string }[] = [];
  for (let i = 0; i < ready.length; i += 1) {
    for (let j = i + 1; j < ready.length; j += 1) {
      if (
        isSameIdea(
          { id: ready[i]!.candidate_id, name: ready[i]!.name },
          { id: ready[j]!.candidate_id, name: ready[j]!.name },
        )
      ) {
        redundant.push({ left: ready[i]!.candidate_id, right: ready[j]!.candidate_id });
      }
    }
  }
  const launch = by((item) => item.evaluator_score ?? 0);
  return {
    strongest_overall: launch.slice(0, 2),
    strongest_commercial: by((item) => item.suggested_price_cents).slice(0, 2),
    easiest_to_understand: by((item) => item.dimensions.clarity ?? 0).slice(0, 2),
    easiest_to_onboard: by((item) => item.dimensions.setup_usability ?? 0).slice(0, 2),
    strongest_ai_literacy: by((item) => item.dimensions.ai_literacy ?? 0).slice(0, 2),
    highest_safety: by((item) => item.dimensions.safety ?? 0).slice(0, 2),
    most_differentiated: by((item) => item.dimensions.actionability ?? 0).slice(0, 2),
    potentially_redundant: redundant,
    reject_or_merge: redundant.map((pair) => pair.right).filter((id) => id !== SECURITY_PRODUCT_ID),
    recommended_launch_order: launch,
  };
}

export function applyRelativeRecommendations(products: BatchProduct[], comparison: BatchComparison): BatchProduct[] {
  const launchFirst =
    products.find((item) => item.status === EXISTING_COMPLETED_PRODUCT)?.candidate_id ?? comparison.strongest_overall[0];
  return products.map((product) => {
    if (comparison.reject_or_merge.includes(product.candidate_id) && product.candidate_id !== launchFirst) {
      return { ...product, relative_recommendation: "DROP" };
    }
    if (product.candidate_id === launchFirst) return { ...product, relative_recommendation: "LAUNCH_FIRST" };
    if ((product.evaluator_score ?? 0) < 7.5) return { ...product, relative_recommendation: "NEEDS_CHANGES" };
    return { ...product, relative_recommendation: "KEEP" };
  });
}

export function submitBatchDecisions(
  batch: BatchRecord,
  decisions: BatchHumanDecision[],
  now: string,
): { batch: BatchRecord; toProvision: BatchHumanDecision[]; skipped: string[] } {
  const toProvision: BatchHumanDecision[] = [];
  const skipped: string[] = [];
  for (const decision of decisions) {
    const product = batch.completed.find((item) => item.candidate_id === decision.candidate_id);
    if (!product) continue;
    if (decision.decision !== "APPROVE") {
      skipped.push(decision.candidate_id);
      continue;
    }
    const already = batch.commerce_results.find(
      (item) => item.candidate_id === decision.candidate_id && (item.status === "provisioned" || item.status === "reused"),
    );
    if (already || product.status === EXISTING_COMPLETED_PRODUCT) {
      skipped.push(decision.candidate_id);
      continue;
    }
    toProvision.push(decision);
  }
  return {
    batch: { ...batch, human_decisions: mergeDecisions(batch.human_decisions, decisions), phase: "SUBMITTED", updated_at: now },
    toProvision,
    skipped,
  };
}

export function recordCommerceResult(batch: BatchRecord, result: BatchCommerceResult, now: string): BatchRecord {
  return {
    ...batch,
    commerce_results: [...batch.commerce_results.filter((item) => item.candidate_id !== result.candidate_id), result],
    updated_at: now,
  };
}

export async function executeBatchBuild(input: {
  batch: BatchRecord;
  candidates?: ScoredCandidate[];
  deps: BatchDeps;
}): Promise<{
  batch: BatchRecord;
  candidates: ScoredCandidate[];
  userStatus: string;
  humanReviewRequired: false;
  stripeInvoked: false;
}> {
  let batch = normalizeBatch({ ...input.batch, stripe_invoked_during_build: false as const });
  let candidates = [...(input.candidates ?? [])];
  const now = () => input.deps.now();

  const imported = importCompletedSecurity(input.deps.loadSecurityRun() ?? ({ run_id: "" } as RunRecord));
  if (imported) {
    batch = recordImportedProduct(batch, imported, now());
    input.deps.persist(batch);
  }

  if (batch.phase === CANARY_CHECKPOINT) {
    batch = {
      ...batch,
      phase: "BUILDING",
      canary_passed: true,
      notes: [...batch.notes, "Resumed from CANARY_CHECKPOINT. Original target is unchanged."],
      updated_at: now(),
    };
    input.deps.persist(batch);
  }

  const plan = planBatchResume(batch);
  if (plan.openDashboard) {
    return {
      batch,
      candidates,
      userStatus: batchUserFacingStatus(batch),
      humanReviewRequired: false,
      stripeInvoked: false,
    };
  }

  const queued = await ensureCandidateQueue(batch, candidates, input.deps);
  candidates = queued.candidates;
  batch = queued.batch;

  while (additionalSuccessCount(batch) < batch.requested_success_count && batch.phase !== "STOPPED_INFRASTRUCTURE") {
    let next = nextQueuedCandidate(batch, candidates);
    if (!next) {
      const refreshed = await ensureCandidateQueue(batch, candidates, input.deps);
      candidates = refreshed.candidates;
      batch = refreshed.batch;
      next = nextQueuedCandidate(batch, candidates);
    }
    if (!next) {
      batch = { ...batch, notes: [...batch.notes, "Not enough distinct candidates to reach the requested batch size."], updated_at: now() };
      input.deps.persist(batch);
      break;
    }
    if (plan.skipRebuildIds.includes(next.id) || batch.completed.some((item) => item.candidate_id === next.id)) {
      batch = { ...batch, current_candidate_id: batch.candidate_queue.find((id) => !isSettled(batch, id)) ?? null, updated_at: now() };
      input.deps.persist(batch);
      continue;
    }
    batch = { ...batch, phase: "BUILDING", current_candidate_id: next.id, updated_at: now() };
    input.deps.persist(batch);
    const result = await input.deps.buildCandidate(next);
    const outcome = applyBuildOutcome(batch, next, result, now());
    batch = outcome.batch;
    input.deps.persist(batch);
    if (outcome.stop) break;
  }

  return {
    batch,
    candidates,
    userStatus: batchUserFacingStatus(batch),
    humanReviewRequired: false,
    stripeInvoked: false,
  };
}

export async function executeBatchSubmit(input: {
  batch: BatchRecord;
  decisions: BatchHumanDecision[];
  deps: Pick<BatchDeps, "now" | "persist" | "provision">;
}): Promise<{ batch: BatchRecord; provisioned: string[]; skipped: string[] }> {
  const planned = submitBatchDecisions(input.batch, input.decisions, input.deps.now());
  let batch = planned.batch;
  input.deps.persist(batch);
  const provisioned: string[] = [];
  for (const decision of planned.toProvision) {
    const product = batch.completed.find((item) => item.candidate_id === decision.candidate_id);
    if (!product || !input.deps.provision) continue;
    const result = await input.deps.provision(decision, product);
    batch = recordCommerceResult(batch, result, input.deps.now());
    input.deps.persist(batch);
    if (result.status === "provisioned" || result.status === "reused") provisioned.push(decision.candidate_id);
  }
  return { batch, provisioned, skipped: planned.skipped };
}

function finalizeIfReady(batch: BatchRecord, now: string): {
  batch: BatchRecord;
  stop: boolean;
  humanReviewRequired: false;
  stripeInvoked: false;
} {
  const next = { ...batch, updated_at: now };
  const readyProducts = next.completed.filter(
    (item) => item.status === READY_FOR_BATCH_REVIEW || item.status === EXISTING_COMPLETED_PRODUCT,
  );
  if (additionalSuccessCount(next) >= next.requested_success_count) {
    next.phase = BATCH_HUMAN_REVIEW_REQUIRED;
    next.current_candidate_id = null;
    next.comparison = compareBatch(readyProducts);
    next.completed = applyRelativeRecommendations(readyProducts, next.comparison);
    return { batch: next, stop: true, humanReviewRequired: false, stripeInvoked: false };
  }
  if (shouldPauseForCanary(next)) {
    next.phase = CANARY_CHECKPOINT;
    next.current_candidate_id = next.candidate_queue.find((id) => !isSettled(next, id)) ?? null;
    return { batch: next, stop: true, humanReviewRequired: false, stripeInvoked: false };
  }
  next.phase = "BUILDING";
  next.current_candidate_id = next.candidate_queue.find((id) => !isSettled(next, id)) ?? null;
  return { batch: next, stop: false, humanReviewRequired: false, stripeInvoked: false };
}

async function ensureCandidateQueue(
  batch: BatchRecord,
  candidates: ScoredCandidate[],
  deps: BatchDeps,
): Promise<{ batch: BatchRecord; candidates: ScoredCandidate[] }> {
  const remaining = batch.requested_success_count - additionalSuccessCount(batch);
  const skip = [
    ...batch.completed.map((item) => item.candidate_id),
    ...batch.failed.map((item) => item.candidate_id),
  ];
  const unused = candidates.filter((item) => !batch.candidate_queue.includes(item.id));
  const selected = selectBatchCandidates({
    candidates: unused.length > 0 ? unused : candidates,
    needed: remaining + Math.max(2, remaining),
    completedIds: skip,
    skipIds: batch.candidate_queue,
  });
  let pool = candidates;
  let extra = selected.queue;
  if (selected.needMore > 0 || batch.candidate_queue.length === 0) {
    const researched = await deps.research(Math.max(remaining + 4, selected.needMore + remaining));
    pool = mergeCandidates(pool, researched);
    extra = selectBatchCandidates({
      candidates: pool,
      needed: remaining + Math.max(2, remaining),
      completedIds: skip,
      skipIds: batch.candidate_queue,
    }).queue;
  }
  const queue = uniqueIds([...batch.candidate_queue, ...extra.map((item) => item.id)]);
  const next = { ...batch, candidate_queue: queue, phase: batch.phase === "SELECTING" ? "BUILDING" : batch.phase, updated_at: deps.now() };
  deps.persist(next);
  deps.persistCandidates?.(pool);
  return { batch: next, candidates: pool };
}

function mergeCandidates(current: ScoredCandidate[], extra: ScoredCandidate[]): ScoredCandidate[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...extra.filter((item) => !seen.has(item.id))];
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function mergeDecisions(current: BatchHumanDecision[], next: BatchHumanDecision[]): BatchHumanDecision[] {
  const map = new Map(current.map((item) => [item.candidate_id, item]));
  for (const item of next) map.set(item.candidate_id, item);
  return [...map.values()];
}

function recordInfra(
  current: BatchInfrastructureFailure[] | undefined,
  candidateId: string,
  classification: string,
  at: string,
): BatchInfrastructureFailure[] {
  return [...(current ?? []), { candidate_id: candidateId, classification, at }];
}

function repeatedAuthInfra(batch: BatchRecord, classification: string): boolean {
  if (classification !== "AUTH_SESSION_FAILURE") return false;
  return (batch.infrastructure_failures ?? []).filter((item) => item.classification === "AUTH_SESSION_FAILURE").length >= 2;
}

function isSettled(batch: BatchRecord, candidateId: string): boolean {
  return (
    batch.completed.some((item) => item.candidate_id === candidateId) ||
    batch.failed.some((item) => item.candidate_id === candidateId)
  );
}

function businessArea(candidate: { name: string; related_catalog_slugs?: string[] }): string {
  return candidate.related_catalog_slugs?.[0] ?? candidate.name.split(" ").slice(0, 2).join(" ");
}

function dimension(review: FinalReviewData, needle: string, fallback: number | undefined): number | null {
  const hit = review.evaluator.scores.find((item) => item.dimension.toLowerCase().includes(needle));
  return hit?.score ?? fallback ?? review.evaluator.overall;
}

export type { CommerceRecord };
