import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Expense Review Setup Checklist" },
  { id: "ledger-prompt", title: "Recurring Ledger Prompt" },
  { id: "increase-review-prompt", title: "Price Change and Overlap Prompt" },
  { id: "rules-worksheet", title: "Keep List and Overlap Rules Worksheet" },
  { id: "ledger-template", title: "Recurring Ledger Template" },
  { id: "action-review-checklist", title: "Cancel Review Checklist" },
  { id: "sample-exports", title: "Fictional Sample Card Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write the keep list (vendors that must never be flagged for cancel) and overlap-watch categories before any cancel suggestion. You decide which vendors are essential, which categories to watch, and the minimum amount change worth listing.",
  "Export two or three months of card, bank, or accounting transactions as CSV with date, vendor, amount, and the file's date range. QuickBooks is optional only as a CSV export, not a live connection. You decide which columns to keep. Remove card numbers, account numbers, and other columns the workflow does not need.",
  "This is an export review, not a live connector. Atlas does not connect to a card network, bank, QuickBooks, Plaid, or any other vendor.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Recurring Ledger Prompt and your rules from the Keep List and Overlap Rules Worksheet, then attach or paste the CSV.",
  secondaryPromptSetupStep(
    "Price Change and Overlap Prompt",
    "after the recurring ledger is built, to review amount changes and possible overlaps",
  ),
  "Use the Cancel Review Checklist and check every CONFIRMED amount against the export row before touching a vendor account. You cancel in the vendor's own site yourself. The kit changes nothing.",
] as const;

export const RECURRING_LEDGER_PROMPT = `You are helping me build a recurring-charge ledger from a pasted card, bank, or accounting CSV. You prepare; I decide.

Do not invent amounts, vendors, unused subscriptions, or savings totals. Do not claim savings. Do not cancel. You cancel it. The kit changes nothing.

I am pasting:
1. My keep list and overlap-watch rules from the Keep List and Overlap Rules Worksheet.
2. A CSV with date, vendor, amount, and the file's date range.

RECURRING LEDGER FIRST
Write RECURRING LEDGER FIRST before any overlap guess, cancel suggestion, or savings language.
Use the export's own date range, not today's date. If the CSV has no date range, ask me for it before building the ledger.

Group a vendor as recurring only when that exact vendor name appears in at least two months of the export. Show the months.
A charge that appears only once is NOT RECURRING. Show the reason "one charge in the export". Do not call it a subscription.
Skip any vendor on my keep list for cancel review. Show the reason "on your keep list".
If a remaining row is missing date, vendor, or amount, or the same vendor appears twice on the same date with different amounts, do not rank it. List it under NEEDS YOUR CHECK.
Do not claim a tool is unused. If the export has no usage column, write "no usage column in the export" under NEEDS YOUR CHECK.

Label each point as CONFIRMED (from the CSV), AI INTERPRETATION (a possible overlap or unused-tool guess), or RECOMMENDED ACTION.
Leave every change formula visible as text (for example =39.00-29.00).
A later amount that is higher than an earlier amount is a CONFIRMED price change from the CSV. It is not a savings claim.

OUTPUT FORMAT
RECURRING LEDGER FIRST
CONFIRMED: one line per recurring vendor with dates, amounts, and cadence.
NOT RECURRING: one-time charges with the reason.
SKIPPED FOR CANCEL REVIEW: keep-list vendors.
NEEDS YOUR CHECK: missing fields, or "no usage column in the export".
AI INTERPRETATION: a possible overlap only. Never present it as a fact.
RECOMMENDED ACTION (you decide): confirm who uses a possible overlap, keep the vendor, wait, and re-export. Do not cancel.

Do not invent. Do not cancel. Do not claim savings. You cancel it in the vendor's own site yourself, or you decide not to.`;

export const PRICE_CHANGE_OVERLAP_PROMPT = `This prompt is used only after the recurring ledger is built. You prepare; I decide.

Do not invent amounts, unused subscriptions, or savings totals. Do not cancel. You cancel it. The kit changes nothing.

I am pasting the recurring ledger, my keep list, overlap-watch categories, and the minimum amount change to list.

Fill visible change formulas from export amounts only (for example =39.00-29.00).
A later higher amount is a CONFIRMED price change, not a savings figure.
List a price change only when the later amount minus the earlier amount is at least my minimum.
Possible duplicate tools are AI INTERPRETATION. Do not merge similar vendor names. A possible overlap is not proof I can cancel either tool.
Do not treat a price change as money I will get back.

OUTPUT FORMAT
CONFIRMED: each listed price change with the visible formula and result.
AI INTERPRETATION: possible overlap only, labelled as not a savings figure.
RECOMMENDED ACTION (you decide): confirm who uses a possible overlap, keep the vendor, wait, and re-export. Do not cancel. Do not invent unused tools.

Do not invent. Do not cancel. You cancel it in the vendor's own site yourself. The kit changes nothing.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "Recurring vendors appear in at least two months of the export.",
  "One-time charges were listed as NOT RECURRING and were not called subscriptions.",
  "Each CONFIRMED amount matches an export row.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "Possible overlaps are labelled AI INTERPRETATION, not proof two vendors are the same tool.",
  "No savings total was invented from an amount change.",
  "Keep-list vendors were skipped for cancel review.",
  "I will cancel in the vendor's own site myself, or I will decide not to.",
  "I will not cancel from a guess. The kit changes nothing.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload exports. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove card numbers, account numbers, and other columns the workflow does not need.",
  "Do not paste card numbers, bank account numbers, passwords, or tax IDs into the AI tool.",
  "Do not treat a price change as a savings figure, and do not invent a savings total from an amount difference.",
  "Do not claim a tool is unused when the export has no usage column.",
  "Do not cancel a tool from a guess. You cancel in the vendor's own site yourself, or you decide not to.",
  "Nothing is sent, edited, cancelled, or paid automatically. The kit changes nothing.",
  "Atlas does not connect to a card network, bank, QuickBooks, Plaid, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const MINIMUM_AMOUNT_ERROR = "Enter a minimum amount of 0 or more.";

export type ExpenseRulesInput = {
  essentialVendors: string;
  overlapWatch: string;
  minimumAmount: string;
};

export const DEFAULT_RULES_INPUT: ExpenseRulesInput = {
  essentialVendors: "ZoomMeet",
  overlapWatch: "design tools",
  minimumAmount: "5",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parseNonNegativeAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

function linesOf(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function generateExpenseReviewRules(input: ExpenseRulesInput): RulesResult {
  const amount = parseNonNegativeAmount(input.minimumAmount);
  if (amount === null) {
    return { ok: false, errors: [MINIMUM_AMOUNT_ERROR] };
  }

  const vendors = linesOf(input.essentialVendors);
  const categories = linesOf(input.overlapWatch);
  const lines = [
    ...(vendors.length > 0 ? [`Always keep: ${vendors.join("; ")}.`] : []),
    ...(categories.length > 0 ? [`Watch for overlap in: ${categories.join("; ")}.`] : []),
    `List a price change only when the later amount minus the earlier amount is ${amount.toFixed(2)} or more.`,
    "Group a vendor as recurring only when it appears in at least two months.",
    "One-time charges are not subscriptions.",
    "Do not invent savings.",
    "Do not cancel. You cancel it. The kit changes nothing.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
