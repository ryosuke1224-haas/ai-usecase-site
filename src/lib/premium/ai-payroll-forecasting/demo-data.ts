export const DEMO_PATH = "/blueprints/ai-payroll-forecasting";
export const KIT_PATH = "/blueprints/ai-payroll-forecasting/kit";

export const FICTIONAL_DATA_NOTICE =
  "All roles, hours, rates, revenue figures, payroll totals, and dates on this page are fictional. No real business data is used, and nothing is connected to a scheduling tool, time clock, POS, payroll provider, or any other live system.";

export const PAY_PERIOD = "2026-04-06 to 2026-04-19";
export const PROJECTED_REVENUE = "9800";
export const EMPLOYER_LOAD = "1.20";
export const TARGET_LABOR = "40";
export const OVERTIME_MULTIPLIER = "1.5";
export const OVERTIME_FLAG_RULE = "flag if any role has overtime hours > 0";

export const YOU_EDIT_SCHEDULE =
  "You edit the schedule in your own tool. The kit changes nothing.";
export const DO_NOT_CUT_COVERAGE =
  "Do not cut hours that break your minimum coverage.";
export const RECHECK_SENTENCE =
  "Re-check against the actual pay-run total after 2026-04-19.";

export const AI_INTERPRETATION_TEXT =
  "the gap is in hours (including overtime), not in the stated rates. This cannot say whether the $9,800 revenue figure is realistic.";

export const SCHEDULE_COLUMNS = [
  "role",
  "scheduled_hours",
  "hourly_rate",
  "overtime_hours_in_schedule",
] as const;

export type ScheduleRow = {
  role: string;
  scheduledHours: string;
  hourlyRate: string;
  overtimeHours: string;
};

export const SCHEDULE_ROWS: ScheduleRow[] = [
  {
    role: "stylist",
    scheduledHours: "128",
    hourlyRate: "22",
    overtimeHours: "4",
  },
  {
    role: "front_desk",
    scheduledHours: "64",
    hourlyRate: "18",
    overtimeHours: "0",
  },
];

export const SAMPLE_SCHEDULE_CSV = [
  SCHEDULE_COLUMNS.join(","),
  ...SCHEDULE_ROWS.map((row) =>
    [row.role, row.scheduledHours, row.hourlyRate, row.overtimeHours].join(","),
  ),
].join("\n");

export const WORKBOOK_COLUMNS = [
  "role",
  "scheduled_hours",
  "regular_hours",
  "overtime_hours",
  "hourly_rate",
  "regular_pay_formula",
  "overtime_pay_formula",
  "role_subtotal",
  "load_factor",
  "loaded_payroll",
  "revenue_figure",
  "labor_pct_formula",
  "labor_pct",
  "target_pct",
  "flag",
] as const;

export type WorkbookRow = {
  role: string;
  scheduledHours: string;
  regularHours: string;
  overtimeHours: string;
  hourlyRate: string;
  regularPayFormula: string;
  overtimePayFormula: string;
  roleSubtotal: string;
  loadFactor: string;
  loadedPayroll: string;
  revenueFigure: string;
  laborPctFormula: string;
  laborPct: string;
  targetPct: string;
  flag: string;
};

export const WORKBOOK_ROWS: WorkbookRow[] = [
  {
    role: "stylist",
    scheduledHours: "128",
    regularHours: "124",
    overtimeHours: "4",
    hourlyRate: "22",
    regularPayFormula: "=124*22",
    overtimePayFormula: "=4*33",
    roleSubtotal: "2860",
    loadFactor: "1.20",
    loadedPayroll: "",
    revenueFigure: "",
    laborPctFormula: "",
    laborPct: "",
    targetPct: "40",
    flag: "regular 2728; OT 132",
  },
  {
    role: "front_desk",
    scheduledHours: "64",
    regularHours: "64",
    overtimeHours: "0",
    hourlyRate: "18",
    regularPayFormula: "=64*18",
    overtimePayFormula: "=0*27",
    roleSubtotal: "1152",
    loadFactor: "1.20",
    loadedPayroll: "",
    revenueFigure: "",
    laborPctFormula: "",
    laborPct: "",
    targetPct: "40",
    flag: "",
  },
  {
    role: "",
    scheduledHours: "",
    regularHours: "",
    overtimeHours: "",
    hourlyRate: "",
    regularPayFormula: "",
    overtimePayFormula: "",
    roleSubtotal: "4012",
    loadFactor: "1.20",
    loadedPayroll: "=4012*1.20",
    revenueFigure: "9800",
    laborPctFormula: "=4814.40/9800",
    laborPct: "49.1%",
    targetPct: "40",
    flag: "above target; 4814.40",
  },
];

export function workbookCells(row: WorkbookRow): string[] {
  return [
    row.role,
    row.scheduledHours,
    row.regularHours,
    row.overtimeHours,
    row.hourlyRate,
    row.regularPayFormula,
    row.overtimePayFormula,
    row.roleSubtotal,
    row.loadFactor,
    row.loadedPayroll,
    row.revenueFigure,
    row.laborPctFormula,
    row.laborPct,
    row.targetPct,
    row.flag,
  ];
}

export const WORKBOOK_CSV = [
  WORKBOOK_COLUMNS.join(","),
  ...WORKBOOK_ROWS.map((row) => workbookCells(row).join(",")),
].join("\n");

export const STYLIST_CONFIRMED =
  "stylist regular =124*22 = 2728; overtime =4*33 = 132; subtotal 2860.";

export const FRONT_DESK_CONFIRMED = "front_desk =64*18 = 1152.";

export const STYLIST_FACT_CHECK = {
  confirmed: STYLIST_CONFIRMED,
  rows: [
    { field: "scheduled_hours", confirmed: "128", exportValue: "128" },
    { field: "hourly_rate", confirmed: "22", exportValue: "22" },
    {
      field: "overtime_hours_in_schedule",
      confirmed: "4",
      exportValue: "4",
    },
  ],
};
