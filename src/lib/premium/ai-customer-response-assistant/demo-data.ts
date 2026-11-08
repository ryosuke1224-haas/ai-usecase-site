export const DEMO_PATH = "/blueprints/ai-customer-response-assistant";
export const KIT_PATH = "/blueprints/ai-customer-response-assistant/kit";

export const FICTIONAL_DATA_NOTICE =
  "All messages, names, FAQ facts, appointment lengths, and dates on this page are fictional. No real customer data is used, and nothing is connected to an inbox, form tool, helpdesk, or any other live system.";

export const SENDER = "R. Cole";
export const RECEIVED_DATE = "2026-10-27";
export const MESSAGE_SOURCE = "website form";

export const MESSAGE_TEXT =
  "Can a color appointment be done in 45 minutes this Friday? Also I want my last visit refunded, the wait was too long.";

export const FAQ_FACTS = [
  "color visits run 90 minutes",
  "cancellations need 24 hours",
  "we do not quote refunds by email",
] as const;

export const ESCALATE_IF = "refund demand; injury; legal threat";
export const TONE = "warm, short, no slang";
export const NEVER_IN_DRAFT = "refunds; discounts; appointment times not in the FAQ";

export const YOU_SEND_IT = "You send it. Nothing is sent automatically.";
export const DO_NOT_SEND = "Do not send this draft.";
export const DO_NOT_DRAFT_MONEY =
  "Do not draft a customer-facing reply about money.";
export const DO_NOT_INVENT_FRIDAY = "Do not invent Friday availability.";
export const LONG_WAIT_UNVERIFIED =
  "A long wait is not independently verified here.";
export const HOW_TO_ONLY_CONTRAST =
  "A how-to-only message with no escalate match would get a FAQ draft, not an escalate stop.";

export const ESCALATE_LINE =
  "refund demand ('I want my last visit refunded'). Rule matched: refund demand.";

export const INTERNAL_NOTE_TEXT =
  "refund request plus timing question. Owner decides any money conversation.";

export const OTHER_ESCALATE_RULES =
  "Injury and legal threat are also escalate rules, even when this message does not match them.";

export const REVIEW_QUEUE_LINE = "REVIEW QUEUE (fictional) — 1 message";

export const CONFIRMED_TEXT =
  "question also present: whether a color appointment can be done in 45 minutes this Friday.";

export const FAQ_FACT_TEXT =
  "color visits run 90 minutes. FAQ does not mention this Friday's openings.";

export const PARTIAL_DRAFT =
  "Color visits are booked for 90 minutes. I cannot confirm Friday from this message alone.";

export const NEEDS_YOUR_CHECK_TEXT = "Friday availability is not in the FAQ.";

export const AI_INTERPRETATION_TEXT =
  "a long wait is not independently verified here.";

export const RECOMMENDED_ACTION_TEXT = `handle the refund yourself; edit or discard the timing sentence; send from your own inbox. ${YOU_SEND_IT} ${DO_NOT_SEND}`;

export const FACT_CHECK = {
  faqFactLine: FAQ_FACT_TEXT,
  rows: [
    {
      field: "duration",
      reviewValue: "90 minutes",
      sourceValue: "color visits run 90 minutes",
    },
    {
      field: "escalate match",
      reviewValue: "refund demand",
      sourceValue: "I want my last visit refunded",
    },
    {
      field: "refund policy",
      reviewValue: "we do not quote refunds by email",
      sourceValue: "no money sentence in the partial draft",
    },
  ],
};

export const CONSISTENCY_LOG_COLUMNS = [
  "week_of",
  "sender",
  "topic",
  "escalate_rule",
  "action",
  "outcome",
] as const;

export type ConsistencyLogRow = {
  weekOf: string;
  sender: string;
  topic: string;
  escalateRule: string;
  action: string;
  outcome: string;
};

export const CONSISTENCY_LOG_ROWS: ConsistencyLogRow[] = [
  {
    weekOf: RECEIVED_DATE,
    sender: SENDER,
    topic: "color visit timing and refund",
    escalateRule: "refund demand",
    action: "escalated",
    outcome: "owner_handled",
  },
];

export function consistencyLogCells(row: ConsistencyLogRow): string[] {
  return [
    row.weekOf,
    row.sender,
    row.topic,
    row.escalateRule,
    row.action,
    row.outcome,
  ];
}

export const CONSISTENCY_LOG_CSV = [
  CONSISTENCY_LOG_COLUMNS.join(","),
  ...CONSISTENCY_LOG_ROWS.map((row) => consistencyLogCells(row).join(",")),
].join("\n");

export const SECOND_SENDER = "A. Nguyen";
export const SECOND_MESSAGE =
  "How long is a color visit, and how much notice do I need to cancel?";

export const SAMPLE_MESSAGES_TEXT = [
  "Fictional message 1 (guided demo)",
  `received: ${RECEIVED_DATE}`,
  `source: ${MESSAGE_SOURCE}`,
  `sender: ${SENDER}`,
  `message: ${MESSAGE_TEXT}`,
  "",
  "Fictional message 2 (how-to only)",
  "received: 2026-10-28",
  `source: ${MESSAGE_SOURCE}`,
  `sender: ${SECOND_SENDER}`,
  `message: ${SECOND_MESSAGE}`,
].join("\n");
