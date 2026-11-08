export const DEMO_PATH = "/blueprints/inactive-customer-winback";
export const KIT_PATH = "/blueprints/inactive-customer-winback/kit";

export const FICTIONAL_DATA_NOTICE =
  "All customers, names, visit dates, services, consent flags, offers, and return outcomes on this page are fictional. No real customer data is used, and nothing is connected to Square, Mindbody, a POS, email, SMS, or any other live system.";

export const AS_OF = "2026-06-15";
export const LAPSE_BEFORE = "2026-04-16";
export const VIP_FLOOR = "8";
export const RETURN_AS_OF = "2026-07-20";

export const VIP_OFFER = "10% off next color";
export const OCCASIONAL_OFFER = "complimentary consult";

export const YOU_SEND_IT = "You send it. Nothing is sent automatically.";
export const DO_NOT_INVENT =
  "Do not invent a discount that is not on your offer list.";
export const RETURN_NOT_PROOF = "A return is not proof the message caused it.";
export const CONFIRM_CONSENT = "Confirm consent before any message.";
export const LAPSE_DATE_SENTENCE =
  "Do not queue someone whose last visit is after your lapse date.";

export const CUSTOMER_COLUMNS = [
  "first",
  "last_visit",
  "last_service",
  "visits_12mo",
  "marketing_consent",
  "do_not_contact",
] as const;

export type CustomerRow = {
  first: string;
  lastVisit: string;
  lastService: string;
  visits12mo: string;
  marketingConsent: string;
  doNotContact: string;
};

export const CUSTOMER_ROWS: CustomerRow[] = [
  {
    first: "J. Rivera",
    lastVisit: "2026-02-03",
    lastService: "Cut & color",
    visits12mo: "11",
    marketingConsent: "yes",
    doNotContact: "no",
  },
  {
    first: "L. Park",
    lastVisit: "2026-02-15",
    lastService: "Cut",
    visits12mo: "10",
    marketingConsent: "yes",
    doNotContact: "no",
  },
  {
    first: "T. Brooks",
    lastVisit: "2026-03-01",
    lastService: "Massage",
    visits12mo: "4",
    marketingConsent: "yes",
    doNotContact: "no",
  },
  {
    first: "A. Chen",
    lastVisit: "2026-06-01",
    lastService: "Consult",
    visits12mo: "3",
    marketingConsent: "yes",
    doNotContact: "no",
  },
  {
    first: "M. Ortiz",
    lastVisit: "2026-01-20",
    lastService: "Facial",
    visits12mo: "2",
    marketingConsent: "no",
    doNotContact: "no",
  },
  {
    first: "K. Singh",
    lastVisit: "2025-11-02",
    lastService: "Cut",
    visits12mo: "9",
    marketingConsent: "yes",
    doNotContact: "yes",
  },
  {
    first: "S. Diaz",
    lastVisit: "2025-12-10",
    lastService: "Color",
    visits12mo: "1",
    marketingConsent: "yes",
    doNotContact: "no",
  },
  {
    first: "R. Wells",
    lastVisit: "2026-01-05",
    lastService: "Highlights",
    visits12mo: "5",
    marketingConsent: "yes",
    doNotContact: "no",
  },
];

export function customerCells(row: CustomerRow): string[] {
  return [
    row.first,
    row.lastVisit,
    row.lastService,
    row.visits12mo,
    row.marketingConsent,
    row.doNotContact,
  ];
}

export const SAMPLE_CUSTOMERS_CSV = [
  CUSTOMER_COLUMNS.join(","),
  ...CUSTOMER_ROWS.map((row) => customerCells(row).join(",")),
].join("\n");

export const CONTACT_LOG_NOTE = "R. Wells contacted 2026-06-01";

export const SKIPPED_CHEN = `A. Chen (last visit 2026-06-01 is after your lapse date). ${LAPSE_DATE_SENTENCE}`;
export const SKIPPED_ORTIZ = "M. Ortiz (marketing_consent is no).";
export const SKIPPED_SINGH = "K. Singh (do_not_contact is yes).";
export const SKIPPED_DIAZ = "S. Diaz (one-time buyer; visits_12mo = 1).";
export const SKIPPED_WELLS =
  "R. Wells (already contacted this period per the contact log).";

export const RIVERA_DRAFT =
  "It has been a while since your Cut & color on Feb 3. If useful, a 10% off next color is available.";
export const PARK_DRAFT =
  "It has been a while since your Cut on Feb 15. If useful, a 10% off next color is available.";
export const BROOKS_DRAFT =
  "It has been a while since your Massage on Mar 1. A complimentary consult is available if useful.";

export const CONFIRMED_RIVERA =
  "last visit 2026-02-03 (132 days); last service Cut & color; 11 visits in 12 months; marketing consent yes. Segment: VIP.";
export const CONFIRMED_PARK =
  "last visit 2026-02-15 (120 days); last service Cut; 10 visits in 12 months; marketing consent yes. Segment: VIP.";
export const CONFIRMED_BROOKS =
  "last visit 2026-03-01 (106 days); last service Massage; 4 visits in 12 months; marketing consent yes. Segment: occasional.";

export const AI_INTERPRETATION =
  "days since visit do not prove why they stopped coming.";

export const RECOMMENDED_ACTION = `pick the recipient from your own list and send from your own tool. ${YOU_SEND_IT} ${DO_NOT_INVENT} Confirm consent before any message.`;

export const QUEUE_COLUMNS = [
  "rank",
  "first",
  "segment",
  "draft",
] as const;

export const QUEUED_ROWS = [
  {
    rank: "1",
    first: "J. Rivera",
    segment: "VIP",
    draft: RIVERA_DRAFT,
    confirmed: CONFIRMED_RIVERA,
  },
  {
    rank: "2",
    first: "L. Park",
    segment: "VIP",
    draft: PARK_DRAFT,
    confirmed: CONFIRMED_PARK,
  },
  {
    rank: "3",
    first: "T. Brooks",
    segment: "occasional",
    draft: BROOKS_DRAFT,
    confirmed: CONFIRMED_BROOKS,
  },
] as const;

export const FACT_CHECK = {
  confirmed: `J. Rivera. CONFIRMED: ${CONFIRMED_RIVERA}`,
  rows: [
    {
      field: "last visit",
      confirmed: "2026-02-03",
      exportValue: "2026-02-03",
    },
    {
      field: "last service",
      confirmed: "Cut & color",
      exportValue: "Cut & color",
    },
    {
      field: "offer",
      confirmed: VIP_OFFER,
      exportValue: "written VIP offer",
    },
  ],
};

export const RETURN_ROWS = [
  {
    first: "J. Rivera",
    lastVisit: "2026-07-01",
    status: "RETURNED",
  },
  {
    first: "L. Park",
    lastVisit: "2026-02-15",
    status: "still lapsed",
  },
  {
    first: "T. Brooks",
    lastVisit: "2026-03-01",
    status: "still lapsed",
  },
] as const;

export const CONTACT_LOG_COLUMNS = [
  "as_of",
  "first",
  "last_visit",
  "last_service",
  "visits_12mo",
  "segment",
  "offer_used",
  "action",
  "outcome",
] as const;

export type ContactLogRow = {
  asOf: string;
  first: string;
  lastVisit: string;
  lastService: string;
  visits12mo: string;
  segment: string;
  offerUsed: string;
  action: string;
  outcome: string;
};

export const CONTACT_LOG_ROWS: ContactLogRow[] = [
  {
    asOf: AS_OF,
    first: "J. Rivera",
    lastVisit: "2026-02-03",
    lastService: "Cut & color",
    visits12mo: "11",
    segment: "VIP",
    offerUsed: VIP_OFFER,
    action: "drafted_not_sent",
    outcome: "unknown",
  },
  {
    asOf: RETURN_AS_OF,
    first: "J. Rivera",
    lastVisit: "2026-07-01",
    lastService: "Cut & color",
    visits12mo: "11",
    segment: "VIP",
    offerUsed: VIP_OFFER,
    action: "drafted_not_sent",
    outcome: "returned",
  },
  {
    asOf: AS_OF,
    first: "L. Park",
    lastVisit: "2026-02-15",
    lastService: "Cut",
    visits12mo: "10",
    segment: "VIP",
    offerUsed: VIP_OFFER,
    action: "drafted_not_sent",
    outcome: "still_lapsed",
  },
  {
    asOf: AS_OF,
    first: "T. Brooks",
    lastVisit: "2026-03-01",
    lastService: "Massage",
    visits12mo: "4",
    segment: "occasional",
    offerUsed: OCCASIONAL_OFFER,
    action: "drafted_not_sent",
    outcome: "still_lapsed",
  },
  {
    asOf: AS_OF,
    first: "A. Chen",
    lastVisit: "2026-06-01",
    lastService: "Consult",
    visits12mo: "3",
    segment: "",
    offerUsed: "",
    action: "skipped_recent",
    outcome: "unknown",
  },
  {
    asOf: AS_OF,
    first: "M. Ortiz",
    lastVisit: "2026-01-20",
    lastService: "Facial",
    visits12mo: "2",
    segment: "",
    offerUsed: "",
    action: "skipped_no_consent",
    outcome: "unknown",
  },
  {
    asOf: AS_OF,
    first: "K. Singh",
    lastVisit: "2025-11-02",
    lastService: "Cut",
    visits12mo: "9",
    segment: "",
    offerUsed: "",
    action: "skipped_dnc",
    outcome: "unknown",
  },
  {
    asOf: AS_OF,
    first: "S. Diaz",
    lastVisit: "2025-12-10",
    lastService: "Color",
    visits12mo: "1",
    segment: "",
    offerUsed: "",
    action: "skipped_one_time",
    outcome: "unknown",
  },
  {
    asOf: AS_OF,
    first: "R. Wells",
    lastVisit: "2026-01-05",
    lastService: "Highlights",
    visits12mo: "5",
    segment: "",
    offerUsed: "",
    action: "skipped_already_contacted",
    outcome: "unknown",
  },
];

export function contactLogCells(row: ContactLogRow): string[] {
  return [
    row.asOf,
    row.first,
    row.lastVisit,
    row.lastService,
    row.visits12mo,
    row.segment,
    row.offerUsed,
    row.action,
    row.outcome,
  ];
}

export const CONTACT_LOG_CSV = [
  CONTACT_LOG_COLUMNS.join(","),
  ...CONTACT_LOG_ROWS.map((row) => contactLogCells(row).join(",")),
].join("\n");
