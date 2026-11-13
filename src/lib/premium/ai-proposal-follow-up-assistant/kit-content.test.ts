import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseProposalCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  generateSilenceRules,
  KIT_SECTIONS,
  SILENCE_QUEUE_PROMPT,
} from "./kit-content";

test("English and Japanese proposal kits keep the same section ids", () => {
  const spec = JSON.parse(
    readFileSync("agent-specs/ai-proposal-follow-up-assistant.json", "utf8"),
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
    japaneseProposalCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English silence rules stay the canonical sentences", () => {
  const english = generateSilenceRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateSilenceRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Skip declined, won, and on-hold.",
      "Skip amounts below $1000.",
      "Skip proposals sent on or after 2026-05-13.",
      "Cadence: 5-11 days recap; 12-20 days check-in; 21+ close-the-loop.",
      "Rank by amount, then by days since sent.",
      "Drafts may use only proposal id, amount, sent date, and one line item.",
      "Do not invent an objection, a competitor, or a deadline.",
      "Silence does not prove they will buy or that they said no.",
      "You send it. Nothing is sent automatically.",
    ].join("\n"),
  );
  assert.match(SILENCE_QUEUE_PROMPT, /Nothing is sent automatically/);
  assert.match(SILENCE_QUEUE_PROMPT, /Do not invent/);
});

test("Japanese copy preserves human send approval and skip-first boundary", () => {
  assert.match(japaneseProposalCopy.silenceQueuePrompt, /先にスキップルール/);
  assert.match(japaneseProposalCopy.silenceQueuePrompt, /自動では送信しません/);
  assert.match(japaneseProposalCopy.silenceQueuePrompt, /異議、競合/);
  assert.equal(japaneseProposalCopy.silenceQueuePrompt.includes("自動で送信します"), false);
  assert.match(japaneseProposalCopy.nextWeekPrompt, /自動では送信しません/);
  assert.match(japaneseProposalCopy.publicBody, /自動では送信しません/);
  assert.match(japaneseProposalCopy.demo.step6Title, /自動では送信しません/);
  assert.ok(japaneseProposalCopy.setupSteps.some((step) => step.includes("先にスキップルール")));

  const rules = generateSilenceRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /declined、won、および on-hold は外す/);
  assert.match(rules.rules, /自動では送信しません/);
  assert.match(rules.rules, /異議、競合名、期限は作らないでください/);
  assert.match(rules.rules, /沈黙は買う証拠でも、断った証拠でもありません/);

  const invalid = generateSilenceRules({ ...DEFAULT_RULES_INPUT, silenceIfSentBefore: "" }, "ja");
  assert.deepEqual(invalid, {
    ok: false,
    errors: ["沈黙日（YYYY-MM-DD）を入力してください。"],
  });
});
