import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { japaneseWinbackCopy } from "./copy-ja";
import {
  DEFAULT_RULES_INPUT,
  DRAFT_PROMPT,
  generateWinbackRules,
  KIT_SECTIONS,
  RETURN_CHECK_PROMPT,
  SKIP_RULES_PROMPT,
} from "./kit-content";

test("English and Japanese winback kits keep the same section ids", () => {
  const spec = JSON.parse(readFileSync("agent-specs/inactive-customer-winback.json", "utf8")) as {
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
    japaneseWinbackCopy.sections.map((section) => section.id),
    spec.kit_contents.map((section) => section.id),
  );
});

test("English winback rules stay the canonical sentences", () => {
  const english = generateWinbackRules(DEFAULT_RULES_INPUT);
  assert.deepEqual(generateWinbackRules(DEFAULT_RULES_INPUT, "en"), english);
  assert.equal(english.ok, true);
  if (!english.ok) return;
  assert.equal(
    english.rules,
    [
      "Apply SKIP RULES FIRST before any draft.",
      "Skip when marketing_consent is no or missing.",
      "Skip when do_not_contact is yes.",
      "Skip when already contacted this period.",
      "Lapse if last visit before 2026-04-16.",
      "VIP if visits_12mo >= 8.",
      "Skip one-time buyers.",
      "VIP offers: 10% off next color.",
      "Occasional offers: complimentary consult.",
      "Do not send. You send it. Nothing is sent automatically.",
    ].join("\n"),
  );
  assert.match(SKIP_RULES_PROMPT, /SKIP RULES FIRST/);
  assert.match(SKIP_RULES_PROMPT, /Do not invent/);
  assert.match(SKIP_RULES_PROMPT, /Nothing is sent automatically/);
  assert.match(DRAFT_PROMPT, /only after/);
  assert.match(DRAFT_PROMPT, /Do not invent/);
  assert.match(RETURN_CHECK_PROMPT, /A return is not proof the message caused it/);
});

test("Japanese copy keeps skip-first, no invented offers, and human send", () => {
  assert.match(japaneseWinbackCopy.skipRulesPrompt, /先にスキップルール/);
  assert.match(japaneseWinbackCopy.skipRulesPrompt, /marketing_consent/);
  assert.match(japaneseWinbackCopy.skipRulesPrompt, /do_not_contact/);
  assert.match(japaneseWinbackCopy.skipRulesPrompt, /自動では送信しません/);
  assert.match(japaneseWinbackCopy.draftPrompt, /先にスキップルール/);
  assert.match(japaneseWinbackCopy.draftPrompt, /要確認/);
  assert.match(japaneseWinbackCopy.draftPrompt, /作らない/);
  assert.match(japaneseWinbackCopy.returnCheckPrompt, /再来は、メッセージが原因だった証拠にはなりません/);
  assert.match(japaneseWinbackCopy.publicBody, /自動では送信しません/);
  assert.ok(
    japaneseWinbackCopy.setupSteps.some((step) => step.includes("先にスキップルール")),
  );
  assert.ok(
    japaneseWinbackCopy.demo.drafts.every(
      (row) =>
        row.draft.includes("10% off") || row.draft.includes("complimentary consult"),
    ),
  );
  assert.equal(
    japaneseWinbackCopy.demo.drafts.some((row) => /15%|無料券|特別割引/.test(row.draft)),
    false,
  );

  const rules = generateWinbackRules(DEFAULT_RULES_INPUT, "ja");
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /先にスキップルール/);
  assert.match(rules.rules, /marketing_consent が no または空欄/);
  assert.match(rules.rules, /do_not_contact が yes/);
  assert.match(rules.rules, /最終来店が 2026-04-16 より前なら離脱/);
  assert.match(rules.rules, /visits_12mo が 8 以上なら VIP/);
  assert.match(rules.rules, /VIP向けオファー: 10% off next color/);
  assert.match(rules.rules, /一般向けオファー: complimentary consult/);
  assert.match(rules.rules, /オファーリストにない割引は作らないでください/);
  assert.match(rules.rules, /送るのは人です。自動では送信しません/);

  const invalid = generateWinbackRules({ ...DEFAULT_RULES_INPUT, lapseBefore: "" }, "ja");
  assert.deepEqual(invalid, { ok: false, errors: ["離脱の基準日を入力してください。"] });
});
