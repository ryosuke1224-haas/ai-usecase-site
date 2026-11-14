import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { classifyRun, nextOperationsAction, parseRunRecord, productStage } from "./atlas-state";
import { isReviewId, reviewDecision, safePreviewPath } from "./review";
import { parseAdminSection } from "./range";

const ID = "11111111-1111-4111-8111-111111111111";

test("review decisions do not publish or send", () => {
  assert.deepEqual(reviewDecision("READY_FOR_REVIEW", "approve", ""), { ok: true, status: "APPROVED" });
  assert.deepEqual(reviewDecision("APPROVED", "needs_changes", "Fix the source"), { ok: true, status: "NEEDS_CHANGES" });
  assert.deepEqual(reviewDecision("DRAFT", "reject", "Out of scope"), { ok: true, status: "REJECTED" });
  assert.equal(reviewDecision("NEEDS_CHANGES", "reject", "no").ok, false);
  assert.equal(reviewDecision("PUBLISHED", "approve", "").ok, false);
  assert.equal(reviewDecision("SENT", "reject", "stop this send").ok, false);
  assert.equal(reviewDecision("ARCHIVED", "approve", "").ok, false);
  assert.equal(reviewDecision("APPROVED", "approve", "").ok, false);
  assert.equal(isReviewId(ID), true);
  assert.equal(isReviewId("japan-slug"), false);
  assert.equal(safePreviewPath("/ja/blog/sf-agent-notes"), "/ja/blog/sf-agent-notes");
  assert.equal(safePreviewPath("/admin/project"), null);
  assert.equal(safePreviewPath("https://example.com"), null);
});

test("product stages and atlas runs stay descriptive", () => {
  assert.equal(productStage({ liveCheckout: true, shipped: true, japanStatus: "READY_FOR_JAPAN_REVIEW", candidateStatus: null }), "PUBLISHED");
  assert.equal(productStage({ liveCheckout: false, shipped: true, japanStatus: "LOCALIZING", candidateStatus: null }), "JA Localize");
  assert.equal(productStage({ liveCheckout: false, shipped: false, japanStatus: null, candidateStatus: "PROPOSED" }), "Candidate");
  const run = parseRunRecord({ run_id: "run-1", phase: "BUILD", mode: "dry-run", updated_at: "2026-11-13T00:00:00.000Z" });
  assert.equal(run?.outcome, "running");
  assert.equal(classifyRun("FAILED", null), "failed");
  assert.match(nextOperationsAction({ runs: [], waitingReviews: 2 }), /Review Queue/);
  assert.equal(parseAdminSection("review"), "review");
  assert.equal(parseAdminSection("shell"), "overview");
});

test("admin decisions stay behind the allowlist and do not run commands", () => {
  const decide = readFileSync("src/lib/admin/decide.ts", "utf8");
  const page = readFileSync("app/admin/project/page.tsx", "utf8");
  assert.match(decide, /adminAccessDecision/);
  assert.match(page, /adminAccessDecision/);
  assert.ok(page.indexOf("notFound()") < page.indexOf("loadOperationsDashboard("));
  assert.doesNotMatch(decide, /child_process|exec\(|checkout\.sessions\.create|spawn\(/);
  assert.doesNotMatch(readFileSync("components/admin/project-dashboard.tsx", "utf8"), /child_process|spawn\(/);
  assert.match(readFileSync("supabase/migrations/20261114010000_admin_review_queue.sql", "utf8"), /revoke all/);
});
