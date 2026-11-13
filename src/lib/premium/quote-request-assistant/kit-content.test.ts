import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseQuoteCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  FIT_REVIEW_PROMPT,
  generateQualificationRules,
  KIT_SECTIONS,
  SCOPE_EXTRACTION_PROMPT,
} from "./kit-content";

test("English and Japanese quote kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/quote-request-assistant.json", "utf8")) as {
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
    japaneseQuoteCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English qualification rules stay the canonical sentences", () => {
  const english = generateQualificationRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateQualificationRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Service area: Riverside.",
      "Minimum size: 150 sq ft.",
      "Offered: deck replacement (wood or composite); railings.",
      "Out of scope: roofing.",
      "Never put prices, cost bands, markups, or supplier names in a draft.",
      "Apply these rules before any FIT label.",
      "If location is missing, write NEEDS YOUR CHECK. Do not assume the service area.",
      "If work is close but not in the catalog, write NEEDS YOUR CHECK. Do not mark FIT NO.",
      "Do not send, price, or add a tracker row.",
    ].join("\n"),
  );
  assert.match(SCOPE_EXTRACTION_PROMPT, /Never put prices/);
  assert.match(FIT_REVIEW_PROMPT, /Never put prices/);
});

test("Japanese copy keeps never-in-draft constraints and you-price boundary", () => {
  assert.match(japaneseQuoteCopy.extractionPrompt, /価格、価格帯、利益率、仕入先名/);
  assert.match(japaneseQuoteCopy.extractionPrompt, /送らないでください/);
  assert.match(japaneseQuoteCopy.fitPrompt, /価格、価格帯、利益率、仕入先名/);
  assert.match(japaneseQuoteCopy.fitPrompt, /見積もりはあなたが付けます/);
  assert.equal(japaneseQuoteCopy.demo.draftText.includes("$"), false);
  assert.equal(japaneseQuoteCopy.demo.draftText.includes("markup"), false);
  assert.ok(japaneseQuoteCopy.setupSteps.some((step) => step.includes("Fit Review Prompt")));
  assert.match(japaneseQuoteCopy.publicBody, /キットは何も変更しません/);

  const rules = generateQualificationRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /価格、価格帯、利益率、仕入先名/);
  assert.match(rules.rules, /サービスエリア: Riverside/);
  assert.match(rules.rules, /最小の広さ: 150 sq ft/);
  assert.match(rules.rules, /下書き禁止メモ: prices; cost bands; markups; supplier names/);

  const invalid = generateQualificationRules({ ...DEFAULT_RULES_INPUT, serviceArea: "" }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["サービスエリアを入力してください。"] });
});
