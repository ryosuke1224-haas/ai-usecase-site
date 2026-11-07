import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { noShowCopy } from "./copy";
import { generateRecoveryRules } from "./kit-content";

const english = noShowCopy("en");
const japanese = noShowCopy("ja");

test("English and Japanese kits keep the same section ids", () => {
  assert.deepEqual(
    japanese.sections.map((section) => section.id),
    english.sections.map((section) => section.id),
  );
  assert.equal(english.reviewItems.length, 9);
  assert.equal(japanese.reviewItems.length, 9);
});

test("setup names the Rebooking Draft Prompt in both locales", () => {
  assert.match(english.sections[0].intro, /Rebooking Draft Prompt/);
  assert.match(english.setupSteps.join("\n"), /Rebooking Draft Prompt/);
  assert.match(japanese.sections[0].intro, /Rebooking Draft Prompt/);
  assert.match(japanese.setupSteps.join("\n"), /Rebooking Draft Prompt/);
});

test("sms_consent no and email consent stay aligned", () => {
  for (const prompt of [english.attendancePrompt, english.rebookingDraftPrompt]) {
    assert.match(prompt, /sms_consent is no or missing|If sms_consent is no or missing/);
    assert.match(prompt, /Email consent does not imply SMS consent/);
    assert.match(prompt, /Nothing is sent automatically/);
    assert.match(prompt, /You review and send/);
  }
  assert.match(english.reviewItems[5], /sms_consent is no or missing/);
  assert.match(english.reviewItems[5], /Email consent does not imply SMS consent/);
  const rules = generateRecoveryRules({ threshold: "3", neverStatuses: "cancelled", alwaysSkip: "" });
  assert.equal(rules.ok, true);
  if (!rules.ok) return;
  assert.match(rules.rules, /SMS draft only when sms_consent = yes and contact_pref = sms/);
  assert.match(rules.rules, /If sms_consent is no or missing, do not draft SMS/);
  assert.match(rules.rules, /Email consent does not imply SMS consent/);
  assert.match(rules.rules, /Nothing is sent automatically/);
  assert.match(rules.rules, /Do not send\. You review and send\. The kit changes nothing/);

  for (const prompt of [japanese.attendancePrompt, japanese.rebookingDraftPrompt]) {
    assert.match(prompt, /sms_consent が no または空欄/);
    assert.match(prompt, /メールの同意は SMS の同意を意味しません/);
    assert.match(prompt, /自動では送信しません/);
  }
  const jaRules = generateRecoveryRules(
    { threshold: "3", neverStatuses: "cancelled", alwaysSkip: "R. Kim" },
    "ja",
  );
  assert.equal(jaRules.ok, true);
  if (!jaRules.ok) return;
  assert.match(jaRules.rules, /sms_consent が no または空欄のときは SMS を下書きしない/);
  assert.match(jaRules.rules, /メールの同意は SMS の同意を意味しません/);
  assert.match(jaRules.rules, /自動では送信しません/);
  assert.match(jaRules.rules, /常に対象外: R\. Kim/);
});

test("published spec matches the English sample the kit copies", () => {
  const spec = JSON.parse(readFileSync("agent-specs/no-show-recovery-assistant.json", "utf8")) as {
    guided_demo: { sample_input: string; fictional_data_notice: string };
    kit_contents: { id: string; title: string }[];
  };
  assert.equal(spec.guided_demo.sample_input, english.sampleBookingsCsv);
  assert.equal(spec.guided_demo.fictional_data_notice, english.fictionalNotice);
  assert.deepEqual(
    spec.kit_contents.map((section) => section.title),
    english.sections.map((section) => section.title),
  );
});
