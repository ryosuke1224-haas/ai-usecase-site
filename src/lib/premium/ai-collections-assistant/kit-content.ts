export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Weekly Collections Setup Checklist" },
  { id: "queue-prompt", title: "Weekly Collections Queue Prompt" },
  { id: "next-week-prompt", title: "Week-to-Week Update Prompt" },
  { id: "rules-worksheet", title: "Skip Rules and Tone Ladder Worksheet" },
  { id: "outcome-log-template", title: "Outcome Log Template" },
  { id: "draft-review-checklist", title: "Draft Review Checklist" },
  { id: "sample-aging-report", title: "Fictional Sample Aging Report" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Export the overdue invoices as CSV from QuickBooks, Xero, or your invoicing tool, and write down the export's as-of date. The columns you need are invoice, customer, amount, and due_date. Add days_overdue when your tool already calculates it. A simple export with those four columns is enough to start.",
  "Add status and notes only when you already know them. Use status for an invoice you know is disputed or on a payment plan, and notes for a promised date the customer gave you. If those columns are missing, leave them blank. Do not invent a dispute, a promise, or a payment status. After you follow up, record what happened in the outcome log.",
  "Remove columns the workflow does not need, such as contact emails, phone numbers, addresses, and any bank or card details.",
  "Open last week's outcome log, or start one from the Outcome Log Template. Make sure every outcome from last week is recorded: paid, promised with a date, disputed, payment plan, or no reply.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you upload anything. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Set your minimum amount, tone ladder, and always-skip customers in the Skip Rules and Tone Ladder Worksheet, then copy the rules block.",
  "Paste the Weekly Collections Queue Prompt and your rules block into your AI tool, then attach or paste the export and the outcome log.",
  "Check every draft against its export row with the Draft Review Checklist. Choose the recipient from your own contacts and send from your own email, or make the call yourself. Nothing is sent automatically.",
  "Record each outcome in the outcome log. Next week, use the Week-to-Week Update Prompt with the new export and the updated log.",
] as const;

export const QUEUE_PROMPT = `You are helping me prepare this week's collections queue. You prepare; I decide. Do not send, schedule, or queue any email, text, or call.

I am attaching or pasting:
1. My overdue-invoice aging report. Required columns: invoice, customer, amount, and due_date, plus the export's as-of date. days_overdue, status, and notes may be blank.
2. My collections rules: minimum amount, tone ladder, and customers to always skip.
3. Last week's outcome log, if I have one.

STEP 1 - CHECK THE DATA
- Compute days overdue from the export's as-of date, not today's date. If there is no as-of date, stop and ask me for it.
- If a row is missing its invoice number, amount, or due date, or the same invoice number appears twice, do not draft it. List it under NEEDS YOUR CHECK.
- If status or notes are blank, do not invent a dispute, a promised date, or a payment status. Treat the invoice as open unless my outcome log says otherwise.

STEP 2 - SKIP RULES
Apply the skip rules before ranking or drafting. Skipped invoices are never ranked or drafted. List every skipped invoice as:
SKIPPED: <invoice> (<reason>)
Use these reasons:
- Status or latest outcome-log entry is disputed: "disputed; needs your decision". Keep it skipped until I mark it resolved in the outcome log.
- Credit memo, or a zero or negative amount: "credit memo or non-positive amount".
- On a payment plan in the export or the outcome log: "on a payment plan".
- Promised payment date on or after the as-of date: "payment promised for <date>; re-check after that date".
- Amount below my minimum: "below your minimum of $<minimum>".
- Customer on my always-skip list: "on your always-skip list".
If a promised date is before the as-of date and the invoice is still open, return it to the queue with the note "CONFIRMED: promise of <date> missed".

STEP 3 - RANK
Rank the remaining invoices by age band, oldest band first, using the bands in my tone ladder. Within a band, rank by amount, largest first, then by earlier due date. Use the customer's usual payment pattern only as a tie-breaker, only if I provided payment history, and label it AI INTERPRETATION.

STEP 4 - TONE AND DRAFT
Assign each invoice a tone strictly from my tone ladder. Invoices in the phone call band get a short call note instead of an email draft.
Use only the invoice number, amount, and due date from the export row in each draft or call note.
Do not invent payment history, contact names, late fees, interest, or deadlines.
Never threaten legal action, collections agencies, credit reporting, or service suspension.
If a customer has more than one invoice in the queue, list them together and suggest one combined message. I decide whether to combine them.
Do not choose a recipient or include an email address.

OUTPUT FORMAT
QUEUE as of <as-of date> (<number> to chase, <number> skipped)
For each invoice, in order:
<rank>. <invoice>, <customer>, <amount>, <days> days overdue.
CONFIRMED: <status and any promise or outcome from the export or log>
Tone: <tone>
Draft or call note: <text>
Then:
SKIPPED: one line per skipped invoice with its reason.
NEEDS YOUR CHECK: any rows you could not use, or "none".
AI INTERPRETATION: any inference you made, or "none; no payment history was provided".
RECOMMENDED ACTION: what I should check before I send anything myself.

Label CONFIRMED facts, AI INTERPRETATION, and RECOMMENDED ACTION separately. Do not present a guess as a fact. Do not send anything. I will check every number against the export row, choose the recipient, and send from my own email or make the call myself.`;

export const NEXT_WEEK_PROMPT = `This is the week-to-week update for my collections queue. You prepare; I decide. Do not send, schedule, or queue any email, text, or call.

I am attaching or pasting this week's aging report export with its as-of date, my collections rules, and the outcome log I updated after last week's run. The outcome log has the columns week_of, invoice, customer, action_taken, outcome, promised_date, notes. Only I record outcomes. Treat the outcome log as what I entered; do not correct or extend it.

Before building the queue:
1. Match each outcome log entry to the new export by invoice number.
2. Paid: if the invoice is no longer in the export, list it under REMOVED. If the log says paid but the invoice is still open in the export, do not draft it; list it under NEEDS YOUR CHECK.
3. Disputed: keep the invoice skipped with the reason "disputed; needs your decision" until I mark it resolved in the outcome log.
4. Payment plan: keep the invoice skipped with the reason "on a payment plan".
5. Promised: if the promised date is on or after the new as-of date, skip the invoice with the reason "payment promised for <date>; re-check after that date".
6. Missed promise: if the promised date is before the new as-of date and the invoice is still open, return it to the queue and state "CONFIRMED: promise of <date> missed (from your outcome log)".
7. Recompute days overdue from the new as-of date, not today's date.

Then apply my collections rules: apply the skip rules before ranking, rank by age band and then by amount, assign tone from my tone ladder, and use only the invoice number, amount, and due date from the export row in each draft or call note. Never threaten legal action. Do not invent payment history, contact names, fees, interest, or deadlines.

OUTPUT FORMAT
QUEUE as of <new as-of date>
<rank>. <invoice>, <days> days overdue, <tone>. CONFIRMED: <facts from the export or log>. Draft or call note: <text>
SKIPPED: <invoice> (<reason>)
REMOVED: <invoice> (logged as paid and no longer in the export)
NEEDS YOUR CHECK: rows where the export and the outcome log disagree, or "none".
AI INTERPRETATION: any inference you made, or "none".
RECOMMENDED ACTION: what I should check before I send anything myself.

Do not send anything. Do not change my outcome log. I decide whether a dispute is resolved, whether to accept a new promise, and whether any message is sent.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "The invoice number in the draft matches the export row.",
  "The amount in the draft matches the export row.",
  "The due date in the draft matches the export row.",
  "I chose the recipient myself from my own contacts.",
  "The invoice is not disputed, promised, or on a payment plan in the export or the outcome log.",
  "The tone matches the invoice's age band on my tone ladder.",
  "The draft does not threaten legal action, collections agencies, credit reporting, or service suspension.",
  "The draft mentions no fees, interest, or deadlines that the export does not contain.",
  "The draft invents no facts, payment history, or contact names.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you upload or paste any customer data.",
  "Check what your own AI plan allows before you rely on file upload. Atlas does not claim that any plan includes a specific capability, and Atlas does not include third-party AI fees.",
  "Remove columns the workflow does not need, such as contact emails, phone numbers, and addresses.",
  "Do not paste bank account numbers, card numbers, or tax IDs into the AI tool.",
  "Drafts never threaten legal action, collections agencies, credit reporting, or service suspension.",
  "Drafts never mention fees or interest that the export does not contain.",
  "Disputed, promised, and payment-plan invoices are skipped with a visible reason so they are not chased by mistake.",
  "Nothing is sent, edited, cancelled, refunded, or paid automatically. You choose the recipient and send each message from your own email, or make the call yourself.",
  "Atlas does not connect to QuickBooks, Xero, an invoicing tool, or email, and it does not upload your data anywhere.",
] as const;

export type RulesInput = {
  minimum: string;
  friendlyLimit: string;
  firmLimit: string;
  alwaysSkip: string;
};

export const DEFAULT_RULES_INPUT: RulesInput = {
  minimum: "150",
  friendlyLimit: "14",
  firmLimit: "44",
  alwaysSkip: "",
};

export const RULES_ERRORS = {
  minimum: "Enter a minimum amount of 0 or more.",
  wholeDays: "Enter tone limits as whole numbers of days, 1 or more.",
  order: "Friendly limit must be lower than the firm limit.",
} as const;

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parseWholeDays(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const days = Number(trimmed);
  return days >= 1 ? days : null;
}

export function generateCollectionsRules(input: RulesInput): RulesResult {
  const errors: string[] = [];

  const minimumText = input.minimum.trim();
  const minimum = minimumText === "" ? Number.NaN : Number(minimumText);
  if (!Number.isFinite(minimum) || minimum < 0) {
    errors.push(RULES_ERRORS.minimum);
  }

  const friendly = parseWholeDays(input.friendlyLimit);
  const firm = parseWholeDays(input.firmLimit);
  if (friendly === null || firm === null) {
    errors.push(RULES_ERRORS.wholeDays);
  } else if (friendly >= firm) {
    errors.push(RULES_ERRORS.order);
  }

  if (errors.length > 0 || friendly === null || firm === null) {
    return { ok: false, errors };
  }

  const skipCustomers = input.alwaysSkip
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const minimumLabel = `$${minimum.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  const lines = [
    "MY COLLECTIONS RULES",
    minimum > 0
      ? `Skip invoices under ${minimumLabel}.`
      : "No minimum amount. Consider every invoice with a positive amount.",
    "Skip disputed invoices, credit memos, zero or negative amounts, and invoices on a payment plan.",
    "Skip invoices with a promised payment date on or after the as-of date.",
    ...skipCustomers.map((name) => `Always skip: ${name}`),
    "Tone ladder:",
    `- Friendly: 1-${friendly} days`,
    `- Firm: ${friendly + 1}-${firm} days`,
    `- Phone call recommended: ${firm + 1}+ days`,
    "Never threaten legal action.",
    "Do not mention fees or interest that the export does not contain.",
    "Do not send anything.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
