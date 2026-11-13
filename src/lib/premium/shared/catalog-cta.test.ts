import assert from "node:assert/strict";
import { test } from "node:test";
import {
  lockedBlueprintCtaLabel,
  PRIVATE_PREVIEW_CTA_LABEL,
  PURCHASE_CTA_LABEL,
} from "./catalog-cta";
import { secondaryPromptSetupStep } from "./setup-checklist";

test("locked CTA uses purchase wording only when a paid product exists", () => {
  assert.equal(lockedBlueprintCtaLabel("ai-collections-assistant"), PURCHASE_CTA_LABEL);
  assert.equal(lockedBlueprintCtaLabel("google-ads-performance-coach"), PURCHASE_CTA_LABEL);
  assert.equal(lockedBlueprintCtaLabel("unbilled-work-review-queue"), PURCHASE_CTA_LABEL);
  assert.equal(lockedBlueprintCtaLabel("security-readiness-action-pack"), PRIVATE_PREVIEW_CTA_LABEL);
  assert.equal(lockedBlueprintCtaLabel(undefined), PRIVATE_PREVIEW_CTA_LABEL);
});

test("secondary prompt setup step names the prompt for later runs", () => {
  const step = secondaryPromptSetupStep(
    "Week-to-Week Billing Log Prompt",
    "when you run the queue again with a new export and your billing log",
  );
  assert.match(step, /Week-to-Week Billing Log Prompt/);
  assert.match(step, /later runs do not skip it/);
});
