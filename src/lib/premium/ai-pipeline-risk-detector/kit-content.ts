import type { UiLocale } from "@/src/lib/i18n/locale";
import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";
import { pipelineCopy } from "./copy";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Stall Queue Setup Checklist" },
  { id: "stall-queue-prompt", title: "Stall Queue Prompt" },
  { id: "next-week-prompt", title: "Week-to-Week Outcome Log Prompt" },
  { id: "rules-worksheet", title: "Stall Limits and Skip Rules Worksheet" },
  { id: "outcome-log-template", title: "Outcome Log Template" },
  { id: "recovery-review-checklist", title: "Recovery Note Review Checklist" },
  { id: "sample-deal-export", title: "Fictional Sample Deal Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write stall limits and skip rules before any queue: days-in-stage limit, days-since-activity limit, owner minimum amount, statuses that are never chased (default closed-won, closed-lost, on-hold), and deals to always skip. You decide the limits, the minimum, and which statuses or deals never enter the chase list.",
  "Export open deals as CSV with deal name, amount, stage, days in current stage, last activity date, next step, close date, and status, plus the export's as-of date. Open last week's outcome log. You decide which columns to keep. Remove emails, phone numbers, and any columns the workflow does not need. This is an export review, not a live HubSpot, Pipedrive, Salesforce, or email connection.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Stall Queue Prompt and your rules from the Stall Limits and Skip Rules Worksheet, then attach or paste the export and the outcome log.",
  "AI runs SKIP RULES FIRST. It sets aside closed-won, closed-lost, owner-marked on-hold, amounts below your minimum, rows missing deal name or amount, and deals on the always-skip list. Every skipped row is listed with its reason. You decide whether a below-minimum or on-hold deal should still be reviewed.",
  "AI applies your stall rules to remaining open rows and ranks stalled deals by amount, largest first. Use the Recovery Note Review Checklist and check every CONFIRMED number against the export row. You edit and send from your own email or update the next step in your own CRM, or decide not to. The Blueprint never sends and never writes a CRM field. Outcomes (moved, still stalled, lost, on hold) go in the outcome log and feed next week's run.",
  secondaryPromptSetupStep(
    "Week-to-Week Outcome Log Prompt",
    "when you run the stall queue again with a new export and your outcome log",
  ),
] as const;

export const STALL_QUEUE_PROMPT = `You are helping me build a stalled deal rescue queue from a pasted open-deals export and my stall rules. You prepare; I decide.

SKIP RULES FIRST. Apply skip rules before stall scoring, ranking, or drafting any recovery note. Do not rank first and skip later.

Do not invent a contact, objection, or deadline. Do not send. Do not write a CRM field. Nothing is sent or written to the CRM.

I am pasting:
1. My stall limits and skip rules from the Stall Limits and Skip Rules Worksheet.
2. An open-deals export (deal name, amount, stage, days_in_stage, last_activity, next_step, close date, status, as-of date).
3. Last week's outcome log, if I have one.

RULES
- Write SKIP RULES FIRST at the top.
- Skip any row whose status is closed-won, closed-lost, or on-hold (or any status on my never-chase list). Show the reason status <status>.
- Skip any row whose amount is below my minimum. Show the reason amount $<amount> is below your $<minimum> minimum.
- Skip any row missing deal name or amount. Show the reason missing deal name or amount under NEEDS YOUR CHECK, not in the queue.
- Skip any deal on my always-skip list. Show the reason on your always-skip list.
- A remaining open deal is stalled when days_in_stage exceeds my stage limit, or last_activity is older than the activity limit as of the export as_of date, or next_step is blank. Show which stall condition matched.
- If a remaining open deal is not stalled under those rules, skip it with the reason not stalled under your rules.
- Rank stalled deals by amount, largest first. If two deals share an amount, older last_activity first.
- Recovery notes may state only deal name, amount, stage, and last activity date from the export row. Do not invent a contact name, email, phone, objection, deadline, or competitor.
- A stall flag is CONFIRMED missing activity or a missing next step in the export. It is not proof the buyer lost interest. That caution is AI INTERPRETATION.
- Do not invent a 0-100 risk score. Use only my written stall rules.
- The draft is a draft only. Do not send it. Do not edit a CRM field. Suggest an outcome-log row; I add it.

OUTPUT FORMAT
SKIP RULES FIRST
STALL QUEUE as of the export as-of date
Ranked stalled deals, largest amount first, with CONFIRMED fields and one recovery note draft each.
SKIPPED: every skipped row with its reason.
AI INTERPRETATION: these rows do not prove the buyer lost interest; they only show missing activity or a missing next step in the export.
RECOMMENDED ACTION (you decide): edit and send from your own email, or update the next step in your CRM yourself. You send it. Nothing is sent or written to the CRM. Do not invent a contact, objection, or deadline.

Do not invent. Do not send. Nothing is sent or written to the CRM.`;

export const NEXT_WEEK_PROMPT = `You are helping me run next week's stall queue using a new export and my outcome log. You prepare; I decide.

Do not send. Do not write a CRM field. Nothing is sent or written to the CRM.

I am pasting:
1. My stall limits and skip rules from the Stall Limits and Skip Rules Worksheet.
2. A new open-deals export.
3. My current outcome log.

Start from the new export and the current outcome log.
Skip rows whose log outcome is lost or on_hold.
Keep still_stalled and moved rows labelled from the outcome log.
List every skip with its reason.
Do not send. Do not mark anything won or lost for me.

OUTPUT FORMAT
SKIP RULES FIRST using the outcome log and the new export.
SKIPPED: rows with log outcome lost or on_hold, with the reason.
QUEUE: remaining stalled deals, including still_stalled rows with a CONFIRMED note from the log.
RECOMMENDED ACTION (you decide): edit and send from your own email, or update the next step in your CRM yourself. You send it. Nothing is sent or written to the CRM.

Do not send. Nothing is sent or written to the CRM.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "SKIP RULES FIRST ran before any stall scoring, ranking, or recovery note.",
  "Every skipped row has a visible reason.",
  "Remaining stalled deals are ranked by amount, largest first.",
  "CONFIRMED amounts and dates match the export row.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "The recovery note uses only deal name, amount, stage, and last activity date from the export.",
  "No contact, objection, or deadline was invented.",
  "A stall flag was not treated as proof the buyer lost interest or the deal is dead.",
  "I will send from my own email or update the next step in my own CRM, or decide not to. You send it. Nothing is sent or written to the CRM.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a deal export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove emails, phone numbers, and other columns the workflow does not need.",
  "Do not paste account passwords, payment card numbers, or bank details into the AI tool.",
  "Do not invent a contact, objection, or deadline.",
  "Do not treat a stall flag as proof the deal is dead or the buyer lost interest.",
  "Do not chase deals logged as lost or on-hold.",
  "Nothing is sent or written to the CRM automatically. You send it. Nothing is sent or written to the CRM.",
  "Atlas does not connect to HubSpot, Pipedrive, Salesforce, email, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const STALL_LIMIT_ERROR = "Enter a stall limit of 1 or more.";
export const MINIMUM_AMOUNT_ERROR = "Enter a minimum amount of 0 or more.";

export type StallRulesInput = {
  daysInStageLimit: string;
  daysSinceActivityLimit: string;
  ownerMinimum: string;
  neverChaseStatuses: string;
  alwaysSkip: string;
};

export const DEFAULT_RULES_INPUT: StallRulesInput = {
  daysInStageLimit: "14",
  daysSinceActivityLimit: "14",
  ownerMinimum: "500",
  neverChaseStatuses: "closed-won\nclosed-lost\non-hold",
  alwaysSkip: "",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parsePositiveLimit(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 1) return null;
  return amount;
}

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

function formatSkipStatuses(statuses: string[]): string {
  if (statuses.length === 0) return "";
  if (statuses.length === 1) return `Skip ${statuses[0]}.`;
  if (statuses.length === 2) return `Skip ${statuses[0]} and ${statuses[1]}.`;
  const head = statuses.slice(0, -1).join(", ");
  return `Skip ${head}, and ${statuses[statuses.length - 1]}.`;
}

export function generateStallRules(
  input: StallRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const ja = locale === "ja" ? pipelineCopy("ja") : null;
  const stageLimit = parsePositiveLimit(input.daysInStageLimit);
  const activityLimit = parsePositiveLimit(input.daysSinceActivityLimit);
  if (stageLimit === null || activityLimit === null) {
    return { ok: false, errors: [ja?.stallLimitError ?? STALL_LIMIT_ERROR] };
  }

  const amount = parseNonNegativeAmount(input.ownerMinimum);
  if (amount === null) {
    return { ok: false, errors: [ja?.minimumAmountError ?? MINIMUM_AMOUNT_ERROR] };
  }

  const neverChase = linesOf(input.neverChaseStatuses);
  const skipList = linesOf(input.alwaysSkip);

  if (ja) {
    return {
      ok: true,
      rules: ja.reviewRules({
        daysInStageLimit: stageLimit,
        daysSinceActivityLimit: activityLimit,
        ownerMinimum: amount,
        neverChaseStatuses: neverChase,
        alwaysSkip: skipList,
      }),
    };
  }

  const lines = [
    ...(neverChase.length > 0 ? [formatSkipStatuses(neverChase)] : []),
    `Skip amounts below $${amount}.`,
    ...skipList.map((name) => `Always skip: ${name}`),
    `A deal is stalled when days_in_stage exceeds ${stageLimit}, or last_activity is older than ${activityLimit} days before as_of, or next_step is blank.`,
    "Rank stalled deals by amount, largest first.",
    "Recovery notes may use only deal name, amount, stage, and last activity date.",
    "Do not invent a contact, objection, or deadline.",
    "A stall flag does not prove the buyer lost interest.",
    "You send it. Nothing is sent or written to the CRM.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
