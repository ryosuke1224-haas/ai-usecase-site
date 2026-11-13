import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseUnbilledCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  generateUnbilledSkipRules,
  KIT_SECTIONS,
  QUEUE_PROMPT,
} from "./kit-content";

test("English and Japanese unbilled kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/unbilled-work-review-queue.json", "utf8")) as {
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
    japaneseUnbilledCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English skip rules stay the canonical sentences", () => {
  const english = generateUnbilledSkipRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateUnbilledSkipRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Skip when invoice_id is present.",
      "Never bill statuses: warranty.",
      "Skip amounts below $150.",
      "Skip dates after the as-of date.",
      "Skip disputed jobs.",
      "Rank remaining rows by oldest completion date first.",
      "Invoice outline uses only customer, id, date, hours, rate, and amount from the export.",
      "Do not invent tax, terms, or line items.",
      "A blank invoice id is not proof the customer was never billed off-export.",
      "You create the invoice. Nothing is sent or collected.",
    ].join("\n"),
  );
  assert.match(QUEUE_PROMPT, /SKIP RULES FIRST/);
  assert.match(QUEUE_PROMPT, /Nothing is sent or collected/);
});

test("Japanese copy keeps outcome logging, skip rules, and review-before-action", () => {
  assert.match(japaneseUnbilledCopy.queuePrompt, /まずスキップルール（SKIP RULES FIRST）/);
  assert.match(japaneseUnbilledCopy.queuePrompt, /請求ログに残す/);
  assert.match(japaneseUnbilledCopy.queuePrompt, /請求前に確認/);
  assert.match(japaneseUnbilledCopy.queuePrompt, /請求書はあなたが作ります。送信も入金回収もしません/);
  assert.match(japaneseUnbilledCopy.nextWeekPrompt, /invoiced または write-off/);
  assert.ok(japaneseUnbilledCopy.setupSteps.some((step) => step.includes("請求ログ")));
  assert.ok(japaneseUnbilledCopy.setupSteps.some((step) => step.includes("請求前に確認")));
  assert.ok(
    japaneseUnbilledCopy.setupSteps.some((step) => step.includes("Week-to-Week Billing Log Prompt")),
  );
  assert.match(japaneseUnbilledCopy.publicBody, /送信も入金回収もしません/);

  const rules = generateUnbilledSkipRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /請求ログに書く/);
  assert.match(rules.rules, /請求前に確認する/);
  assert.match(rules.rules, /請求書はあなたが作ります。送信も入金回収もしません/);
  assert.match(rules.rules, /請求しないステータス: warranty/);

  const invalid = generateUnbilledSkipRules({ ...DEFAULT_RULES_INPUT, minimumAmount: "-1" }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["0以上の最小金額を入力してください。"] });
});
