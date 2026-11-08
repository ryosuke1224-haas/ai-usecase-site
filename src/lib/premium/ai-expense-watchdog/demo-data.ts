export const DEMO_PATH = "/blueprints/ai-expense-watchdog";
export const KIT_PATH = "/blueprints/ai-expense-watchdog/kit";

export const FICTIONAL_DATA_NOTICE =
  "All vendors, amounts, and dates on this page are fictional. No real business data is used, and nothing is connected to a card network, bank, QuickBooks, Plaid, or any other live system.";

export const AS_OF = "2026-09-30";
export const EXPORT_RANGE = "2026-07-01 to 2026-09-30";
export const KEEP_LIST = "ZoomMeet";
export const OVERLAP_WATCH = "design tools";
export const MINIMUM_CHANGE = "5.00";

export const YOU_CANCEL_IT = "You cancel it. The kit changes nothing.";
export const DO_NOT_CANCEL_FROM_A_GUESS = "Do not cancel from a guess.";
export const NO_NEW_EXPORT = "No new export was provided.";
export const RERUN_SENTENCE =
  "Re-run next month with a new export. Do not cancel from a guess.";
export const NO_USAGE_COLUMN = "no usage column in the export";

export const EXPORT_COLUMNS = ["date", "vendor", "amount", "source"] as const;

export type ExportRow = {
  date: string;
  vendor: string;
  amount: string;
  source: string;
};

export const EXPORT_ROWS: ExportRow[] = [
  { date: "2026-07-03", vendor: "DesignHub Pro", amount: "29.00", source: "card" },
  { date: "2026-07-11", vendor: "CanvaLite Teams", amount: "30.00", source: "card" },
  { date: "2026-07-15", vendor: "ZoomMeet", amount: "15.99", source: "card" },
  { date: "2026-08-03", vendor: "DesignHub Pro", amount: "39.00", source: "card" },
  { date: "2026-08-11", vendor: "CanvaLite Teams", amount: "30.00", source: "card" },
  { date: "2026-08-15", vendor: "ZoomMeet", amount: "15.99", source: "card" },
  { date: "2026-08-22", vendor: "Harbor Office Supply", amount: "84.00", source: "card" },
  { date: "2026-09-03", vendor: "DesignHub Pro", amount: "39.00", source: "card" },
  { date: "2026-09-11", vendor: "CanvaLite Teams", amount: "30.00", source: "card" },
  { date: "2026-09-15", vendor: "ZoomMeet", amount: "15.99", source: "card" },
];

export const SAMPLE_EXPORT_CSV = [
  EXPORT_COLUMNS.join(","),
  ...EXPORT_ROWS.map((row) => [row.date, row.vendor, row.amount, row.source].join(",")),
].join("\n");

export const LEDGER_COLUMNS = [
  "vendor",
  "jul",
  "aug",
  "sep",
  "cadence",
  "change_formula",
  "change_result",
  "keep_list",
] as const;

export type LedgerRow = {
  vendor: string;
  jul: string;
  aug: string;
  sep: string;
  cadence: string;
  changeFormula: string;
  changeResult: string;
  keepList: string;
};

export const LEDGER_ROWS: LedgerRow[] = [
  {
    vendor: "DesignHub Pro",
    jul: "29.00",
    aug: "39.00",
    sep: "39.00",
    cadence: "monthly",
    changeFormula: "=39.00-29.00",
    changeResult: "10.00",
    keepList: "no",
  },
  {
    vendor: "CanvaLite Teams",
    jul: "30.00",
    aug: "30.00",
    sep: "30.00",
    cadence: "monthly",
    changeFormula: "=30.00-30.00",
    changeResult: "0.00",
    keepList: "no",
  },
  {
    vendor: "ZoomMeet",
    jul: "15.99",
    aug: "15.99",
    sep: "15.99",
    cadence: "monthly",
    changeFormula: "=15.99-15.99",
    changeResult: "0.00",
    keepList: "yes",
  },
];

export function ledgerCells(row: LedgerRow): string[] {
  return [
    row.vendor,
    row.jul,
    row.aug,
    row.sep,
    row.cadence,
    row.changeFormula,
    row.changeResult,
    row.keepList,
  ];
}

export const LEDGER_CSV = [
  LEDGER_COLUMNS.join(","),
  ...LEDGER_ROWS.map((row) => ledgerCells(row).join(",")),
].join("\n");

export const RECURRING_VENDORS = [
  {
    vendor: "DesignHub Pro",
    confirmed:
      "DesignHub Pro appears on 2026-07-03 (29.00), 2026-08-03 (39.00), and 2026-09-03 (39.00). Cadence: monthly.",
  },
  {
    vendor: "CanvaLite Teams",
    confirmed:
      "CanvaLite Teams appears on 2026-07-11 (30.00), 2026-08-11 (30.00), and 2026-09-11 (30.00). Cadence: monthly.",
  },
  {
    vendor: "ZoomMeet",
    confirmed:
      "ZoomMeet appears on 2026-07-15 (15.99), 2026-08-15 (15.99), and 2026-09-15 (15.99). Cadence: monthly. Always keep: ZoomMeet.",
  },
] as const;

export const NOT_RECURRING_LINE =
  "Harbor Office Supply 84.00 on 2026-08-22 (one charge in the export).";

export const SKIPPED_CANCEL_LINE = "ZoomMeet (on your keep list).";

export const CONFIRMED_CHANGE_LINE =
  "DesignHub Pro change_formula =39.00-29.00. change_result 10.00. Earlier amount 29.00. Later amount 39.00.";

export const AI_INTERPRETATION_TEXT =
  "DesignHub Pro and CanvaLite Teams may overlap (both design tools). A 10.00 amount change is not a savings figure and is not proof the business can cancel either tool.";

export const RECOMMENDED_ACTION_TEXT =
  "Before cancelling either, confirm who uses DesignHub Pro and CanvaLite Teams. Keep ZoomMeet. Do not cancel from a guess.";

export const DESIGNHUB_FACT_CHECK = {
  vendor: "DesignHub Pro",
  confirmed:
    "DesignHub Pro appears on 2026-07-03 (29.00), 2026-08-03 (39.00), and 2026-09-03 (39.00). Cadence: monthly.",
  rows: [
    { date: "2026-07-03", confirmed: "29.00", exportValue: "29.00" },
    { date: "2026-08-03", confirmed: "39.00", exportValue: "39.00" },
    { date: "2026-09-03", confirmed: "39.00", exportValue: "39.00" },
  ],
};
