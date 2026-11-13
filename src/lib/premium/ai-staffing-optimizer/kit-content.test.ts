import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseStaffingCopy } from "./copy-ja";
import {
  COVERAGE_CHECK_PROMPT,
  DEFAULT_RULES_INPUT,
  generateStaffingRules,
  KIT_SECTIONS,
} from "./kit-content";

test("English and Japanese staffing kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/ai-staffing-optimizer.json", "utf8")) as {
    kit_contents: { id: string; title: string }[];
  };
  // English kit_contents order puts the checklist before the worksheet for Tab QA.
  assert.deepEqual(
    [...KIT_SECTIONS.map((section) => section.id)].sort(),
    [...spec.kit_contents.map((section) => section.id)].sort(),
  );
  assert.deepEqual(
    japaneseStaffingCopy.sections.map((section) => section.id),
    KIT_SECTIONS.map((section) => section.id),
  );
});

test("English staffing rules stay the canonical sentences", () => {
  const english = generateStaffingRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateStaffingRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Minimum staff on floor: 2.",
      "Target transactions per staff-hour: 15-25.",
      "Flag only when outside target in at least 3 of 4 weeks.",
      "Protected roles: keyholder.",
      "Do not invent transaction counts or savings.",
      "Do not edit schedules or contact staff. You edit the schedule in your own tool. The kit changes nothing.",
    ].join("\n"),
  );
  assert.match(COVERAGE_CHECK_PROMPT, /Do not invent/);
  assert.match(COVERAGE_CHECK_PROMPT, /You edit the schedule/);
});

test("Japanese copy aligns POS and clocked hours and refuses automatic schedule edits", () => {
  const fieldMap = japaneseStaffingCopy.fieldMap;
  assert.match(fieldMap, /POS/);
  assert.match(fieldMap, /タイムカード|打刻/);
  assert.match(fieldMap, /day と hour/);
  assert.match(fieldMap, /書いていない取引数や人数は作りません/);
  assert.ok(japaneseStaffingCopy.setupSteps.some((step) => step.includes(fieldMap)));
  assert.match(japaneseStaffingCopy.coveragePrompt, /シフトの変更は、自分のシフト管理ツールで自分で行います/);
  assert.match(japaneseStaffingCopy.coveragePrompt, /ROIは作りません/);
  assert.equal(japaneseStaffingCopy.coveragePrompt.includes("自動でシフトを変更します"), false);
  assert.match(japaneseStaffingCopy.publicBody, /自動では編集しません/);
  assert.equal(japaneseStaffingCopy.publicBody.includes("ROI"), false);

  const rules = generateStaffingRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /書いていない取引数や削減額は作りません/);
  assert.match(rules.rules, /自動では行いません/);
  assert.match(rules.rules, /フロア最少人数: 2/);

  const invalid = generateStaffingRules({ ...DEFAULT_RULES_INPUT, minimumStaff: "0" }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["最少人数は1以上で入力してください。"] });
});
