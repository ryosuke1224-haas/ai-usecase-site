import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseExpenseCopy } from "./copy-ja";
import { DEFAULT_RULES_INPUT, generateExpenseReviewRules, KIT_SECTIONS, RECURRING_LEDGER_PROMPT } from "./kit-content";

test("English and Japanese expense kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/ai-expense-watchdog.json", "utf8")) as {
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
    japaneseExpenseCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English review rules stay the canonical sentences", () => {
  const english = generateExpenseReviewRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateExpenseReviewRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Always keep: ZoomMeet.",
      "Watch for overlap in: design tools.",
      "List a price change only when the later amount minus the earlier amount is 5.00 or more.",
      "Group a vendor as recurring only when it appears in at least two months.",
      "One-time charges are not subscriptions.",
      "Do not invent savings.",
      "Do not cancel. You cancel it. The kit changes nothing.",
    ].join("\n"),
  );
  assert.match(RECURRING_LEDGER_PROMPT, /Do not invent/);
  assert.match(RECURRING_LEDGER_PROMPT, /Do not cancel/);
});

test("Japanese copy maps Description and Debit and refuses invented or automatic changes", () => {
  const fieldMap = japaneseExpenseCopy.demo.fieldMap;
  assert.match(fieldMap, /Description を vendor/);
  assert.match(fieldMap, /Debit を amount/);
  assert.match(fieldMap, /書いていない支払先、日付、金額は作りません/);
  assert.ok(japaneseExpenseCopy.setupSteps.some((step) => step.includes(fieldMap)));
  assert.match(japaneseExpenseCopy.ledgerPrompt, /Description を vendor/);
  assert.match(japaneseExpenseCopy.ledgerPrompt, /Debit を amount/);
  assert.match(japaneseExpenseCopy.ledgerPrompt, /解約、返金、請求、口座の変更は自動では行いません/);
  assert.equal(japaneseExpenseCopy.ledgerPrompt.includes("自動で解約します"), false);
  assert.match(japaneseExpenseCopy.increasePrompt, /確認の候補|AIの解釈/);
  assert.match(japaneseExpenseCopy.publicBody, /自動では行いません/);

  const rules = generateExpenseReviewRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /書いていない支払先、日付、金額は作りません/);
  assert.match(rules.rules, /解約の決定ではありません/);
  assert.match(rules.rules, /自動では行いません/);
  assert.match(rules.rules, /常に残す: ZoomMeet/);

  const invalid = generateExpenseReviewRules({ ...DEFAULT_RULES_INPUT, minimumAmount: "-1" }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["0以上の最小金額を入力してください。"] });
});
