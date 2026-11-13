import type { UiLocale } from "@/src/lib/i18n/locale";
import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";
import { unbilledCopy } from "./copy";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Unbilled Work Setup Checklist" },
  { id: "queue-prompt", title: "Unbilled Queue Prompt" },
  { id: "next-week-prompt", title: "Week-to-Week Billing Log Prompt" },
  { id: "rules-worksheet", title: "Skip Rules and Minimum Worksheet" },
  { id: "billing-log-template", title: "Billing Log Template" },
  { id: "outline-review-checklist", title: "Invoice Outline Review Checklist" },
  { id: "sample-job-export", title: "Fictional Sample Job Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write skip rules before any outline: the minimum amount to bill, statuses that are never billed (default warranty, plus owner-marked write-off), and jobs or customers to always skip. You decide the minimum, which statuses are never billed, and which jobs or customers are always skipped.",
  "Export completed jobs or time entries as CSV with job or entry id, customer, completion date, hours, rate, amount, invoice status, invoice id if any, and the export's as-of date. Open last week's billing log. You decide which columns to keep. Remove emails, phone numbers, and any columns the workflow does not need. This is an export review, not a live QuickBooks, Xero, time-tracker, or invoicing-tool connection.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Unbilled Queue Prompt and your rules from the Skip Rules and Minimum Worksheet, then attach or paste the export and the billing log.",
  "AI runs SKIP RULES FIRST. It sets aside already-invoiced rows (invoice id present), warranty or write-off statuses, amounts below your minimum, dates after the as-of date, and disputed jobs. Every skipped row is listed with its reason. You decide whether a warranty, write-off, or disputed row should still be billed.",
  "Use the Invoice Outline Review Checklist and check every CONFIRMED number against the export row. You create, hold, or write off each row in your own invoicing tool. The Blueprint never sends an invoice, records a payment, or edits QuickBooks or Xero. Outcomes (invoiced, hold, write-off) go in the billing log and feed next week's run.",
  secondaryPromptSetupStep(
    "Week-to-Week Billing Log Prompt",
    "when you run the queue again with a new export and your billing log",
  ),
] as const;

export const QUEUE_PROMPT = `You are helping me build an unbilled work review queue from a pasted job or time-entry export and my skip rules. You prepare; I decide.

SKIP RULES FIRST. Apply skip rules before ranking or drafting any invoice outline. Do not rank first and skip later.

Do not invent tax, terms, or line items. Do not add tax or terms not in the export. Do not send an invoice. Do not create the invoice. Do not record a payment. Nothing is sent or collected.

I am pasting:
1. My skip rules from the Skip Rules and Minimum Worksheet.
2. A completed-job or time-entry export (job or entry id, customer, date completed, hours, rate, amount, invoice status, invoice_id, as-of date).
3. Last week's billing log, if I have one.

RULES
- Write SKIP RULES FIRST at the top.
- Skip any row whose invoice_id is present. Show the reason invoice_id <id> present.
- Skip any row whose status is in my never-billed list (default warranty, plus owner-marked write-off). Show the reason status <status>.
- Skip any row whose amount (or hours x my rate) is below my minimum. Show the reason amount $<amount> is below your $<minimum> minimum.
- Skip any row whose completed date is after the export as-of date. Show the reason completed after as-of date.
- Skip any row marked disputed in the export or the billing log. Show the reason disputed; needs your decision.
- Skip any job or customer on my always-skip list. Show the reason on your always-skip list.
- If a remaining row is missing job id, customer, or both hours-and-rate and amount, do not outline it. List it under NEEDS YOUR CHECK.
- If amount is missing and hours and rate are present, compute amount as hours x rate and label the product CONFIRMED from those export fields. If rate is missing, write NEEDS YOUR CHECK. Do not invent a rate.
- Rank remaining unbilled rows by oldest completion date first. If two rows share a completion date, larger amount first.
- Invoice outlines may state only customer, job or entry id, completed date, hours, rate, and amount from the export row.
- A blank invoice id is CONFIRMED as blank. It is not proof the customer was never billed off-export. That caution is AI INTERPRETATION.
- The outline is a draft only. Do not send it. Do not create the invoice. Do not record a payment. Suggest a billing-log row; I add it.

OUTPUT FORMAT
SKIP RULES FIRST
UNBILLED QUEUE as of the export as-of date
Ranked remaining rows, oldest first, with CONFIRMED fields and an invoice outline.
SKIPPED: every skipped row with its reason.
NEEDS YOUR CHECK: missing fields. A row with no customer or rate is listed here, not outlined.
AI INTERPRETATION: a blank invoice id does not prove the customer was never billed off-export.
RECOMMENDED ACTION (you decide): create, hold, or write off each row in your own invoicing tool. You create the invoice. Nothing is sent or collected.

Do not invent. Do not add tax. Do not send. Nothing is sent or collected.`;

export const NEXT_WEEK_PROMPT = `You are helping me run next week's unbilled queue using a new export and my billing log. You prepare; I decide.

Do not send an invoice. Do not create the invoice. Do not record a payment. Nothing is sent or collected.

I am pasting:
1. My skip rules from the Skip Rules and Minimum Worksheet.
2. A new completed-job or time-entry export with invoice_id if any.
3. My current billing log.

Start from the new export and the current billing log.
Skip rows whose log outcome is invoiced or write-off, or whose invoice_id is now present.
Keep hold rows in the queue with a CONFIRMED note from the log.
List every skip with its reason.
Do not send. Do not mark anything paid.

OUTPUT FORMAT
SKIP RULES FIRST using the billing log and the new export.
SKIPPED: rows with invoice_id present, or log outcome invoiced or write-off, with the reason.
QUEUE: remaining unbilled rows, including hold rows with a CONFIRMED note from the log.
RECOMMENDED ACTION (you decide): create, hold, or write off in your own invoicing tool. You create the invoice. Nothing is sent or collected.

Do not send. Nothing is sent or collected.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "SKIP RULES FIRST ran before any ranking or invoice outline.",
  "Every skipped row has a visible reason.",
  "Remaining unbilled rows are ranked by oldest completion date first.",
  "CONFIRMED hours, rate, and amount match the export row.",
  "CONFIRMED, NEEDS YOUR CHECK, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "The invoice outline uses only customer, id, date, hours, rate, and amount from the export.",
  "Tax and terms were not invented.",
  "A blank invoice id was not treated as proof the customer was never billed off-export.",
  "I will create, hold, or write off each row in my own invoicing tool. You create the invoice. Nothing is sent or collected.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a job or billing export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove emails, phone numbers, and other columns the workflow does not need.",
  "Do not paste bank account numbers, card numbers, or tax IDs into the AI tool.",
  "Do not invent tax or terms.",
  "Do not bill warranty or included-rework without an owner decision.",
  "Do not treat a blank invoice id as proof the customer was never billed off-export.",
  "Nothing is sent, collected, or marked paid automatically. You create the invoice. Nothing is sent or collected.",
  "Atlas does not connect to QuickBooks, Xero, a time tracker, an invoicing tool, email, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const MINIMUM_AMOUNT_ERROR = "Enter a minimum amount of 0 or more.";

export type UnbilledRulesInput = {
  minimumAmount: string;
  neverBilledStatuses: string;
  alwaysSkip: string;
};

export const DEFAULT_RULES_INPUT: UnbilledRulesInput = {
  minimumAmount: "150",
  neverBilledStatuses: "warranty",
  alwaysSkip: "",
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

export function generateUnbilledSkipRules(
  input: UnbilledRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const amount = parseNonNegativeAmount(input.minimumAmount);
  if (amount === null) {
    return {
      ok: false,
      errors: [locale === "ja" ? unbilledCopy("ja").minimumAmountError : MINIMUM_AMOUNT_ERROR],
    };
  }

  const neverBilled = linesOf(input.neverBilledStatuses);
  const skipList = linesOf(input.alwaysSkip);
  if (locale === "ja") {
    return {
      ok: true,
      rules: unbilledCopy("ja").reviewRules({
        minimumAmount: String(amount),
        neverBilled,
        alwaysSkip: skipList,
      }),
    };
  }

  const lines = [
    "Skip when invoice_id is present.",
    ...(neverBilled.length > 0
      ? [`Never bill statuses: ${neverBilled.join("; ")}.`]
      : []),
    `Skip amounts below $${amount}.`,
    "Skip dates after the as-of date.",
    "Skip disputed jobs.",
    ...skipList.map((name) => `Always skip: ${name}`),
    "Rank remaining rows by oldest completion date first.",
    "Invoice outline uses only customer, id, date, hours, rate, and amount from the export.",
    "Do not invent tax, terms, or line items.",
    "A blank invoice id is not proof the customer was never billed off-export.",
    "You create the invoice. Nothing is sent or collected.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
