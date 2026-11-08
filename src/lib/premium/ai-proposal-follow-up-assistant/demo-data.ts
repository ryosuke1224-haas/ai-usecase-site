export const DEMO_PATH = "/blueprints/ai-proposal-follow-up-assistant";
export const KIT_PATH = "/blueprints/ai-proposal-follow-up-assistant/kit";

export const FICTIONAL_DATA_NOTICE =
  "All proposals, customer names, amounts, sent dates, statuses, and dates on this page are fictional. No real customer or proposal data is used, and nothing is connected to a CRM, PandaDoc, DocuSign, email, spreadsheet, or any other live system.";

export const AS_OF = "2026-05-18";
export const SILENCE_DATE = "2026-05-13";
export const NEXT_WEEK_AS_OF = "2026-05-25";
export const MIN_AMOUNT_DISPLAY = "$1,000";
export const CADENCE_TEXT =
  "5-11 days recap; 12-20 days check-in; 21+ close-the-loop";

export const YOU_SEND_IT = "You send it. Nothing is sent automatically.";
export const DO_NOT_INVENT =
  "Do not invent an objection, a competitor, or a deadline.";
export const LOGGED_DECLINED =
  "Logged declined proposals are not chased again.";

export const NORTHGATE_DRAFT =
  "Following up on proposal P-441 for $8,400 (website rebuild) sent April 27. Should we keep this open or close it out?";

export const PROPOSAL_COLUMNS = [
  "proposal",
  "customer",
  "amount",
  "sent_date",
  "status",
  "last_inbound",
  "line_item",
] as const;

export type ProposalRow = {
  proposal: string;
  customer: string;
  amount: string;
  sentDate: string;
  status: string;
  lastInbound: string;
  lineItem: string;
};

export const PROPOSAL_ROWS: ProposalRow[] = [
  {
    proposal: "P-441",
    customer: "Northgate Clinic",
    amount: "8400",
    sentDate: "2026-04-27",
    status: "sent",
    lastInbound: "",
    lineItem: "website rebuild",
  },
  {
    proposal: "P-448",
    customer: "Pell & Co",
    amount: "2400",
    sentDate: "2026-05-16",
    status: "sent",
    lastInbound: "",
    lineItem: "monthly books",
  },
  {
    proposal: "P-430",
    customer: "Harbor Lane",
    amount: "1500",
    sentDate: "2026-04-20",
    status: "declined",
    lastInbound: "2026-04-22",
    lineItem: "discovery",
  },
  {
    proposal: "P-452",
    customer: "Birchwood",
    amount: "400",
    sentDate: "2026-04-01",
    status: "sent",
    lastInbound: "",
    lineItem: "retainer",
  },
];

export function proposalCells(row: ProposalRow): string[] {
  return [
    row.proposal,
    row.customer,
    row.amount,
    row.sentDate,
    row.status,
    row.lastInbound,
    row.lineItem,
  ];
}

export const SAMPLE_PROPOSAL_CSV = [
  PROPOSAL_COLUMNS.join(","),
  ...PROPOSAL_ROWS.map((row) => proposalCells(row).join(",")),
].join("\n");

export const QUEUE_COLUMNS = [
  "proposal",
  "customer",
  "amount",
  "sent_date",
  "status",
  "line_item",
] as const;

export const QUEUED_ROWS: ProposalRow[] = [PROPOSAL_ROWS[0]];

export const SKIPPED_PELL =
  "P-448 Pell & Co (sent 2026-05-16 is on or after your silence date 2026-05-13).";
export const SKIPPED_HARBOR = "P-430 Harbor Lane (status declined).";
export const SKIPPED_BIRCHWOOD =
  "P-452 Birchwood (amount $400 is below your $1,000 minimum).";
export const SKIPPED_STATUS_RULES =
  "won and on-hold are also skip rules, even when this export has no such row.";

export const CONFIRMED_NORTHGATE =
  "P-441 Northgate Clinic, $8,400, sent 2026-04-27 (21 days). status sent; last inbound blank; line item website rebuild. Cadence: close-the-loop.";

export const AI_INTERPRETATION =
  "silence does not prove they will buy or that they said no. Silence is neither a yes nor a no.";

export const RECOMMENDED_ACTION_TEXT = `edit and send from your own email. ${YOU_SEND_IT} ${DO_NOT_INVENT}`;

export const NUMBER_CHECK = {
  draft: NORTHGATE_DRAFT,
  rows: [
    { field: "proposal id", confirmed: "P-441", exportValue: "P-441" },
    { field: "amount", confirmed: "$8,400", exportValue: "8400" },
    {
      field: "line item",
      confirmed: "website rebuild",
      exportValue: "website rebuild",
    },
  ],
};

export const OUTCOME_LOG_COLUMNS = [
  "week_of",
  "proposal",
  "customer",
  "amount",
  "action_taken",
  "outcome",
  "notes",
] as const;

export type OutcomeLogRow = {
  weekOf: string;
  proposal: string;
  customer: string;
  amount: string;
  actionTaken: string;
  outcome: string;
  notes: string;
};

export const OUTCOME_LOG_ROWS: OutcomeLogRow[] = [
  {
    weekOf: AS_OF,
    proposal: "P-441",
    customer: "Northgate Clinic",
    amount: "8400",
    actionTaken: "drafted_not_sent",
    outcome: "still_silent",
    notes: "owner will send tomorrow",
  },
  {
    weekOf: AS_OF,
    proposal: "P-448",
    customer: "Pell & Co",
    amount: "2400",
    actionTaken: "skipped",
    outcome: "skipped_too_recent",
    notes: "",
  },
  {
    weekOf: AS_OF,
    proposal: "P-430",
    customer: "Harbor Lane",
    amount: "1500",
    actionTaken: "skipped",
    outcome: "declined",
    notes: "already declined in export",
  },
  {
    weekOf: AS_OF,
    proposal: "P-452",
    customer: "Birchwood",
    amount: "400",
    actionTaken: "skipped",
    outcome: "skipped_below_minimum",
    notes: "",
  },
];

export function outcomeLogCells(row: OutcomeLogRow): string[] {
  return [
    row.weekOf,
    row.proposal,
    row.customer,
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

export const SKIPPED_HARBOR_NEXT_WEEK =
  "P-430 Harbor Lane (logged declined).";
export const SKIPPED_PELL_NEXT_WEEK =
  "P-448 Pell & Co (re-check silence against the new as_of and silence date).";
export const SKIPPED_BIRCHWOOD_NEXT_WEEK =
  "P-452 Birchwood (amount $400 is below your $1,000 minimum).";
