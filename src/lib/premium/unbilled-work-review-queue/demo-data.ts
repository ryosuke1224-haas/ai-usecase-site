export const DEMO_PATH = "/blueprints/unbilled-work-review-queue";
export const KIT_PATH = "/blueprints/unbilled-work-review-queue/kit";

export const FICTIONAL_DATA_NOTICE =
  "All jobs, customers, amounts, hours, rates, invoice numbers, and dates on this page are fictional. No real business or customer data is used, and nothing is connected to QuickBooks, Xero, a time tracker, or any other live system.";

export const AS_OF = "2026-05-11";
export const MIN_AMOUNT_DISPLAY = "$150";
export const NEXT_WEEK_AS_OF = "2026-05-18";

export const YOU_CREATE_THE_INVOICE =
  "You create the invoice. Nothing is sent or collected.";
export const DO_NOT_ADD_TAX = "Do not add tax or terms not in the export.";
export const LOGGED_INVOICED_WORK = "Logged invoiced work is not listed again.";

export const OUTLINE_TEXT =
  "Northgate Clinic, J-88, 12 hours at $85, $1,020, date 2026-04-22";

export const JOB_COLUMNS = [
  "job",
  "customer",
  "completed",
  "hours",
  "rate",
  "amount",
  "invoice_id",
  "status",
] as const;

export type JobRow = {
  job: string;
  customer: string;
  completed: string;
  hours: string;
  rate: string;
  amount: string;
  invoiceId: string;
  status: string;
};

export const JOB_ROWS: JobRow[] = [
  {
    job: "J-88",
    customer: "Northgate Clinic",
    completed: "2026-04-22",
    hours: "12",
    rate: "85",
    amount: "1020",
    invoiceId: "",
    status: "completed",
  },
  {
    job: "J-91",
    customer: "Pell & Co",
    completed: "2026-05-01",
    hours: "4",
    rate: "85",
    amount: "340",
    invoiceId: "INV-220",
    status: "invoiced",
  },
  {
    job: "J-70",
    customer: "Harbor Lane",
    completed: "2026-03-15",
    hours: "2",
    rate: "85",
    amount: "170",
    invoiceId: "",
    status: "warranty",
  },
  {
    job: "J-94",
    customer: "Birchwood",
    completed: "2026-05-09",
    hours: "1",
    rate: "85",
    amount: "85",
    invoiceId: "",
    status: "completed",
  },
];

export function jobCells(row: JobRow): string[] {
  return [
    row.job,
    row.customer,
    row.completed,
    row.hours,
    row.rate,
    row.amount,
    row.invoiceId,
    row.status,
  ];
}

export const SAMPLE_JOB_CSV = [
  JOB_COLUMNS.join(","),
  ...JOB_ROWS.map((row) => jobCells(row).join(",")),
].join("\n");

export const QUEUE_COLUMNS = [
  "job",
  "customer",
  "completed",
  "hours",
  "rate",
  "amount",
] as const;

export const QUEUED_ROW = JOB_ROWS[0];

export const CONFIRMED_J88 =
  "J-88 Northgate Clinic, completed 2026-04-22, $1,020 (12 x $85). invoice_id blank; status completed; hours 12; rate 85; amount 1020.";

export const SKIPPED_J91 = "J-91 (invoice_id INV-220 present).";
export const SKIPPED_J70 = "J-70 (status warranty).";
export const SKIPPED_J94 = "J-94 (amount $85 is below your $150 minimum).";
export const SKIPPED_J88_NEXT_WEEK =
  "J-88 (invoice_id INV-241 present; logged as invoiced).";

export const OTHER_SKIP_RULES =
  "Disputed jobs and dates after the as-of date are also skip rules, even when this export has no such row.";

export const NEEDS_YOUR_CHECK_TEXT =
  "none on this export. A row with no customer or rate would be listed here, not outlined.";

export const AI_INTERPRETATION_TEXT =
  "a blank invoice id does not prove the customer was never billed off-export.";

export const RECOMMENDED_ACTION_TEXT = `create, hold, or write off each row in your own invoicing tool. ${YOU_CREATE_THE_INVOICE}`;

export const NUMBER_CHECK = {
  outline: OUTLINE_TEXT,
  rows: [
    { field: "hours", confirmed: "12", exportValue: "12" },
    { field: "rate", confirmed: "$85", exportValue: "85" },
    { field: "amount", confirmed: "$1,020", exportValue: "1020" },
  ],
};

export const BILLING_LOG_COLUMNS = [
  "week_of",
  "job",
  "customer",
  "action_taken",
  "outcome",
  "invoice_id",
  "notes",
] as const;

export type BillingLogRow = {
  weekOf: string;
  job: string;
  customer: string;
  actionTaken: string;
  outcome: string;
  invoiceId: string;
  notes: string;
};

export const BILLING_LOG_ROWS: BillingLogRow[] = [
  {
    weekOf: AS_OF,
    job: "J-88",
    customer: "Northgate Clinic",
    actionTaken: "created",
    outcome: "invoiced",
    invoiceId: "INV-241",
    notes: "",
  },
  {
    weekOf: AS_OF,
    job: "J-91",
    customer: "Pell & Co",
    actionTaken: "skipped",
    outcome: "already_invoiced",
    invoiceId: "INV-220",
    notes: "",
  },
  {
    weekOf: AS_OF,
    job: "J-70",
    customer: "Harbor Lane",
    actionTaken: "skipped",
    outcome: "warranty",
    invoiceId: "",
    notes: "",
  },
  {
    weekOf: AS_OF,
    job: "J-94",
    customer: "Birchwood",
    actionTaken: "skipped",
    outcome: "below_minimum",
    invoiceId: "",
    notes: "",
  },
];

export function billingLogCells(row: BillingLogRow): string[] {
  return [
    row.weekOf,
    row.job,
    row.customer,
    row.actionTaken,
    row.outcome,
    row.invoiceId,
    row.notes,
  ];
}

export const BILLING_LOG_CSV = [
  BILLING_LOG_COLUMNS.join(","),
  ...BILLING_LOG_ROWS.map((row) => billingLogCells(row).join(",")),
].join("\n");
