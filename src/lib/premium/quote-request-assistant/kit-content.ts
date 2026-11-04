import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Quote Request Setup Checklist" },
  { id: "extraction-prompt", title: "Scope Extraction Prompt" },
  { id: "fit-review-prompt", title: "Fit Review Prompt" },
  { id: "rules-worksheet", title: "Qualification Rules Worksheet" },
  { id: "tracker-template", title: "Quote Tracker Template" },
  { id: "action-review-checklist", title: "Reply Review Checklist" },
  { id: "sample-request", title: "Fictional Sample Requests" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write qualification rules before any request is judged: service area, minimum project size, services offered, work that is out of scope, and internal notes that must never appear in a draft. You decide what a good-fit request is, and which phrases stay internal.",
  "Copy one quote request from a form or email into plain text. Remove payment details, account passwords, and any columns the workflow does not need. This is a pasted request, not a live inbox or form connector. You decide which request to review and what to leave out.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the request as text instead, or do not use AI for this request at all.",
  "Paste the Scope Extraction Prompt, your rules from the Qualification Rules Worksheet, the service catalog, and the request text.",
  "Check CONFIRMED fields against the request.",
  secondaryPromptSetupStep(
    "Fit Review Prompt",
    "with the same rules before you accept any FIT label",
  ),
  "Use the Reply Review Checklist before you contact the requester. You decide whether to ask questions, price the job, decline, or do nothing. You price and send in your own mail or CRM. The Blueprint never sends, edits, cancels, or pays.",
] as const;

export const SCOPE_EXTRACTION_PROMPT = `You are helping me extract the stated scope from one pasted quote request. You prepare; I decide.

Do not invent square footage, budget, addresses, names, or dates. Do not send. Do not price. Do not add a tracker row. I price and send myself, or I decide not to.

I am pasting:
1. My qualification rules from the Qualification Rules Worksheet.
2. My service catalog (what we offer).
3. One quote request copied as plain text from a form or email.

RULES
- Extract only what the request stated. Keep approximate wording. If the request says "maybe 300 sq ft", the CONFIRMED size is "maybe 300 sq ft", not 300.00.
- Label CONFIRMED facts separately from AI INTERPRETATION and from RECOMMENDED ACTION.
- CONFIRMED may include work type, size, location, stated timeline, named material, requester, received date, and source — only when the request stated them.
- A phrase such as "if not crazy expensive" is AI INTERPRETATION about budget sensitivity, not a CONFIRMED budget.
- A stated hope such as "hoping before July" is a requested window, not a booked start date.
- Never put prices, cost bands, markups, supplier names, or other internal notes in a draft acknowledgment.

OUTPUT FORMAT
CONFIRMED: work_type, size, location, timeline stated, material mentioned, requester, received, source. Use only stated words.
AI INTERPRETATION: budget sensitivity, unknown structure condition, whether a date is a preference. Never present these as facts.
NEEDS YOUR CHECK: missing location, size, or work type, or work that is close to the catalog but not listed.
Questions: clarifying questions only. Do not invent facts to avoid asking.
DRAFT ACKNOWLEDGMENT (not sent): thank the requester, repeat confirmed scope, and say we will follow up before we price anything. Never put prices in the draft.
TRACKER: a suggested row only. Do not add a tracker row.
RECOMMENDED ACTION (you decide): add the tracker row, ask the questions, or price the job.

Do not invent. Do not send. Do not price. Do not add a tracker row. Nothing is sent, edited, or paid automatically.`;

export const FIT_REVIEW_PROMPT = `You are helping me judge fit for one pasted quote request against my written qualification rules. You prepare; I decide.

Apply the qualification rules before any FIT label. Do not judge fit from a generic guess.

Do not send. Do not price. Do not leak internal notes. Do not edit a CRM. You price it. You send it. The kit changes nothing.

I am pasting:
1. My qualification rules from the Qualification Rules Worksheet (service area, minimum size, services offered, out-of-scope work, never-in-draft notes).
2. The CONFIRMED fields from the Scope Extraction Prompt.
3. The original request text.

RULES
- FIT YES only when location is in the service area, size meets the minimum, and the work type is offered. Show the matching rules.
- FIT NO when the work is out of scope or the location is outside the service area. Show the matching rule.
- If location, size, or work type is missing, write NEEDS YOUR CHECK. Do not assume the service area. Do not infer size.
- If the work is close to the catalog but not listed, write NEEDS YOUR CHECK. Do not mark FIT NO.
- Do not mark FIT NO on an unusual request that might still be a good lead.
- Never put prices, cost bands, markups, or supplier names in any draft.

OUTPUT FORMAT
FIT YES, FIT NO, or NEEDS YOUR CHECK, with the matching rule.
Reasons: the written rules that applied.
RECOMMENDED ACTION (you decide): quote, decline, or ask more. Do not send. Do not price.

You price it. You send it. The kit changes nothing.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "Every CONFIRMED fact appears in the request text.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "Fit used only the written qualification rules.",
  "Unusual requests close to the catalog were not marked FIT NO.",
  "Missing location, size, or work type is NEEDS YOUR CHECK, not an assumed location.",
  "The draft has no price, cost band, markup, or supplier name.",
  "Internal notes that must never appear in a draft stayed out of the draft.",
  "I will ask the questions, price the job, or decline myself.",
  "I will send the reply myself. The kit changes nothing.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a request. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove payment details and other columns the workflow does not need.",
  "Do not paste account passwords, payment card numbers, or bank details into the AI tool.",
  "Do not put prices, cost bands, markups, or supplier names in a customer-facing draft, and do not send the draft from the kit.",
  "Do not mark FIT NO on an unusual request that is close to the catalog. That case is NEEDS YOUR CHECK so a good lead is not dropped in silence.",
  "Nothing is sent, edited, cancelled, or paid automatically. You price and send yourself. The kit changes nothing.",
  "Atlas does not connect to a website form, inbox, CRM, sheet, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const SERVICE_AREA_ERROR = "Enter a service area.";
export const MINIMUM_SIZE_ERROR = "Enter a minimum project size.";

export type QualificationRulesInput = {
  serviceArea: string;
  minimumSize: string;
  servicesOffered: string;
  outOfScope: string;
  neverInDraft: string;
};

export const DEFAULT_RULES_INPUT: QualificationRulesInput = {
  serviceArea: "Riverside",
  minimumSize: "150",
  servicesOffered: "deck replacement (wood or composite); railings",
  outOfScope: "roofing",
  neverInDraft: "prices; cost bands; markups; supplier names",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

export function generateQualificationRules(
  input: QualificationRulesInput,
): RulesResult {
  const errors: string[] = [];
  if (!input.serviceArea.trim()) {
    errors.push(SERVICE_AREA_ERROR);
  }
  if (!input.minimumSize.trim()) {
    errors.push(MINIMUM_SIZE_ERROR);
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const outOfScopeItems = input.outOfScope
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = [
    `Service area: ${input.serviceArea.trim()}.`,
    `Minimum size: ${input.minimumSize.trim()} sq ft.`,
    `Offered: ${input.servicesOffered.trim()}.`,
    ...(outOfScopeItems.length > 0
      ? [`Out of scope: ${outOfScopeItems.join("; ")}.`]
      : []),
    "Never put prices, cost bands, markups, or supplier names in a draft.",
    "Apply these rules before any FIT label.",
    "If location is missing, write NEEDS YOUR CHECK. Do not assume the service area.",
    "If work is close but not in the catalog, write NEEDS YOUR CHECK. Do not mark FIT NO.",
    "Do not send, price, or add a tracker row.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
