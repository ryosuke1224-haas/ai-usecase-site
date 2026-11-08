export const DEMO_PATH = "/blueprints/ai-pipeline-risk-detector";
export const KIT_PATH = "/blueprints/ai-pipeline-risk-detector/kit";

export const FICTIONAL_DATA_NOTICE =
  "All deals, company names, amounts, stages, activity dates, and dates on this page are fictional. No real customer or pipeline data is used, and nothing is connected to HubSpot, Pipedrive, Salesforce, email, or any other live system.";

export const AS_OF = "2026-05-11";
export const NEXT_WEEK_AS_OF = "2026-05-18";
export const MIN_AMOUNT_DISPLAY = "$500";
export const STALL_LIMIT = "14";

export const YOU_SEND_IT =
  "You send it. Nothing is sent or written to the CRM.";
export const DO_NOT_INVENT =
  "Do not invent a contact, objection, or deadline.";
export const LOGGED_ON_HOLD =
  "Logged on-hold deals are not chased again.";

export const NORTHGATE_DRAFT =
  "Checking in on the $8,400 website rebuild proposal last touched April 18. Is this still useful to discuss?";
export const HARBOR_DRAFT =
  "The Harbor Lane discovery item for $1,500 has had no recorded activity since March 20. Should we close this out or set a next step?";

export const DEAL_COLUMNS = [
  "deal",
  "amount",
  "stage",
  "days_in_stage",
  "last_activity",
  "next_step",
  "status",
] as const;

export type DealRow = {
  deal: string;
  amount: string;
  stage: string;
  daysInStage: string;
  lastActivity: string;
  nextStep: string;
  status: string;
};

export const DEAL_ROWS: DealRow[] = [
  {
    deal: "Northgate Clinic website rebuild",
    amount: "8400",
    stage: "proposal",
    daysInStage: "21",
    lastActivity: "2026-04-18",
    nextStep: "",
    status: "open",
  },
  {
    deal: "Pell & Co monthly books",
    amount: "2400",
    stage: "negotiation",
    daysInStage: "9",
    lastActivity: "2026-05-09",
    nextStep: "call Tue",
    status: "open",
  },
  {
    deal: "Harbor Lane discovery",
    amount: "1500",
    stage: "qualified",
    daysInStage: "45",
    lastActivity: "2026-03-20",
    nextStep: "",
    status: "open",
  },
  {
    deal: "Birchwood retainers",
    amount: "400",
    stage: "proposal",
    daysInStage: "30",
    lastActivity: "2026-04-01",
    nextStep: "",
    status: "open",
  },
];

export function dealCells(row: DealRow): string[] {
  return [
    row.deal,
    row.amount,
    row.stage,
    row.daysInStage,
    row.lastActivity,
    row.nextStep,
    row.status,
  ];
}

export const SAMPLE_DEAL_CSV = [
  DEAL_COLUMNS.join(","),
  ...DEAL_ROWS.map((row) => dealCells(row).join(",")),
].join("\n");

export const QUEUE_COLUMNS = [
  "deal",
  "amount",
  "stage",
  "days_in_stage",
  "last_activity",
  "next_step",
] as const;

export const QUEUED_ROWS: DealRow[] = [DEAL_ROWS[0], DEAL_ROWS[2]];

export const SKIPPED_PELL =
  "Pell & Co monthly books (last activity 2026-05-09 and next step present; not stalled under your rules).";
export const SKIPPED_BIRCHWOOD =
  "Birchwood retainers (amount $400 is below your $500 minimum).";
export const SKIPPED_HARBOR_NEXT_WEEK =
  "Harbor Lane discovery (logged on_hold).";
export const SKIPPED_STATUS_RULES =
  "closed-won, closed-lost, and on-hold are also skip rules, even when this export has no such row.";

export const CONFIRMED_NORTHGATE =
  "Northgate Clinic website rebuild, $8,400, proposal, 21 days in stage. last activity 2026-04-18; next step blank.";
export const CONFIRMED_HARBOR =
  "Harbor Lane discovery, $1,500, qualified, 45 days in stage. last activity 2026-03-20; next step blank.";

export const AI_INTERPRETATION =
  "these rows do not prove the buyer lost interest; they only show missing activity or a missing next step in the export.";

export const RECOMMENDED_ACTION_TEXT = `edit and send from your own email, or update the next step in your CRM yourself. ${YOU_SEND_IT} ${DO_NOT_INVENT}`;

export const NUMBER_CHECK = {
  draft: NORTHGATE_DRAFT,
  rows: [
    { field: "amount", confirmed: "$8,400", exportValue: "8400" },
    { field: "last activity", confirmed: "2026-04-18", exportValue: "2026-04-18" },
    { field: "days in stage", confirmed: "21", exportValue: "21" },
  ],
};

export const OUTCOME_LOG_COLUMNS = [
  "week_of",
  "deal",
  "amount",
  "action_taken",
  "outcome",
  "notes",
] as const;

export type OutcomeLogRow = {
  weekOf: string;
  deal: string;
  amount: string;
  actionTaken: string;
  outcome: string;
  notes: string;
};

export const OUTCOME_LOG_ROWS: OutcomeLogRow[] = [
  {
    weekOf: AS_OF,
    deal: "Northgate Clinic website rebuild",
    amount: "8400",
    actionTaken: "drafted_not_sent",
    outcome: "still_stalled",
    notes: "owner will chase next week",
  },
  {
    weekOf: AS_OF,
    deal: "Harbor Lane discovery",
    amount: "1500",
    actionTaken: "held",
    outcome: "on_hold",
    notes: "buyer asked to pause",
  },
  {
    weekOf: AS_OF,
    deal: "Pell & Co monthly books",
    amount: "2400",
    actionTaken: "skipped",
    outcome: "skipped_not_stalled",
    notes: "",
  },
  {
    weekOf: AS_OF,
    deal: "Birchwood retainers",
    amount: "400",
    actionTaken: "skipped",
    outcome: "skipped_below_minimum",
    notes: "",
  },
];

export function outcomeLogCells(row: OutcomeLogRow): string[] {
  return [
    row.weekOf,
    row.deal,
    row.amount,
    row.actionTaken,
    row.outcome,
    row.notes,
  ];
}

export const OUTCOME_LOG_CSV = [
  OUTCOME_LOG_COLUMNS.join(","),
  ...OUTCOME_LOG_ROWS.map((row) => outcomeLogCells(row).join(",")),
].join("\n");
