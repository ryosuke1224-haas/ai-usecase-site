import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japanesePayrollCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  generateLaborCheckRules,
  KIT_SECTIONS,
  LABOR_CHECK_PROMPT,
} from "./kit-content";

test("English and Japanese payroll kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/ai-payroll-forecasting.json", "utf8")) as {
    kit_contents: { id: string; title: string }[];
  };
  // English kit_contents order puts the checklist before the worksheet for Tab QA.
  assert.deepEqual(
    [...KIT_SECTIONS.map((section) => section.id)].sort(),
    [...spec.kit_contents.map((section) => section.id)].sort(),
  );
  assert.deepEqual(
    japanesePayrollCopy.sections.map((section) => section.id),
    KIT_SECTIONS.map((section) => section.id),
  );
});

test("English payroll rules stay the canonical sentences", () => {
  const english = generateLaborCheckRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateLaborCheckRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Employer load factor: 1.20.",
      "Target labor % of revenue: 40.",
      "Overtime multiplier: 1.5.",
      "Overtime flag rule: flag if any role has overtime hours > 0.",
      "Flag only against your target and overtime rule. Do not flag a single busy day.",
      "Do not invent rates or savings.",
      "Do not edit shifts or payroll. You edit the schedule in your own tool. The kit changes nothing.",
    ].join("\n"),
  );
  assert.match(LABOR_CHECK_PROMPT, /Do not invent/);
  assert.match(LABOR_CHECK_PROMPT, /You edit the schedule/);
});

test("Japanese copy maps schedule fields and refuses automatic payroll or schedule edits", () => {
  const fieldMap = japanesePayrollCopy.fieldMap;
  assert.match(fieldMap, /role/);
  assert.match(fieldMap, /scheduled_hours/);
  assert.match(fieldMap, /hourly_rate/);
  assert.match(fieldMap, /overtime_hours_in_schedule/);
  assert.match(fieldMap, /書いていない時間、時給、残業、売上、削減額は作りません/);
  assert.ok(japanesePayrollCopy.setupSteps.some((step) => step.includes(fieldMap)));
  assert.match(japanesePayrollCopy.laborCheckPrompt, /シフトの変更は、自分のシフト管理ツールで自分で行います/);
  assert.match(japanesePayrollCopy.laborCheckPrompt, /書いていない時間、時給、残業、ロード係数、売上、削減額は作りません/);
  assert.equal(japanesePayrollCopy.laborCheckPrompt.includes("自動で給与を送信します"), false);
  assert.match(japanesePayrollCopy.publicBody, /給与の送信や編集は自動では行いません/);
  assert.equal(japanesePayrollCopy.publicBody.includes("ROI"), false);

  const rules = generateLaborCheckRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /書いていない時給や削減額は作りません/);
  assert.match(rules.rules, /自動では行いません/);
  assert.match(rules.rules, /事業主負担のロード係数: 1.20/);

  const invalid = generateLaborCheckRules({ ...DEFAULT_RULES_INPUT, loadFactor: "0" }, "ja");
  assert.deepEqual(invalid, {
    ok: false,
    errors: ["ロード係数は0より大きい数で入力してください。"],
  });
});
