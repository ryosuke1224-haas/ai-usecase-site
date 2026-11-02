import assert from "node:assert/strict";
import { test } from "node:test";
import { isSafeCandidateOwnedPath } from "./candidate-cleanup";

test("partial candidate changes cannot contaminate other products", () => {
  const id = "no-show-recovery-assistant";
  assert.equal(isSafeCandidateOwnedPath(`app/blueprints/${id}/page.tsx`, id), true);
  assert.equal(isSafeCandidateOwnedPath(`components/premium/${id}/guided-demo.tsx`, id), true);
  assert.equal(isSafeCandidateOwnedPath(`src/lib/premium/${id}/kit-content.ts`, id), true);
  assert.equal(isSafeCandidateOwnedPath(`e2e/${id}/public.spec.ts`, id), true);
  assert.equal(isSafeCandidateOwnedPath("src/lib/blueprints.ts", id), false);
  assert.equal(isSafeCandidateOwnedPath("app/blueprints/google-ads-performance-coach/page.tsx", id), false);
  assert.equal(isSafeCandidateOwnedPath("app/blueprints/quote-request-assistant/kit/page.tsx", id), false);
  assert.equal(isSafeCandidateOwnedPath("app/blueprints/ai-expense-watchdog/page.tsx", id), false);
  assert.equal(isSafeCandidateOwnedPath("app/blueprints/security-readiness-action-pack/page.tsx", id), false);
  assert.equal(isSafeCandidateOwnedPath("atlas-memory/batches/batch-20261031T062745Z/batch.json", id), false);
});
