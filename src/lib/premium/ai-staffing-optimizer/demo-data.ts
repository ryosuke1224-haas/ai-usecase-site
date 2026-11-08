export const DEMO_PATH = "/blueprints/ai-staffing-optimizer";
export const KIT_PATH = "/blueprints/ai-staffing-optimizer/kit";

export const FICTIONAL_DATA_NOTICE =
  "All hours, transaction counts, staff counts, and dates on this page are fictional. No real business data is used, and nothing is connected to a POS, scheduling tool, time clock, or any other live system.";

export const MINIMUM_STAFF = "2";
export const TARGET_LOW = "15";
export const TARGET_HIGH = "25";
export const TARGET_RANGE = "15-25";
export const FLAG_WEEKS_N = "3";
export const FLAG_WEEKS_M = "4";
export const PROTECTED_ROLE = "keyholder";

export const YOU_EDIT_SCHEDULE =
  "You edit the schedule in your own tool. The kit changes nothing.";
export const DO_NOT_CUT_MINIMUM = "Do not cut below your minimum staff.";
export const CHECK_LOCAL_RULES =
  "Check local scheduling and break rules before changing posted shifts.";
export const RECHECK_SENTENCE =
  "Re-check the same blocks after 4 weeks with a new export.";

export const AI_INTERPRETATION_TEXT =
  "Tuesday afternoon may include prep or restocking that the POS export does not show. A quiet POS hour is not proof the floor can run at the absolute minimum without checking non-sales work.";

export const HOURLY_COLUMNS = [
  "day",
  "hour",
  "week1_tx",
  "week2_tx",
  "week3_tx",
  "week4_tx",
  "week1_staff",
  "week2_staff",
  "week3_staff",
  "week4_staff",
] as const;

export type HourlyRow = {
  day: string;
  hour: string;
  week1Tx: string;
  week2Tx: string;
  week3Tx: string;
  week4Tx: string;
  week1Staff: string;
  week2Staff: string;
  week3Staff: string;
  week4Staff: string;
};

export const HOURLY_ROWS: HourlyRow[] = [
  {
    day: "Tue",
    hour: "14:00",
    week1Tx: "12",
    week2Tx: "10",
    week3Tx: "11",
    week4Tx: "11",
    week1Staff: "4",
    week2Staff: "4",
    week3Staff: "4",
    week4Staff: "4",
  },
  {
    day: "Sat",
    hour: "12:00",
    week1Tx: "90",
    week2Tx: "82",
    week3Tx: "88",
    week4Tx: "92",
    week1Staff: "3",
    week2Staff: "3",
    week3Staff: "3",
    week4Staff: "3",
  },
];

export function hourlyCells(row: HourlyRow): string[] {
  return [
    row.day,
    row.hour,
    row.week1Tx,
    row.week2Tx,
    row.week3Tx,
    row.week4Tx,
    row.week1Staff,
    row.week2Staff,
    row.week3Staff,
    row.week4Staff,
  ];
}

export const SAMPLE_HOURLY_CSV = [
  HOURLY_COLUMNS.join(","),
  ...HOURLY_ROWS.map((row) => hourlyCells(row).join(",")),
].join("\n");

export const WORKBOOK_COLUMNS = [
  "day",
  "hour",
  "week1_tx",
  "week2_tx",
  "week3_tx",
  "week4_tx",
  "week1_staff",
  "week2_staff",
  "week3_staff",
  "week4_staff",
  "week1_tx_per_staff_formula",
  "week2_tx_per_staff_formula",
  "week3_tx_per_staff_formula",
  "week4_tx_per_staff_formula",
  "weeks_outside_target",
  "flag",
  "notes",
] as const;

export type WorkbookRow = {
  day: string;
  hour: string;
  week1Tx: string;
  week2Tx: string;
  week3Tx: string;
  week4Tx: string;
  week1Staff: string;
  week2Staff: string;
  week3Staff: string;
  week4Staff: string;
  week1Formula: string;
  week2Formula: string;
  week3Formula: string;
  week4Formula: string;
  weeksOutside: string;
  flag: string;
  notes: string;
};

export const WORKBOOK_ROWS: WorkbookRow[] = [
  {
    day: "Tue",
    hour: "14:00",
    week1Tx: "12",
    week2Tx: "10",
    week3Tx: "11",
    week4Tx: "11",
    week1Staff: "4",
    week2Staff: "4",
    week3Staff: "4",
    week4Staff: "4",
    week1Formula: "=12/4=3.0",
    week2Formula: "=10/4=2.5",
    week3Formula: "=11/4=2.8",
    week4Formula: "=11/4=2.8",
    weeksOutside: "4",
    flag: "overstaffed",
    notes: "below 15-25 in 4 of 4 weeks",
  },
  {
    day: "Sat",
    hour: "12:00",
    week1Tx: "90",
    week2Tx: "82",
    week3Tx: "88",
    week4Tx: "92",
    week1Staff: "3",
    week2Staff: "3",
    week3Staff: "3",
    week4Staff: "3",
    week1Formula: "=90/3=30.0",
    week2Formula: "=82/3=27.3",
    week3Formula: "=88/3=29.3",
    week4Formula: "=92/3=30.7",
    weeksOutside: "4",
    flag: "understaffed",
    notes: "above 15-25 in 4 of 4 weeks",
  },
];

export function workbookCells(row: WorkbookRow): string[] {
  return [
    row.day,
    row.hour,
    row.week1Tx,
    row.week2Tx,
    row.week3Tx,
    row.week4Tx,
    row.week1Staff,
    row.week2Staff,
    row.week3Staff,
    row.week4Staff,
    row.week1Formula,
    row.week2Formula,
    row.week3Formula,
    row.week4Formula,
    row.weeksOutside,
    row.flag,
    row.notes,
  ];
}

export const WORKBOOK_CSV = [
  WORKBOOK_COLUMNS.join(","),
  ...WORKBOOK_ROWS.map((row) => workbookCells(row).join(",")),
].join("\n");

export const TUE_CONFIRMED =
  "Tue 14:00 transactions per staff-hour =12/4=3.0, =10/4=2.5, =11/4=2.8, =11/4=2.8; below your 15-25 target in 4 of 4 weeks (overstaffed pattern).";

export const SAT_CONFIRMED =
  "Sat 12:00 =90/3=30.0, =82/3=27.3, =88/3=29.3, =92/3=30.7; above target in 4 of 4 weeks (understaffed pattern).";

export const TUE_FACT_CHECK = {
  confirmed: TUE_CONFIRMED,
  rows: [
    {
      week: "week1",
      confirmedTx: "12",
      exportTx: "12",
      confirmedStaff: "4",
      exportStaff: "4",
    },
    {
      week: "week2",
      confirmedTx: "10",
      exportTx: "10",
      confirmedStaff: "4",
      exportStaff: "4",
    },
    {
      week: "week3",
      confirmedTx: "11",
      exportTx: "11",
      confirmedStaff: "4",
      exportStaff: "4",
    },
    {
      week: "week4",
      confirmedTx: "11",
      exportTx: "11",
      confirmedStaff: "4",
      exportStaff: "4",
    },
  ],
};

export const RECOMMENDED_TUE =
  "consider 2 on floor Tue 14:00-15:00 (your minimum).";
export const RECOMMENDED_SAT =
  "Consider adding 1 person at Sat 12:00 (example: 88 / 4 = 22 per staff-hour).";
