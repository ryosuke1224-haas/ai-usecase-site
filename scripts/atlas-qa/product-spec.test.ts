import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { taskSchema } from "../atlas-agent/schema";
import {
  SHARED_INFRA_FAILURES,
  planBatchResume,
  restoreStoppedInfrastructureCandidate,
  type BatchRecord,
} from "../atlas-auto/batch";
import { validateBuilderAssignment } from "../atlas-auto/task-assignment";
import type { BlueprintSpec } from "../atlas-auto/spec";
import {
  ProductSpecMissingError,
  currentProductSpecIssues,
  listProductE2EIds,
  loadProductSpec,
  missingProductSpecIds,
  playwrightIgnoreForMissingSpecs,
  productSpecExists,
  productSpecRelativePath,
  requiredSharedSpecIssues,
} from "../../e2e/support/product-spec";

const ATLAS_PRODUCTS = [
  "ai-collections-assistant",
  "ai-expense-watchdog",
  "google-ads-performance-coach",
  "no-show-recovery-assistant",
  "quote-request-assistant",
  "security-readiness-action-pack",
] as const;

test("required shared Daily Inbox spec is present", () => {
  assert.deepEqual(requiredSharedSpecIssues(), []);
  assert.equal(loadProductSpec<{ id: string }>("daily-inbox-briefing").id, "daily-inbox-briefing");
});

test("every Atlas product e2e suite has a readable spec", () => {
  for (const id of ATLAS_PRODUCTS) {
    assert.equal(productSpecExists(id), true, productSpecRelativePath(id));
    const spec = loadProductSpec<{
      id: string;
      routes: { guided_demo: string; kit: string };
      guided_demo: { fictional_data_notice: string; sample_input: string };
      kit_contents: { id: string; title: string }[];
    }>(id);
    assert.equal(spec.id, id);
    assert.ok(spec.routes.guided_demo.includes(id));
    assert.ok(spec.guided_demo.fictional_data_notice.length > 0);
    assert.ok(spec.kit_contents.length >= 3);
  }
  assert.deepEqual(missingProductSpecIds("no-show-recovery-assistant"), []);
  assert.equal(playwrightIgnoreForMissingSpecs("no-show-recovery-assistant"), undefined);
});

test("missing unrelated product specs are ignored without throwing", () => {
  const ignore = playwrightIgnoreForMissingSpecs("no-show-recovery-assistant");
  if (ignore) {
    assert.match("e2e/missing-product/public.spec.ts".replaceAll("\\", "/"), ignore);
    assert.doesNotMatch("e2e/no-show-recovery-assistant/public.spec.ts", ignore);
    assert.doesNotMatch("e2e/daily-inbox-briefing/public.spec.ts", ignore);
    assert.doesNotMatch("e2e/payments/access.spec.ts", ignore);
  }
  assert.deepEqual(currentProductSpecIssues("no-show-recovery-assistant"), []);
});

test("loadProductSpec throws a typed error for a missing id", () => {
  assert.throws(
    () => loadProductSpec("does-not-exist-product"),
    (error: unknown) => {
      assert.ok(error instanceof ProductSpecMissingError);
      assert.equal(error.productId, "does-not-exist-product");
      assert.equal(error.specPath, "agent-specs/does-not-exist-product.json");
      return true;
    },
  );
});

test("no-show task, spec, builder assignment, and batch resume stay loadable", () => {
  const spec = JSON.parse(fs.readFileSync("agent-specs/no-show-recovery-assistant.json", "utf8")) as BlueprintSpec;
  const parsed = taskSchema.safeParse(
    JSON.parse(fs.readFileSync("agent-tasks/no-show-recovery-assistant-premium-build.json", "utf8")),
  );
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  const assignment = validateBuilderAssignment({ spec, task: parsed.data });
  assert.equal(assignment.ok, true, assignment.ok ? "" : assignment.reason);

  const batch = JSON.parse(fs.readFileSync("atlas-memory/batches/batch-20261031T062745Z/batch.json", "utf8")) as BatchRecord;
  const resumed = restoreStoppedInfrastructureCandidate(batch, "2026-11-02T00:00:00.000Z");
  assert.equal(resumed.phase, "BUILDING");
  assert.equal(resumed.current_candidate_id, "no-show-recovery-assistant");
  const plan = planBatchResume(resumed);
  assert.equal(plan.continueBuilding, true);
  assert.equal(plan.invokeStripe, false);
  assert.ok(plan.skipRebuildIds.includes("ai-expense-watchdog"));
  assert.ok(!plan.skipRebuildIds.includes("no-show-recovery-assistant"));
  assert.equal(SHARED_INFRA_FAILURES.has("PRODUCT_DEFECT"), false);
  assert.equal(SHARED_INFRA_FAILURES.has("TASK_SPEC_MISMATCH"), false);
});

test("product e2e directories are a known Atlas set", () => {
  const ids = listProductE2EIds();
  for (const id of ATLAS_PRODUCTS) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(!ids.includes("daily-inbox-briefing"));
  assert.ok(!ids.includes("payments"));
  assert.equal(fs.existsSync(path.join("e2e", "support", "product-spec.ts")), true);
});
