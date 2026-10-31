export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Quarterly Security Readiness Setup Checklist" },
  { id: "queue-prompt", title: "Quarterly Readiness Queue Prompt" },
  { id: "next-quarter-prompt", title: "Quarter-to-Quarter Update Prompt" },
  { id: "rules-worksheet", title: "Skip Rules and Severity Ladder Worksheet" },
  { id: "closure-log-template", title: "Quarterly Closure Log Template" },
  { id: "action-review-checklist", title: "Action Review Checklist" },
  { id: "sample-inventory", title: "Fictional Sample Inventory" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Fill one row per business account in the inventory worksheet. The columns are account, named_owner, still_with_company, mfa, last_restore_test, shared_login, and holds_customer_or_money_data, plus the as-of date. This is an owner inventory, not a scan. You decide which accounts to include and how to spell former-staff names.",
  "Optional: paste a user-list export you already downloaded from Google Workspace or Microsoft 365. Atlas does not connect to those products. Keep names of people no longer employed only as you typed them.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Confirm or edit the skip rules and severity ladder in the Skip Rules and Severity Ladder Worksheet, then copy the rules block.",
  "Paste the Quarterly Readiness Queue Prompt and your rules block into your AI tool, then attach or paste the inventory and, if you have one, last quarter's closure log.",
  "Use the Action Review Checklist before you change anything in a real product. You decide whether to turn on MFA, remove access, test a restore, or replace a shared login, and you do that work in the real product yourself. The kit changes nothing.",
  "Record each outcome in the quarterly closure log. Closed items stay in the log. Next quarter, re-run on an updated inventory with the Quarter-to-Quarter Update Prompt.",
] as const;

export const QUEUE_PROMPT = `You are helping me prepare this quarter's security readiness queue from my own written account inventory. You prepare; I decide.

Do not scan. Do not certify. Do not change passwords. Do not disable accounts. Do not connect to a vendor, turn on MFA, or run a restore test. I make every change in the real product myself, or I decide not to.

I am attaching or pasting:
1. My account inventory. Required columns: account, named_owner, still_with_company, mfa, last_restore_test, shared_login, holds_customer_or_money_data, plus the inventory's as-of date. Optional: a user-list export I already downloaded.
2. My readiness rules from the Skip Rules and Severity Ladder Worksheet.
3. Last quarter's closure log, if I have one.

STEP 1 - CHECK THE DATA
- Use the inventory's as-of date, not today's date. If there is no as-of date, stop and ask me for it before building the queue.
- Do not invent MFA status, restore-test dates, employment status, or shared-login flags. Use only values I entered. last_restore_test = n/a is not treated as never.
- If a remaining row is missing still_with_company, mfa, or holds_customer_or_money_data, or the same account name appears twice, do not rank it. List it under NEEDS YOUR CHECK.

STEP 2 - SKIP RULES
Apply the skip rules before ranking. Skipped accounts are never ranked and never given a HIGH or MEDIUM label. List every skipped account as:
SKIPPED: <account> (<reason>)
Use these reasons:
- holds_customer_or_money_data = no: "personal-only; holds customer or money data = no".
- Account I marked out of scope: "marked out of scope by you".
- Missing an account name: "missing an account name".

STEP 3 - SEVERITY LADDER
Apply my owner-approved severity ladder to the remaining rows. Default HIGH, in this rank order within HIGH: still_with_company = no (former staff still listed); then mfa = off and holds_customer_or_money_data = yes; then last_restore_test = never and holds_customer_or_money_data = yes. An account that matches more than one HIGH rule stays one row and lists every matching reason.
Default MEDIUM: shared_login = yes on an admin account. If the same account is already HIGH, list MEDIUM as an extra reason on that HIGH row; do not create a second row.
Rank every HIGH row before any MEDIUM-only row. Never output a LOW band.

STEP 4 - ACTIONS
Suggested actions may only tell me what to do myself in the real product: remove access, turn on MFA, run a restore test and record the date, or give a shared admin login a named owner.
If a shared POS or admin login is flagged, warn me not to turn off the shared login until a named login can open that product.
Recommend at most 5 actions this quarter. If more HIGH items remain, list them as "not in this quarter's five; keep in the log".

OUTPUT FORMAT
QUARTERLY QUEUE as of <as-of date>. This does not certify the company as secure.
For each ranked account, in order:
<rank>. <account> — <named_owner>.
CONFIRMED: <fields taken from the inventory>
Severity: HIGH and/or MEDIUM with the matching reasons.
Suggested action: <what I should do myself in the real product>
Then:
SKIPPED: one line per skipped account with its reason.
NEEDS YOUR CHECK: any rows you could not rank, or "none".
AI INTERPRETATION: the rows only repeat what I entered and do not prove that an account was misused.
RECOMMENDED ACTION: pick up to 5 items, assign who will do them, and set a check date.

Never use the words secure, compliant, certified, audit passed, or hardened as a claim about the business. Every queue must include the sentence "This does not certify the company as secure."
Label CONFIRMED facts, AI INTERPRETATION, and RECOMMENDED ACTION separately. Do not present a guess as a fact. Nothing is scanned, disabled, or changed automatically. I will check every CONFIRMED field against the inventory row before I change anything in a real product.`;

export const NEXT_QUARTER_PROMPT = `This is the quarter-to-quarter update for my security readiness queue. You prepare; I decide.

Do not scan. Do not certify. Do not connect to a vendor, change a password, disable an account, or turn on MFA. I make every change in the real product myself.

I am attaching or pasting this quarter's inventory with its as-of date, my readiness rules, and the closure log I updated after last quarter's run. The closure log has the columns quarter_of, account, named_owner, action_taken, outcome, check_date, notes. Allowed outcomes are closed, still open, skipped, and deferred. Only I record outcomes. Treat the closure log as what I entered; do not correct or extend it.

Before building the queue:
1. Match each closure log entry to the new inventory by account name.
2. Closed items stay in the log so they are not forgotten if they reopen. If a closed account is gone from the inventory, list it under CLOSED and keep the log row.
3. If a closed account is still listed in the new inventory with the same HIGH reason (for example former staff still listed), return it to the HIGH queue as still open.
4. Rank HIGH items that are still open. Keep skipped personal-only and out-of-scope accounts skipped with their reasons.
5. Use the new inventory's as-of date, not today's date.

Then apply my readiness rules: apply the skip rules before ranking, apply the severity ladder, rank HIGH then MEDIUM, and suggest actions I must take myself in the real product. Never label the business secure, compliant, or certified.

OUTPUT FORMAT
QUEUE as of <new as-of date>. This does not certify the company as secure.
CLOSED: <account> (<what I recorded>; stays in the log)
<rank>. <account>, HIGH or MEDIUM (<reasons from the new inventory and log>). CONFIRMED: <facts>. Suggested action: <text>
SKIPPED: <account> (<reason>)
NEEDS YOUR CHECK: rows where the inventory and the closure log disagree, or "none".
AI INTERPRETATION: the rows only repeat what I entered and do not prove that an account was misused.
RECOMMENDED ACTION: I change it in the real product; the kit changes nothing.

Do not change my closure log. I decide which items to act on this quarter, who will do them, and the check date.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "Each CONFIRMED field matches the inventory row for that account.",
  "Every skipped account is listed with its skip reason.",
  "The output includes the sentence \"This does not certify the company as secure.\"",
  "I picked at most 5 actions this quarter.",
  "Each picked action has a named person who will do it.",
  "Each picked action has a check date.",
  "I will make any change in the real product myself. The kit changes nothing.",
  "The output does not tell me to scan, connect, change a password, or disable an account from the kit.",
  "If a shared POS or admin login is flagged, I will add a named owner before turning off the shared login.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload an inventory. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Keep former-staff names only as you typed them, and delete them from the AI chat after the run.",
  "Do not paste passwords, recovery codes, or MFA secrets.",
  "Do not scan, probe, or test systems you do not own, and do not treat the output as a reason to do so.",
  "Do not disable the only POS login until a named login can open that product. Add a named owner first.",
  "Nothing is scanned, disabled, or changed automatically. You change accounts in the real product. The kit changes nothing.",
  "Atlas does not connect to a bank, POS, payroll, Google Workspace, Microsoft 365, or any other vendor. It has no OAuth flow, no API call, no network scan, and does not upload your data to any third party.",
  "The ranking only reflects rows you entered. Incomplete inventories can miss HIGH items. Never treat the output as a claim that the business is secure, compliant, or certified.",
] as const;

export const HIGH_RULE_ERROR = "Turn on at least one HIGH rule.";

export type ReadinessRulesInput = {
  outOfScope: string;
  formerStaff: boolean;
  mfaOff: boolean;
  restoreNever: boolean;
  sharedLogin: boolean;
};

export const DEFAULT_RULES_INPUT: ReadinessRulesInput = {
  outOfScope: "",
  formerStaff: true,
  mfaOff: true,
  restoreNever: true,
  sharedLogin: true,
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

export function generateReadinessRules(input: ReadinessRulesInput): RulesResult {
  if (!input.formerStaff && !input.mfaOff && !input.restoreNever) {
    return { ok: false, errors: [HIGH_RULE_ERROR] };
  }

  const skipAccounts = input.outOfScope
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const lines = [
    "MY READINESS RULES",
    "Skip personal-only accounts (holds customer or money data = no).",
    ...skipAccounts.map((name) => `Always skip: ${name}`),
    ...(input.formerStaff ? ["HIGH: former staff still listed."] : []),
    ...(input.mfaOff
      ? ["HIGH: MFA off on an account that holds customer or money data."]
      : []),
    ...(input.restoreNever
      ? ["HIGH: backup restore never tested on an account that holds customer or money data."]
      : []),
    ...(input.sharedLogin ? ["MEDIUM: shared login on an admin account."] : []),
    "Never label the business secure, compliant, or certified.",
    "Do not scan, connect, change passwords, or disable accounts.",
    "Pick at most 5 actions this quarter.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
