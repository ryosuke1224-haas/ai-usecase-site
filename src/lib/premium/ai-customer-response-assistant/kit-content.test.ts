import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseReplyCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  DRAFT_PROMPT,
  ESCALATE_PROMPT,
  generateReplyRules,
  KIT_SECTIONS,
} from "./kit-content";

test("English and Japanese reply kits keep the same section ids", () => {
  const spec = JSON.parse(
    readFileSync("agent-specs/ai-customer-response-assistant.json", "utf8"),
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
    japaneseReplyCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English reply rules stay the canonical sentences", () => {
  const english = generateReplyRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateReplyRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Apply ESCALATE RULES FIRST before any customer-facing draft.",
      "Escalate and STOP when: refund demand; injury; legal threat.",
      "Answer only with FAQ facts the owner pasted.",
      "FAQ facts: color visits run 90 minutes; cancellations need 24 hours; we do not quote refunds by email.",
      "If the FAQ does not cover the question, write NEEDS YOUR CHECK. Do not invent a policy, price, or appointment time.",
      "Tone: warm, short, no slang.",
      "Never promise a refund, discount, or deadline that is not in the FAQ.",
      "Do not send. You send it. Nothing is sent automatically.",
    ].join("\n"),
  );
  assert.match(ESCALATE_PROMPT, /ESCALATE RULES FIRST/);
  assert.match(DRAFT_PROMPT, /Never promise a refund/);
  assert.match(DRAFT_PROMPT, /You send it/);
});

test("Japanese copy keeps escalate-first, FAQ-only draft, and approval before send", () => {
  assert.match(japaneseReplyCopy.escalatePrompt, /エスカレート規則を先に適用/);
  assert.match(japaneseReplyCopy.escalatePrompt, /金銭に関する顧客向けの返信は下書きしないでください/);
  assert.match(japaneseReplyCopy.draftPrompt, /FAQだけの返信/);
  assert.match(japaneseReplyCopy.draftPrompt, /返金、割引、期限は約束しないでください/);
  assert.match(japaneseReplyCopy.draftPrompt, /送信はあなたがします/);
  assert.match(japaneseReplyCopy.publicBody, /自動では送りません/);
  assert.match(japaneseReplyCopy.demo.step6Title, /送信はあなたがします/);
  assert.match(japaneseReplyCopy.demo.doNotSend, /送らないでください/);
  assert.ok(japaneseReplyCopy.setupSteps.some((step) => step.includes("FAQ-Only Draft Prompt")));
  assert.ok(japaneseReplyCopy.setupSteps.some((step) => step.includes("Escalate-First Prompt")));
  assert.match(japaneseReplyCopy.demo.partialDraft, /90分/);
  assert.equal(japaneseReplyCopy.demo.partialDraft.includes("refund"), false);

  const rules = generateReplyRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /エスカレート規則を先に適用/);
  assert.match(rules.rules, /返金、割引、期限は約束しないでください/);
  assert.match(rules.rules, /送信はあなたがします/);
  assert.match(rules.rules, /refund demand; injury; legal threat/);

  const invalid = generateReplyRules({ ...DEFAULT_RULES_INPUT, escalateList: "" }, "ja");
  assert.deepEqual(invalid, {
    ok: false,
    errors: ["エスカレート規則を1つ以上入力してください。"],
  });
});
