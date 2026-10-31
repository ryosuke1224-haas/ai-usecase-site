export const DEMO_PATH = "/blueprints/security-readiness-action-pack";
export const KIT_PATH = "/blueprints/security-readiness-action-pack/kit";

export const FICTIONAL_DATA_NOTICE =
  "All accounts, names, and dates on this page are fictional. No real business data is used, and nothing is connected to a bank, POS, payroll, Google Workspace, Microsoft 365, or any other live system.";

export const AS_OF_DATE = "2026-04-06";
export const NEXT_QUARTER_AS_OF_DATE = "2026-07-06";
export const PAYROLL_ACCESS_REMOVED_DATE = "2026-04-18";
export const POS_RESTORE_TEST_DATE = "2026-01-12";

export const DOES_NOT_CERTIFY =
  "This does not certify the company as secure.";

export const YOU_CHANGE_IT =
  "You change it in the real product. The kit changes nothing.";

export const SEVERITY_LADDER = [
  "HIGH: former staff still listed",
  "HIGH: MFA off on customer-or-money data",
  "HIGH: restore test = never on customer-or-money data",
  "MEDIUM: shared login on an admin account",
] as const;

export const SKIP_RULES = [
  "Personal-only accounts (holds customer or money data = no).",
  "Accounts you marked out of scope.",
  "Rows missing an account name.",
] as const;

export const INVENTORY_COLUMNS = [
  "account",
  "named_owner",
  "still_with_company",
  "mfa",
  "last_restore_test",
  "shared_login",
  "holds_customer_or_money_data",
] as const;

export type InventoryRow = {
  account: string;
  namedOwner: string;
  stillWithCompany: string;
  mfa: string;
  lastRestoreTest: string;
  sharedLogin: string;
  holdsCustomerOrMoneyData: string;
};

/** Fictional owner-typed inventory, in the order the owner wrote it. */
export const SAMPLE_INVENTORY_ROWS: InventoryRow[] = [
  {
    account: "Business bank portal",
    namedOwner: "A. Patel",
    stillWithCompany: "yes",
    mfa: "off",
    lastRestoreTest: "never",
    sharedLogin: "no",
    holdsCustomerOrMoneyData: "yes",
  },
  {
    account: "POS admin",
    namedOwner: "shared iPad",
    stillWithCompany: "yes",
    mfa: "off",
    lastRestoreTest: POS_RESTORE_TEST_DATE,
    sharedLogin: "yes",
    holdsCustomerOrMoneyData: "yes",
  },
  {
    account: "Payroll",
    namedOwner: "J. Reed",
    stillWithCompany: "no",
    mfa: "on",
    lastRestoreTest: "n/a",
    sharedLogin: "no",
    holdsCustomerOrMoneyData: "yes",
  },
  {
    account: "Owner personal streaming",
    namedOwner: "A. Patel",
    stillWithCompany: "yes",
    mfa: "off",
    lastRestoreTest: "never",
    sharedLogin: "no",
    holdsCustomerOrMoneyData: "no",
  },
];

export const SAMPLE_INVENTORY_CSV = [
  INVENTORY_COLUMNS.join(","),
  ...SAMPLE_INVENTORY_ROWS.map((row) =>
    [
      row.account,
      row.namedOwner,
      row.stillWithCompany,
      row.mfa,
      row.lastRestoreTest,
      row.sharedLogin,
      row.holdsCustomerOrMoneyData,
    ].join(","),
  ),
].join("\n");

export type SkippedAccount = {
  account: string;
  reason: string;
};

export const SKIPPED_ACCOUNTS: SkippedAccount[] = [
  {
    account: "Owner personal streaming",
    reason: "personal-only; holds customer or money data = no",
  },
];

export type QueuedAccount = {
  account: string;
  namedOwner: string;
  confirmed: string;
  severity: string;
  action: string;
};

export const RANKED_QUEUE: QueuedAccount[] = [
  {
    account: "Payroll",
    namedOwner: "J. Reed",
    confirmed: "still_with_company = no; account still listed.",
    severity: "HIGH (former staff still listed).",
    action:
      "Suggested action for you to take in payroll: remove access. The kit does not change it.",
  },
  {
    account: "Business bank portal",
    namedOwner: "A. Patel",
    confirmed:
      "MFA = off; holds customer or money data = yes; last restore test = never.",
    severity:
      "HIGH (MFA off on customer-or-money data; restore test = never on customer-or-money data).",
    action:
      "Suggested action: turn on MFA in the bank portal yourself; run a restore test and record the date.",
  },
  {
    account: "POS admin",
    namedOwner: "shared iPad",
    confirmed:
      "MFA = off; shared_login = yes; holds customer or money data = yes; named_owner = shared iPad.",
    severity:
      "HIGH (MFA off on customer-or-money data) and MEDIUM (shared login on an admin account).",
    action:
      "Suggested action: give the POS admin a named owner and MFA; do not turn off the shared iPad login until a named login can open the POS.",
  },
];

export const AI_INTERPRETATION_TEXT =
  "none of these rows prove an account was misused. They only repeat what you entered.";

export const RECOMMENDED_ACTION_TEXT =
  "pick up to 5 items, assign who will do them, and set a check date. Nothing is scanned, disabled, or changed automatically.";

export const PAYROLL_FACT_CHECK = {
  account: "Payroll",
  confirmed: "still_with_company = no; account still listed.",
  rows: [
    { field: "still_with_company", confirmed: "no", inventory: "no" },
    { field: "named_owner", confirmed: "J. Reed", inventory: "J. Reed" },
    { field: "holds_customer_or_money_data", confirmed: "yes", inventory: "yes" },
  ],
};

export const CLOSURE_LOG_COLUMNS = [
  "quarter_of",
  "account",
  "named_owner",
  "action_taken",
  "outcome",
  "check_date",
  "notes",
] as const;

export const ALLOWED_OUTCOMES = [
  "closed",
  "still open",
  "skipped",
  "deferred",
] as const;

export type ClosureLogRow = {
  quarterOf: string;
  account: string;
  namedOwner: string;
  actionTaken: string;
  outcome: string;
  checkDate: string;
  notes: string;
};

/** Fictional outcomes entered by the owner after the quarter of 2026-04-06. */
export const SAMPLE_CLOSURE_LOG: ClosureLogRow[] = [
  {
    quarterOf: AS_OF_DATE,
    account: "Payroll",
    namedOwner: "J. Reed",
    actionTaken: "removed access",
    outcome: "closed",
    checkDate: PAYROLL_ACCESS_REMOVED_DATE,
    notes: "",
  },
  {
    quarterOf: AS_OF_DATE,
    account: "Business bank portal",
    namedOwner: "A. Patel",
    actionTaken: "",
    outcome: "still open",
    checkDate: "",
    notes: "MFA still off",
  },
  {
    quarterOf: AS_OF_DATE,
    account: "POS admin",
    namedOwner: "shared iPad",
    actionTaken: "",
    outcome: "still open",
    checkDate: "",
    notes: "MFA still off and shared login",
  },
];

/** Header only. Copying this starts a blank log and does not include fictional rows. */
export const CLOSURE_LOG_TEMPLATE_CSV = CLOSURE_LOG_COLUMNS.join(",");

export const NEXT_QUARTER_CLOSED = {
  account: "Payroll",
  detail: `access removed on ${PAYROLL_ACCESS_REMOVED_DATE}; stays in the log`,
};

export const NEXT_QUARTER_QUEUE: { account: string; detail: string }[] = [
  {
    account: "Business bank portal",
    detail: "HIGH (MFA still off; restore test still never)",
  },
  {
    account: "POS admin",
    detail: "HIGH (MFA still off) and MEDIUM (shared admin login)",
  },
];

export const NEXT_QUARTER_SKIPPED: SkippedAccount[] = [
  {
    account: "Owner personal streaming",
    reason: "personal-only; holds customer or money data = no",
  },
];
