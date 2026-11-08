export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Silence Queue Setup Checklist" },
  { id: "silence-queue-prompt", title: "Silence Queue Prompt" },
  { id: "next-week-prompt", title: "Week-to-Week Outcome Log Prompt" },
  { id: "rules-worksheet", title: "Silence Threshold and Cadence Worksheet" },
  { id: "outcome-log-template", title: "Outcome Log Template" },
  { id: "follow-up-review-checklist", title: "Follow-up Review Checklist" },
  { id: "sample-proposal-export", title: "Fictional Sample Proposal Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write silence rules and cadence before any queue: silence-if-sent-before date (or days-of-silence threshold), owner minimum amount, statuses that are never chased (default declined, won, on-hold), and the follow-up cadence ladder (for example day 5-11 recap, day 12-20 check-in, day 21+ close-the-loop). You decide the silence date, the minimum, the never-chase statuses, and the cadence steps.",
  "Export sent proposals as CSV with proposal id, customer, amount, sent date, status, last inbound reply date, close date, and one line item, plus the export's as-of date. Open last week's outcome log. You decide which columns to keep. Remove emails, phone numbers, and any columns the workflow does not need. This is an export review, not a live CRM, PandaDoc, DocuSign, email, or spreadsheet connection.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Silence Queue Prompt and your rules from the Silence Threshold and Cadence Worksheet, then attach or paste the export and the outcome log.",
  "AI runs SKIP RULES FIRST. It sets aside declined, won, owner-marked on-hold, already followed up this period per the outcome log, sent dates on or after the silence-if-sent-before date, amounts below the owner's minimum, and rows missing proposal id or amount. Every skipped row is listed with its reason. You decide whether a below-minimum or on-hold proposal should still be reviewed.",
  "AI ranks remaining silent proposals by amount largest first, then by days since sent. Use the Follow-up Review Checklist and check every CONFIRMED number against the export row. You edit and send from your own email, hold, mark lost or declined, or do nothing. The Blueprint never sends and never writes a tracker field. Outcomes (replied, still silent, lost, declined, on hold) go in the outcome log and feed next week's run.",
] as const;

export const SILENCE_QUEUE_PROMPT = `You are helping me build a quiet proposal chase queue from a pasted sent-proposal export and my silence rules. You prepare; I decide.

SKIP RULES FIRST. Apply skip rules before ranking, cadence assignment, or drafting any follow-up. Do not rank first and skip later.

Do not invent an objection, a competitor, a discount, or a deadline. Do not send. Do not write a tracker field. Nothing is sent automatically.

I am pasting:
1. My silence rules from the Silence Threshold and Cadence Worksheet (silence_if_sent_before, owner minimum, never-chase statuses, cadence ladder).
2. A sent-proposal export (proposal id, customer, amount, sent_date, status, last_inbound, close date, line_item, as-of date).
3. Last week's outcome log, if I have one.

RULES
- Write SKIP RULES FIRST at the top.
- Skip any row whose status is declined, won, or on-hold (or any status on my never-chase list). Show the reason status <status>.
- Skip any row already followed up this period per the outcome log. Show the reason already followed up this period.
- Skip any row whose sent_date is on or after my silence_if_sent_before date. Show the reason sent <date> is on or after your silence date <date>.
- Skip any row whose amount is below my minimum. Show the reason amount $<amount> is below your $<minimum> minimum.
- Skip any row missing proposal id or amount. Show the reason missing proposal id or amount under NEEDS YOUR CHECK, not in the queue.
- Rank remaining silent proposals by amount, largest first. If two share an amount, older sent_date first.
- Assign cadence from my written ladder using days since sent as of as_of. Default ladder: 5-11 days recap; 12-20 days check-in; 21+ close-the-loop. Show which bucket matched.
- Drafts may state only proposal id, amount, sent date, and the one line item from the export row. Do not invent an objection, competitor name, discount, urgency deadline, or contact email or phone.
- Silence is CONFIRMED missing inbound reply in the export. It is not proof of interest and not proof the deal is lost. That caution is AI INTERPRETATION.
- The draft is a draft only. Do not send it. Do not edit a CRM or proposal-tracker field. Suggest an outcome-log row; I add it.

OUTPUT FORMAT
SKIP RULES FIRST
QUEUE as of the export as-of date
Ranked silent proposals, largest amount first, with CONFIRMED fields, cadence step, and one follow-up draft each.
SKIPPED: every skipped row with its reason.
AI INTERPRETATION: silence does not prove they will buy or that they said no.
RECOMMENDED ACTION (you decide): edit and send from your own email. You send it. Nothing is sent automatically. Do not invent an objection, a competitor, or a deadline.

Do not invent. Do not send. Nothing is sent automatically.`;

export const NEXT_WEEK_PROMPT = `You are helping me run next week's silence queue using a new export and my outcome log. You prepare; I decide.

Do not send. Do not write a tracker field. Nothing is sent automatically.

I am pasting:
1. My silence rules from the Silence Threshold and Cadence Worksheet.
2. A new sent-proposal export.
3. My current outcome log.

Start from the new export and the current outcome log.
Skip rows whose log outcome is declined, lost, or on_hold.
Keep still_silent and replied rows labelled from the outcome log.
List every skip with its reason.
Do not send. Do not mark anything won or lost for me.

OUTPUT FORMAT
SKIP RULES FIRST using the outcome log and the new export.
SKIPPED: rows with log outcome declined, lost, or on_hold, with the reason.
QUEUE: remaining silent proposals, including still_silent rows with a CONFIRMED note from the log.
RECOMMENDED ACTION (you decide): edit and send from your own email. You send it. Nothing is sent automatically.

Do not send. Nothing is sent automatically.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "SKIP RULES FIRST ran before any ranking, cadence assignment, or follow-up draft.",
  "Every skipped row has a visible reason.",
  "Remaining silent proposals are ranked by amount, then by days since sent.",
  "The cadence step matches my written ladder for days since sent.",
  "CONFIRMED amounts and dates match the export row.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "The draft uses only proposal id, amount, sent date, and one line item from the export.",
  "No objection, competitor, or deadline was invented, and silence was not treated as proof of interest or of a lost deal.",
  "I will send from my own email, or decide not to. You send it. Nothing is sent automatically.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a proposal export. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove emails, phone numbers, and other columns the workflow does not need.",
  "Do not paste account passwords, payment card numbers, or bank details into the AI tool.",
  "Do not invent an objection, competitor, discount, or deadline.",
  "Do not treat silence as proof of interest or of a lost deal.",
  "Do not chase proposals logged as declined, lost, or on-hold.",
  "Nothing is sent automatically. You send it. Nothing is sent automatically.",
  "Atlas does not connect to a CRM, PandaDoc, DocuSign, email, spreadsheet, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const SILENCE_DATE_ERROR = "Enter a silence date (YYYY-MM-DD).";
export const MINIMUM_AMOUNT_ERROR = "Enter a minimum amount of 0 or more.";

export type SilenceRulesInput = {
  silenceIfSentBefore: string;
  ownerMinimum: string;
  neverChaseStatuses: string;
  cadenceLadder: string;
};

export const DEFAULT_RULES_INPUT: SilenceRulesInput = {
  silenceIfSentBefore: "2026-05-13",
  ownerMinimum: "1000",
  neverChaseStatuses: "declined\nwon\non-hold",
  cadenceLadder: "5-11 days recap; 12-20 days check-in; 21+ close-the-loop",
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

function formatSkipStatuses(statuses: string[]): string {
  if (statuses.length === 0) return "";
  if (statuses.length === 1) return `Skip ${statuses[0]}.`;
  if (statuses.length === 2) return `Skip ${statuses[0]} and ${statuses[1]}.`;
  const head = statuses.slice(0, -1).join(", ");
  return `Skip ${head}, and ${statuses[statuses.length - 1]}.`;
}

export function generateSilenceRules(input: SilenceRulesInput): RulesResult {
  const errors: string[] = [];
  const silenceDate = input.silenceIfSentBefore.trim();
  if (!silenceDate) errors.push(SILENCE_DATE_ERROR);

  const amount = parseNonNegativeAmount(input.ownerMinimum);
  if (amount === null) errors.push(MINIMUM_AMOUNT_ERROR);

  if (errors.length > 0 || amount === null || !silenceDate) {
    return { ok: false, errors };
  }

  const neverChase = linesOf(input.neverChaseStatuses);
  const cadence =
    input.cadenceLadder.trim() ||
    "5-11 days recap; 12-20 days check-in; 21+ close-the-loop";

  const lines = [
    ...(neverChase.length > 0 ? [formatSkipStatuses(neverChase)] : []),
    `Skip amounts below $${amount}.`,
    `Skip proposals sent on or after ${silenceDate}.`,
    `Cadence: ${cadence}.`,
    "Rank by amount, then by days since sent.",
    "Drafts may use only proposal id, amount, sent date, and one line item.",
    "Do not invent an objection, a competitor, or a deadline.",
    "Silence does not prove they will buy or that they said no.",
    "You send it. Nothing is sent automatically.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
