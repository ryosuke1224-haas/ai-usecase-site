import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseAdsCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  generateMeasurementRules,
  KIT_SECTIONS,
  MEASUREMENT_REVIEW_PROMPT,
} from "./kit-content";

test("English and Japanese Google Ads kits keep the same section ids", () => {
  const spec = JSON.parse(
    readFileSync("agent-specs/google-ads-performance-coach.json", "utf8"),
  ) as {
    kit_contents: { id: string; title: string }[];
  };
  assert.deepEqual(
    KIT_SECTIONS.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
  assert.deepEqual(
    KIT_SECTIONS.map((section) => section.title),
    spec.kit_contents.map((section) => section.title),
  );
  assert.deepEqual(
    japaneseAdsCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English measurement rules stay the canonical sentences", () => {
  const english = generateMeasurementRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateMeasurementRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Qualified outcome: form_submit — completed contact form.",
      "page_view does not count as a qualified outcome.",
      "add_to_cart does not count as a qualified outcome.",
      "Run MEASUREMENT REVIEW FIRST before any efficiency ranking.",
      "If the primary conversion is not the qualified outcome, stop. Do not change bids.",
      "Do not edit the Google Ads account.",
    ].join("\n"),
  );
  assert.match(MEASUREMENT_REVIEW_PROMPT, /Do not change bids/);
  assert.match(MEASUREMENT_REVIEW_PROMPT, /Do not edit the Google Ads account/);
});

test("Japanese copy keeps coaching framing and refuses automatic Ads changes", () => {
  assert.match(japaneseAdsCopy.publicBody, /キットは何も変更しません/);
  assert.match(japaneseAdsCopy.publicBody, /人が決めます/);
  assert.match(japaneseAdsCopy.lockedBody, /自動では行いません/);
  assert.match(japaneseAdsCopy.measurementPrompt, /入札は変えないでください/);
  assert.match(japaneseAdsCopy.measurementPrompt, /Google Ads アカウントは編集しないでください/);
  assert.match(japaneseAdsCopy.measurementPrompt, /推奨アクション/);
  assert.match(japaneseAdsCopy.periodPrompt, /AIの解釈/);
  assert.equal(japaneseAdsCopy.measurementPrompt.includes("自動で変更します"), false);
  assert.ok(
    japaneseAdsCopy.setupSteps.some((step) => step.includes("キットは何も変更しません")),
  );

  const rules = generateMeasurementRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /有効な成果/);
  assert.match(rules.rules, /まず測定の確認/);
  assert.match(rules.rules, /入札は変えません/);
  assert.match(rules.rules, /自動では行いません/);
  assert.match(rules.rules, /キットは何も変更しません/);

  const invalid = generateMeasurementRules({ ...DEFAULT_RULES_INPUT, qualifiedOutcome: "  " }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["有効な成果を入力してください。"] });
});
