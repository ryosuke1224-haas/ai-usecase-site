export type AtlasRunSummary = {
  id: string;
  phase: string;
  status: string;
  mode: string;
  updatedAt: string | null;
  outcome: "running" | "failed" | "succeeded" | "waiting";
  detail?: string | null;
};

export type JapanProductState = {
  slug: string;
  status: string;
  localization: string;
  qa: string;
  updatedAt: string | null;
};

export type CandidateState = {
  id: string;
  name: string;
  status: string;
  updatedAt: string | null;
  summary: string;
};

const RUNNING = new Set([
  "RESEARCH",
  "SELECT",
  "RESEARCH_PACKAGE",
  "BLOG_DRAFT",
  "NEWSLETTER_DRAFT",
  "BLUEPRINT_CANDIDATES",
  "QA",
  "REVIEW_QUEUE",
  "SPEC",
  "BUILD",
]);
const FAILED = new Set(["FAILED", "HUMAN_INTERVENTION_REQUIRED"]);
const SUCCEEDED = new Set(["FINISHED", "READY_FOR_PREVIEW"]);

export function classifyRun(phase: string, status: string | null): AtlasRunSummary["outcome"] {
  const label = status || phase;
  if (FAILED.has(phase) || FAILED.has(label) || label.includes("FAILED")) return "failed";
  if (RUNNING.has(phase)) return "running";
  if (SUCCEEDED.has(phase)) return "succeeded";
  return "waiting";
}

export function parseRunRecord(value: unknown): AtlasRunSummary | null {
  if (!value || typeof value !== "object") return null;
  const row = value as {
    run_id?: unknown;
    phase?: unknown;
    status?: unknown;
    mode?: unknown;
    updated_at?: unknown;
    counts?: unknown;
    errors?: unknown;
  };
  if (typeof row.run_id !== "string" || typeof row.phase !== "string") return null;
  const status = typeof row.status === "string" ? row.status : row.phase;
  const counts = row.counts && typeof row.counts === "object" ? row.counts as Record<string, unknown> : null;
  const countText = counts
    ? ["researched", "selected", "blogs", "queued", "qaRejected", "duplicates"].flatMap((key) => (
      typeof counts[key] === "number" ? [`${key} ${counts[key]}`] : []
    )).join(", ")
    : "";
  const errors = Array.isArray(row.errors) ? row.errors.filter((item): item is string => typeof item === "string").slice(0, 2) : [];
  const detail = [countText, ...errors].filter(Boolean).join(" · ");
  return {
    id: row.run_id,
    phase: row.phase,
    status,
    mode: row.mode === "dry-run" || row.mode === "full" ? row.mode : "unknown",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    outcome: classifyRun(row.phase, status),
    detail: detail || null,
  };
}

export function parseCandidateHistory(value: unknown): CandidateState[] {
  if (!value || typeof value !== "object") return [];
  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return [];
  return candidates.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; name?: unknown; status?: unknown; updated_at?: unknown; last_scores?: unknown };
    if (typeof row.id !== "string" || typeof row.name !== "string" || typeof row.status !== "string") return [];
    const scores = row.last_scores as { overall?: unknown } | null;
    const overall = scores && typeof scores.overall === "number" ? ` Overall ${scores.overall}.` : "";
    return [{
      id: row.id,
      name: row.name,
      status: row.status,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
      summary: `Atlas candidate.${overall} Local Atlas memory is read-only from this page.`,
    }];
  });
}

export function parseJapanBatch(value: unknown): JapanProductState[] {
  if (!value || typeof value !== "object") return [];
  const products = (value as { products?: unknown }).products;
  if (!Array.isArray(products)) return [];
  return products.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as {
      slug?: unknown;
      status?: unknown;
      localization?: unknown;
      evaluator_decision?: unknown;
      qa?: { authenticated?: unknown; public?: unknown };
      updated_at?: unknown;
    };
    if (typeof row.slug !== "string" || typeof row.status !== "string") return [];
    const decision = typeof row.evaluator_decision === "string" ? row.evaluator_decision : "not run";
    const authenticated = row.qa && typeof row.qa.authenticated === "string" ? row.qa.authenticated : "not run";
    return [{
      slug: row.slug,
      status: row.status,
      localization: typeof row.localization === "string" ? row.localization : "missing",
      qa: `Evaluator ${decision}. Authenticated QA ${authenticated}.`,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    }];
  });
}

export type ProductOperationRow = {
  slug: string;
  title: string;
  stage: string;
  localization: string;
  qa: string;
  pricing: string;
  publish: string;
};

export function productStage(input: {
  liveCheckout: boolean;
  shipped: boolean;
  japanStatus: string | null;
  candidateStatus: string | null;
}): string {
  if (input.liveCheckout && input.shipped) return "PUBLISHED";
  if (input.japanStatus === "READY_FOR_JAPAN_REVIEW") return "READY_FOR_REVIEW";
  if (input.japanStatus === "LOCALIZING" || input.japanStatus === "REPAIRING") return "JA Localize";
  if (input.japanStatus === "QA" || input.japanStatus === "EVALUATING" || input.japanStatus === "VALIDATING_EXISTING") return "JA QA";
  if (input.candidateStatus === "APPROVED") return "APPROVED";
  if (input.candidateStatus === "PROPOSED" || input.candidateStatus === "HOLD") return "Candidate";
  if (input.japanStatus) return input.japanStatus;
  if (input.shipped) return "PUBLISHED";
  return "Candidate";
}

export function productOperationRows(input: {
  products: { slug: string; titleJa: string; live: boolean }[];
  japan: JapanProductState[];
  candidates: CandidateState[];
}): ProductOperationRow[] {
  const japan = new Map(input.japan.map((item) => [item.slug, item]));
  const candidates = new Map(input.candidates.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const rows: ProductOperationRow[] = [];
  const push = (slug: string, title: string, live: boolean) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    const localized = japan.get(slug);
    const candidate = candidates.get(slug);
    const shipped = live || Boolean(localized);
    rows.push({
      slug,
      title,
      stage: productStage({
        liveCheckout: live,
        shipped,
        japanStatus: localized?.status ?? null,
        candidateStatus: candidate?.status ?? null,
      }),
      localization: localized?.localization ?? "No Japan record",
      qa: localized?.qa ?? (candidate ? candidate.summary : "No QA record"),
      pricing: live ? "Live checkout" : "Not provisioned from this page",
      publish: live ? "Public page" : shipped ? "Recorded, not a checkout product" : "Not published",
    });
  };
  for (const product of input.products) push(product.slug, product.titleJa, product.live);
  for (const item of input.japan) push(item.slug, item.slug, false);
  for (const item of input.candidates) {
    if (item.status === "BUILT" || item.status === "COMPLETED") continue;
    push(item.id, item.name, false);
  }
  return rows;
}

export function nextOperationsAction(input: { runs: AtlasRunSummary[]; waitingReviews: number }): string {
  const running = input.runs.find((run) => run.outcome === "running");
  if (running) return `Atlas run ${running.id} is recorded as ${running.phase}. This page does not start or stop it.`;
  if (input.waitingReviews > 0) return "Review the open items in the Review Queue. Approving does not publish or send.";
  const failed = input.runs.find((run) => run.outcome === "failed");
  if (failed) return `The latest failed record is ${failed.id}. Open the local Atlas run files before starting another build.`;
  return "No automation is running from this page. npm run atlas:weekly can insert drafts into the Review Queue. It does not publish or send.";
}
