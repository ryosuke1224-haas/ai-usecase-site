import { canApproveProductAndPrice } from "./retry-builder";
import { HUMAN_REVIEW_REQUIRED } from "./supervisor";
import type { CommerceRecord, FinalReviewDecision, RunRecord } from "./types";
import type { FinalReviewData } from "./dashboard";
import { selectProvisioningAccount } from "../atlas-commerce/stripe-accounts";
import { provisionSandboxProduct, type ProvisionResult, type SandboxStripe } from "../../src/lib/payments/provision";
import type { RegistryProduct } from "../../src/lib/payments/registry";

export const PRICE_APPROVED = "PRICE_APPROVED";
export const READY_FOR_PREVIEW = "READY_FOR_PREVIEW";
export const POST_APPROVAL_STATUSES = new Set([PRICE_APPROVED, READY_FOR_PREVIEW]);

export type HumanDecisionRecord = {
  action: "APPROVE_PRODUCT_AND_PRICE";
  decided_at: string;
  note: string;
};

export type PriceApprovalRecord = {
  amount_cents: number;
  currency: "usd";
  payment_type: "ONE_TIME";
  market: "US";
};

export type CommerceResultRecord = {
  status: "provisioned" | "reused" | "failed" | "not_started";
  product_slug: string;
  market: "US";
  environment: "SANDBOX";
  currency: "usd";
  amount_cents: number;
  payment_type: "ONE_TIME";
  registry_mapping: "written" | "reused" | "missing" | "unchanged";
  code?: string;
};

export type ProductPriceResumePlan = {
  kind: "commerce_retry" | "already_complete" | "reopen_price_approval" | "not_applicable";
  invokeBuilder: false;
  invokeQa: false;
  invokeEvaluator: false;
  invokeStripe: boolean;
  amountCents: number | null;
};

export type ApprovalDeps = {
  now(): string;
  selectAccount: typeof selectProvisioningAccount;
  provision: typeof provisionSandboxProduct;
  readRegistry(): Promise<RegistryProduct[]>;
  saveRegistry(row: RegistryProduct): Promise<{ status: "updated" | "skipped"; reason?: string }>;
  createStripe(key: string): SandboxStripe;
  persistRun(run: RunRecord): void;
};

export function isPostApprovalStatus(status: string | null | undefined): boolean {
  return POST_APPROVAL_STATUSES.has(status ?? "");
}

export function recoverApprovedAmountCents(input: {
  price_approval?: { amount_cents?: number } | null;
  commerce?: { approved_price_cents?: number } | null;
  finalReview?: { decision?: string; approved_price_cents?: number | null } | null;
}): number | null {
  const values = [
    input.price_approval?.amount_cents,
    input.finalReview?.decision === "APPROVE_PRODUCT_AND_PRICE" ? input.finalReview.approved_price_cents : null,
    input.commerce?.approved_price_cents,
  ];
  for (const value of values) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 99_900) return value;
  }
  return null;
}

export function commerceSucceeded(commerce: CommerceRecord | null | undefined): boolean {
  if (!commerce) return false;
  if (commerce.provisioning !== "created" && commerce.provisioning !== "reused") return false;
  return commerce.statuses.includes("READY_FOR_PREVIEW");
}

export function planProductPriceResume(
  run: Pick<RunRecord, "phase" | "status" | "commerce" | "price_approval" | "human_decision" | "final_review_decision">,
  finalReview: Pick<FinalReviewDecision, "decision" | "approved_price_cents"> | null,
): ProductPriceResumePlan {
  const none = {
    invokeBuilder: false as const,
    invokeQa: false as const,
    invokeEvaluator: false as const,
  };
  const amountCents = recoverApprovedAmountCents({
    price_approval: run.price_approval,
    commerce: run.commerce,
    finalReview,
  });
  const approved =
    run.human_decision?.action === "APPROVE_PRODUCT_AND_PRICE" ||
    run.final_review_decision === "APPROVE_PRODUCT_AND_PRICE" ||
    finalReview?.decision === "APPROVE_PRODUCT_AND_PRICE";
  if (!approved && amountCents == null) {
    return { kind: run.phase === "AWAITING_FINAL_REVIEW" ? "reopen_price_approval" : "not_applicable", invokeStripe: false, amountCents: null, ...none };
  }
  if (approved && amountCents == null) {
    return { kind: "reopen_price_approval", invokeStripe: false, amountCents: null, ...none };
  }
  if (commerceSucceeded(run.commerce) && amountCents != null) {
    return { kind: "already_complete", invokeStripe: false, amountCents, ...none };
  }
  if (approved && amountCents != null) {
    return { kind: "commerce_retry", invokeStripe: true, amountCents, ...none };
  }
  return { kind: "not_applicable", invokeStripe: false, amountCents, ...none };
}

export function persistHumanPriceApproval(
  run: RunRecord,
  input: { cents: number; note: string; at: string; slug: string },
): void {
  run.human_decision = {
    action: "APPROVE_PRODUCT_AND_PRICE",
    decided_at: input.at,
    note: safeNote(input.note),
  };
  run.price_approval = {
    amount_cents: input.cents,
    currency: "usd",
    payment_type: "ONE_TIME",
    market: "US",
  };
  run.final_review_decision = "APPROVE_PRODUCT_AND_PRICE";
  run.status = PRICE_APPROVED;
  if (run.phase === "READY_FOR_PREVIEW") return;
  run.phase = "AWAITING_FINAL_REVIEW";
}

export function applyCommerceOutcome(
  run: RunRecord,
  input: {
    result: Extract<ProvisionResult, { ok: true }> | { ok: false; code: string };
    cents: number;
    slug: string;
    name: string;
    suggestedCents: number;
    at: string;
    dryRun: boolean;
    registry: "written" | "reused" | "missing" | "unchanged";
  },
): void {
  if (!input.result.ok) {
    run.commerce_result = {
      status: "failed",
      product_slug: input.slug,
      market: "US",
      environment: "SANDBOX",
      currency: "usd",
      amount_cents: input.cents,
      payment_type: "ONE_TIME",
      registry_mapping: "unchanged",
      code: input.result.code,
    };
    run.status = PRICE_APPROVED;
    run.phase = "AWAITING_FINAL_REVIEW";
    return;
  }
  if (input.dryRun || input.result.dryRun) {
    run.commerce = {
      schema_version: "atlas-commerce-v1",
      run_id: run.run_id,
      product_slug: input.slug,
      product_name: input.name,
      suggested_price_cents: input.suggestedCents,
      approved_price_cents: input.cents,
      payment_type: "ONE_TIME",
      stripe_environment: "SANDBOX",
      statuses: input.result.statuses,
      provisioning: "not_started",
      committed: false,
      pushed: false,
      published: false,
      decided_at: input.at,
    };
    run.commerce_result = {
      status: "not_started",
      product_slug: input.slug,
      market: "US",
      environment: "SANDBOX",
      currency: "usd",
      amount_cents: input.cents,
      payment_type: "ONE_TIME",
      registry_mapping: "unchanged",
    };
    run.status = PRICE_APPROVED;
    run.phase = "AWAITING_FINAL_REVIEW";
    return;
  }
  const reused = input.result.reused;
  run.commerce = {
    schema_version: "atlas-commerce-v1",
    run_id: run.run_id,
    product_slug: input.slug,
    product_name: input.name,
    suggested_price_cents: input.suggestedCents,
    approved_price_cents: input.cents,
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    statuses: input.result.statuses,
    provisioning: reused ? "reused" : "created",
    committed: false,
    pushed: false,
    published: false,
    decided_at: input.at,
  };
  run.commerce_result = {
    status: reused ? "reused" : "provisioned",
    product_slug: input.slug,
    market: "US",
    environment: "SANDBOX",
    currency: "usd",
    amount_cents: input.cents,
    payment_type: "ONE_TIME",
    registry_mapping: input.registry,
  };
  run.status = READY_FOR_PREVIEW;
  run.phase = READY_FOR_PREVIEW;
}

export function reconcileCompletedApproval(
  run: RunRecord,
  finalReview: FinalReviewDecision | null,
): boolean {
  const plan = planProductPriceResume(run, finalReview);
  if (plan.kind !== "already_complete" || plan.amountCents == null) return false;
  const at = run.human_decision?.decided_at ?? finalReview?.decided_at ?? run.commerce?.decided_at ?? new Date().toISOString();
  persistHumanPriceApproval(run, {
    cents: plan.amountCents,
    note: finalReview?.note ?? run.human_decision?.note ?? "",
    at,
    slug: run.approved_candidate_id ?? run.commerce?.product_slug ?? "",
  });
  run.commerce_result = run.commerce_result ?? {
    status: run.commerce?.provisioning === "reused" ? "reused" : "provisioned",
    product_slug: run.commerce?.product_slug ?? run.approved_candidate_id ?? "",
    market: "US",
    environment: "SANDBOX",
    currency: "usd",
    amount_cents: plan.amountCents,
    payment_type: "ONE_TIME",
    registry_mapping: "written",
  };
  run.status = READY_FOR_PREVIEW;
  run.phase = READY_FOR_PREVIEW;
  run.final_review_decision = "APPROVE_PRODUCT_AND_PRICE";
  return true;
}

export function approvalEligible(run: Pick<RunRecord, "status">, data: Parameters<typeof canApproveProductAndPrice>[0]): boolean {
  if (run.status === READY_FOR_PREVIEW) return true;
  if (run.status !== HUMAN_REVIEW_REQUIRED && run.status !== PRICE_APPROVED && run.status != null) return false;
  return canApproveProductAndPrice(data);
}

export async function executeProductPriceApproval(input: {
  run: RunRecord;
  data: FinalReviewData;
  cents: number;
  note: string;
  dryRun: boolean;
  deps: ApprovalDeps;
}): Promise<{ ok: true; reused: boolean; dryRun: boolean } | { ok: false; status: number; error: string }> {
  const { run, data, deps } = input;
  if (!approvalEligible(run, data)) {
    return { ok: false, status: 409, error: "Final Review gates are not satisfied for product and price approval." };
  }
  const at = deps.now();
  persistHumanPriceApproval(run, { cents: input.cents, note: input.note, at, slug: data.candidateId });
  deps.persistRun(run);

  const account = deps.selectAccount({ market: "US", environment: "SANDBOX" });
  if (!account.ok) {
    applyCommerceOutcome(run, {
      result: { ok: false, code: account.code },
      cents: input.cents,
      slug: data.candidateId,
      name: data.blueprintName,
      suggestedCents: data.suggestedPriceCents,
      at,
      dryRun: input.dryRun,
      registry: "unchanged",
    });
    deps.persistRun(run);
    return {
      ok: false,
      status: account.code === "LIVE_STRIPE_PROVISIONING_BLOCKED" ? 409 : 503,
      error: account.code,
    };
  }

  const existing =
    (await deps.readRegistry()).find(
      (item) =>
        item.product_slug === data.candidateId &&
        item.market === "US" &&
        item.locale === "en" &&
        item.currency === "usd" &&
        item.stripe_environment === "SANDBOX",
    ) ?? null;

  const result = await deps.provision({
    humanApproved: true,
    stripeKey: account.key,
    dryRun: input.dryRun,
    slug: data.candidateId,
    name: data.blueprintName,
    approvedAmountCents: input.cents,
    suggestedAmountCents: data.suggestedPriceCents,
    rationale: data.commercialRationale,
    existing,
    stripe: input.dryRun ? unusedStripe() : deps.createStripe(account.key),
    market: "US",
    locale: "en",
    currency: "usd",
    environment: "SANDBOX",
  });

  if (!result.ok) {
    applyCommerceOutcome(run, {
      result,
      cents: input.cents,
      slug: data.candidateId,
      name: data.blueprintName,
      suggestedCents: data.suggestedPriceCents,
      at,
      dryRun: input.dryRun,
      registry: "unchanged",
    });
    deps.persistRun(run);
    return {
      ok: false,
      status: result.code === "LIVE_STRIPE_PROVISIONING_BLOCKED" ? 409 : 503,
      error: result.code,
    };
  }

  let registry: CommerceResultRecord["registry_mapping"] = existing ? "reused" : "missing";
  if (result.row) {
    await deps.saveRegistry(result.row);
    registry = existing ? "reused" : "written";
  } else if (input.dryRun || result.dryRun) {
    registry = "unchanged";
  }

  applyCommerceOutcome(run, {
    result,
    cents: input.cents,
    slug: data.candidateId,
    name: data.blueprintName,
    suggestedCents: data.suggestedPriceCents,
    at,
    dryRun: input.dryRun,
    registry,
  });
  deps.persistRun(run);
  return { ok: true, reused: result.reused, dryRun: result.dryRun };
}

export function formatApprovalCli(run: RunRecord): string[] {
  const lines = [
    `Human decision: ${run.human_decision?.action ?? run.final_review_decision ?? "none"}`,
    `Price approval: ${run.price_approval ? `$${run.price_approval.amount_cents / 100} ${run.price_approval.currency.toUpperCase()} ${run.price_approval.payment_type}` : "none"}`,
    `Commerce: ${run.commerce_result?.status ?? "none"}`,
    `Status: ${run.status ?? "none"}`,
    `Phase: ${run.phase}`,
    "Committed: false. Pushed: false. Published: false.",
  ];
  if (run.commerce_result?.code) lines.push(`Commerce code: ${run.commerce_result.code}`);
  return lines.filter((line) => !looksLikeSecret(line));
}

export function looksLikeSecret(text: string): boolean {
  return /(?:sk|rk)_(?:test|live)_|whsec_|sb_(?:secret|publishable)_/.test(text);
}

function safeNote(note: string): string {
  return note
    .replace(/(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/whsec_[A-Za-z0-9]+/g, "[redacted]")
    .slice(0, 2000);
}

function unusedStripe(): SandboxStripe {
  return {
    async findProductBySlug() {
      throw new Error("Stripe lookup was not configured.");
    },
    async findPrice() {
      throw new Error("Stripe lookup was not configured.");
    },
    async createProduct() {
      throw new Error("Stripe create was not configured.");
    },
    async createPrice() {
      throw new Error("Stripe create was not configured.");
    },
  };
}
