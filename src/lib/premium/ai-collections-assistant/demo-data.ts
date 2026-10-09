export const COLLECTIONS_DEMO_PATH = "/blueprints/ai-collections-assistant";
export const COLLECTIONS_KIT_PATH = "/blueprints/ai-collections-assistant/kit";

export const FICTIONAL_DATA_NOTICE =
  "All invoices, customers, amounts, and dates on this page are fictional. No real business or customer data is used, and nothing is connected to an accounting system or email account.";

export const AS_OF_DATE = "2026-06-08";
export const NEXT_WEEK_AS_OF_DATE = "2026-06-15";
export const OWNER_MINIMUM = 150;

export const TONE_LADDER = [
  { tone: "friendly", label: "friendly 1-14 days" },
  { tone: "firm", label: "firm 15-44 days" },
  { tone: "phone call recommended", label: "phone call recommended 45+ days" },
] as const;

export type Tone = (typeof TONE_LADDER)[number]["tone"];

export type AgingRow = {
  invoice: string;
  customer: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: string;
  notes: string;
};

export const AGING_COLUMNS = [
  "invoice",
  "customer",
  "amount",
  "due_date",
  "days_overdue",
  "status",
  "notes",
] as const;

/** Fictional export, in the order the accounting tool produced it. */
export const SAMPLE_AGING_ROWS: AgingRow[] = [
  { invoice: "INV-3307", customer: "Cedar Row Vet", amount: 3900, dueDate: "2026-05-01", daysOverdue: 38, status: "open", notes: "" },
  { invoice: "INV-3312", customer: "Mill St Bakery", amount: 640, dueDate: "2026-05-20", daysOverdue: 19, status: "open", notes: "promised 2026-06-12" },
  { invoice: "INV-3290", customer: "Tallis Fitness", amount: 1750, dueDate: "2026-04-10", daysOverdue: 59, status: "disputed", notes: "" },
  { invoice: "INV-3315", customer: "Orchard Dental", amount: 2480, dueDate: "2026-05-28", daysOverdue: 11, status: "open", notes: "" },
  { invoice: "INV-3281", customer: "Harbor Lane Physio", amount: 1200, dueDate: "2026-04-15", daysOverdue: 54, status: "open", notes: "" },
  { invoice: "INV-3309", customer: "Birchwood Signs", amount: 860, dueDate: "2026-05-11", daysOverdue: 28, status: "open", notes: "" },
  { invoice: "INV-3318", customer: "Lumen Studio", amount: 420, dueDate: "2026-06-01", daysOverdue: 7, status: "open", notes: "" },
  { invoice: "INV-3301", customer: "Quarry Hill Landscaping", amount: 5200, dueDate: "2026-04-24", daysOverdue: 45, status: "open", notes: "" },
];

export const SAMPLE_AGING_CSV = [
  AGING_COLUMNS.join(","),
  ...SAMPLE_AGING_ROWS.map((row) =>
    [
      row.invoice,
      row.customer,
      row.amount,
      row.dueDate,
      row.daysOverdue,
      row.status,
      row.notes,
    ].join(","),
  ),
].join("\n");

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export const SKIP_RULES = [
  "Disputed in the export or the latest outcome-log entry: skip with the reason 'disputed; needs your decision'.",
  "Credit memo, or a zero or negative amount: skip with the reason 'credit memo or non-positive amount'.",
  "On a payment plan in the export or the outcome log: skip with the reason 'on a payment plan'.",
  "Promised payment date on or after the as-of date: skip with the reason 'payment promised for <date>; re-check after that date'.",
  `Amount below your minimum: skip with the reason 'below your minimum of ${formatUsd(OWNER_MINIMUM)}'.`,
] as const;

export type SkippedInvoice = {
  invoice: string;
  customer: string;
  amount: number;
  reason: string;
};

export const SKIPPED_INVOICES: SkippedInvoice[] = [
  {
    invoice: "INV-3312",
    customer: "Mill St Bakery",
    amount: 640,
    reason: "payment promised for 2026-06-12; re-check after that date",
  },
  {
    invoice: "INV-3290",
    customer: "Tallis Fitness",
    amount: 1750,
    reason: "disputed; needs your decision",
  },
];

export type QueuedInvoice = {
  invoice: string;
  customer: string;
  amount: number;
  daysOverdue: number;
  confirmed: string;
  tone: Tone;
  messageKind: "Call note" | "Draft";
  message: string;
};

export const RANKED_QUEUE: QueuedInvoice[] = [
  {
    invoice: "INV-3301",
    customer: "Quarry Hill Landscaping",
    amount: 5200,
    daysOverdue: 45,
    confirmed: "open, no promise recorded.",
    tone: "phone call recommended",
    messageKind: "Call note",
    message:
      "Calling about invoice INV-3301 for $5,200, due April 24. When can we expect payment?",
  },
  {
    invoice: "INV-3281",
    customer: "Harbor Lane Physio",
    amount: 1200,
    daysOverdue: 54,
    confirmed: "open, no promise recorded.",
    tone: "phone call recommended",
    messageKind: "Call note",
    message:
      "Calling about invoice INV-3281 for $1,200, due April 15. When can we expect payment?",
  },
  {
    invoice: "INV-3307",
    customer: "Cedar Row Vet",
    amount: 3900,
    daysOverdue: 38,
    confirmed: "open, no promise recorded.",
    tone: "firm",
    messageKind: "Draft",
    message:
      "Invoice INV-3307 for $3,900 was due on May 1. Could you confirm when payment will be sent?",
  },
  {
    invoice: "INV-3309",
    customer: "Birchwood Signs",
    amount: 860,
    daysOverdue: 28,
    confirmed: "open, no promise recorded.",
    tone: "firm",
    messageKind: "Draft",
    message:
      "Invoice INV-3309 for $860 was due on May 11. Could you confirm when payment will be sent?",
  },
  {
    invoice: "INV-3315",
    customer: "Orchard Dental",
    amount: 2480,
    daysOverdue: 11,
    confirmed: "open.",
    tone: "friendly",
    messageKind: "Draft",
    message: "A quick reminder that INV-3315 for $2,480 was due May 28.",
  },
  {
    invoice: "INV-3318",
    customer: "Lumen Studio",
    amount: 420,
    daysOverdue: 7,
    confirmed: "open.",
    tone: "friendly",
    messageKind: "Draft",
    message: "A quick reminder that INV-3318 for $420 was due June 1.",
  },
];

export const AI_INTERPRETATION_TEXT =
  "none; no payment history was provided, so ranking uses age band and amount only.";

export const RECOMMENDED_ACTION_TEXT =
  "Check each draft against its export row, choose the recipient from your own contacts, edit, and send from your own email or make the call yourself. Nothing is sent automatically.";

export const DRAFT_CHECK = {
  invoice: "INV-3307",
  tone: "firm" as Tone,
  draft:
    "Invoice INV-3307 for $3,900 was due on May 1. Could you confirm when payment will be sent?",
  rows: [
    { field: "Invoice number", inDraft: "INV-3307", inExport: "INV-3307" },
    { field: "Amount", inDraft: "$3,900", inExport: "3900" },
    { field: "Due date", inDraft: "May 1", inExport: "2026-05-01" },
  ],
};

export type OutcomeLogRow = {
  weekOf: string;
  invoice: string;
  customer: string;
  actionTaken: string;
  outcome: string;
  promisedDate: string;
  notes: string;
};

export const OUTCOME_LOG_COLUMNS = [
  "week_of",
  "invoice",
  "customer",
  "action_taken",
  "outcome",
  "promised_date",
  "notes",
] as const;

export const ALLOWED_OUTCOMES = [
  "paid",
  "promised",
  "disputed",
  "payment plan",
  "no reply",
] as const;

/** Fictional outcomes entered by the owner after the week of 2026-06-08. */
export const SAMPLE_OUTCOME_LOG: OutcomeLogRow[] = [
  { weekOf: AS_OF_DATE, invoice: "INV-3301", customer: "Quarry Hill Landscaping", actionTaken: "called", outcome: "no reply", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3281", customer: "Harbor Lane Physio", actionTaken: "called", outcome: "no reply", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3307", customer: "Cedar Row Vet", actionTaken: "emailed", outcome: "promised", promisedDate: "2026-06-19", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3309", customer: "Birchwood Signs", actionTaken: "emailed", outcome: "no reply", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3315", customer: "Orchard Dental", actionTaken: "emailed", outcome: "paid", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3318", customer: "Lumen Studio", actionTaken: "emailed", outcome: "no reply", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3312", customer: "Mill St Bakery", actionTaken: "skipped", outcome: "paid", promisedDate: "", notes: "" },
  { weekOf: AS_OF_DATE, invoice: "INV-3290", customer: "Tallis Fitness", actionTaken: "skipped", outcome: "disputed", promisedDate: "", notes: "" },
];

/** Header only. Copying this starts a blank log and does not include fictional rows. */
export const OUTCOME_LOG_TEMPLATE_CSV = OUTCOME_LOG_COLUMNS.join(",");

export const NEXT_WEEK_QUEUE: { invoice: string; daysOverdue: number; tone: Tone }[] = [
  { invoice: "INV-3301", daysOverdue: 52, tone: "phone call recommended" },
  { invoice: "INV-3281", daysOverdue: 61, tone: "phone call recommended" },
  { invoice: "INV-3309", daysOverdue: 35, tone: "firm" },
  { invoice: "INV-3318", daysOverdue: 14, tone: "friendly" },
];

export const NEXT_WEEK_SKIPPED: { invoice: string; reason: string }[] = [
  {
    invoice: "INV-3307",
    reason: "payment promised for 2026-06-19; date has not passed",
  },
  { invoice: "INV-3290", reason: "still disputed; needs your decision" },
];

export const NEXT_WEEK_REMOVED = {
  invoices: ["INV-3315", "INV-3312"],
  reason: "logged as paid",
};
