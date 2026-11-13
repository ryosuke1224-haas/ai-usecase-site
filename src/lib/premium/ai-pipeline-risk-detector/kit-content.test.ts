import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japanesePipelineCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  generateStallRules,
  KIT_SECTIONS,
  STALL_QUEUE_PROMPT,
} from "./kit-content";

test("English and Japanese pipeline kits keep the same section ids", () => {
  const spec = JSON.parse(
    readFileSync("agent-specs/ai-pipeline-risk-detector.json", "utf8"),
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
    japanesePipelineCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English stall rules stay the canonical sentences", () => {
  const english = generateStallRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateStallRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Skip closed-won, closed-lost, and on-hold.",
      "Skip amounts below $500.",
      "A deal is stalled when days_in_stage exceeds 14, or last_activity is older than 14 days before as_of, or next_step is blank.",
      "Rank stalled deals by amount, largest first.",
      "Recovery notes may use only deal name, amount, stage, and last activity date.",
      "Do not invent a contact, objection, or deadline.",
      "A stall flag does not prove the buyer lost interest.",
      "You send it. Nothing is sent or written to the CRM.",
    ].join("\n"),
  );
  assert.match(STALL_QUEUE_PROMPT, /Nothing is sent or written to the CRM/);
  assert.match(STALL_QUEUE_PROMPT, /Do not invent/);
});

test("Japanese copy preserves CRM export boundary and skip-first", () => {
  assert.match(japanesePipelineCopy.stallQueuePrompt, /先にスキップルール/);
  assert.match(japanesePipelineCopy.stallQueuePrompt, /自動では送信もCRM書き込みもしません/);
  assert.match(japanesePipelineCopy.stallQueuePrompt, /連絡先、異議/);
  assert.equal(japanesePipelineCopy.stallQueuePrompt.includes("自動で送信します"), false);
  assert.equal(japanesePipelineCopy.stallQueuePrompt.includes("CRMに書き込みます"), false);
  assert.match(japanesePipelineCopy.nextWeekPrompt, /自動では送信もCRM書き込みもしません/);
  assert.match(japanesePipelineCopy.publicBody, /自動では送信もCRM書き込みもしません/);
  assert.match(japanesePipelineCopy.demo.step6Title, /自動では送信もCRM書き込みもしません/);
  assert.ok(japanesePipelineCopy.setupSteps.some((step) => step.includes("先にスキップルール")));
  assert.ok(
    japanesePipelineCopy.setupSteps.some((step) =>
      step.includes("HubSpot、Pipedrive、Salesforce、メールとの接続ではありません"),
    ),
  );

  const rules = generateStallRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /closed-won、closed-lost、および on-hold は外す/);
  assert.match(rules.rules, /自動では送信もCRM書き込みもしません/);
  assert.match(rules.rules, /連絡先、異議、期限は作らないでください/);
  assert.match(rules.rules, /停滞の印は、買い手が興味を失った証拠にはなりません/);

  const invalid = generateStallRules({ ...DEFAULT_RULES_INPUT, daysInStageLimit: "" }, "ja");
  assert.deepEqual(invalid, {
    ok: false,
    errors: ["1以上の停滞上限を入力してください。"],
  });
});
