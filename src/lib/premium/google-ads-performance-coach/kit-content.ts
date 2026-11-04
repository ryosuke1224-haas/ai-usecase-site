import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Google Ads Performance Setup Checklist" },
  { id: "measurement-review-prompt", title: "Measurement Review Prompt" },
  { id: "period-review-prompt", title: "Period Review Prompt" },
  { id: "rules-worksheet", title: "Qualified Outcome Worksheet" },
  { id: "workbook-template", title: "Calculation Workbook Template" },
  { id: "action-review-checklist", title: "Action Review Checklist" },
  { id: "sample-exports", title: "Fictional Sample Exports" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write the qualified outcome for this business (for example form_submit = completed contact form) and list events that do not count. You decide what a conversion must mean before any number is trusted.",
  "Export the current and previous Google Ads campaign reports as CSV with campaign, clicks, cost, conversions, primary_conversion, and each file's date range. This is an export review, not a live connector. Atlas does not connect to Google Ads or GA4.",
  "Capture the conversion-actions screenshot or table from Google Ads Goals > Conversions > Summary.",
  "Export GA4 Traffic acquisition and Landing page reports for the same two date ranges. Add a search-terms export when the campaign type provides one. You decide which columns to keep. Remove customer emails and other columns the workflow does not need.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Measurement Review Prompt and your rules from the Qualified Outcome Worksheet, then attach or paste the conversion-actions table, the campaign exports, and the GA4 landing-page rows.",
  secondaryPromptSetupStep(
    "Period Review Prompt",
    "only after every in-scope campaign has passed the measurement check",
  ),
  "Use the Action Review Checklist before you change anything in Google Ads. You decide whether to change a primary conversion, wait and re-export, or change nothing. You make any change in Google Ads yourself. The kit changes nothing.",
] as const;

export const MEASUREMENT_REVIEW_PROMPT = `You are helping me review Google Ads measurement before any efficiency ranking. You prepare; I decide.

Do not change bids. Do not edit the Google Ads account. Do not invent clicks, cost, conversions, sessions, events, or savings figures. I make every change in Google Ads myself, or I decide not to.

I am attaching or pasting:
1. My qualified outcome and measurement rules from the Qualified Outcome Worksheet.
2. Current and previous Google Ads campaign exports with campaign, clicks, cost, conversions, primary_conversion, and each file's date range.
3. The conversion-actions table from Goals > Conversions > Summary.
4. GA4 Traffic acquisition and Landing page rows for the same ranges.
5. A search-terms export when the campaign type provides one.

STEP 1 - MEASUREMENT REVIEW FIRST
Write MEASUREMENT REVIEW FIRST before any efficiency ranking, cost-per-conversion comparison, or bid or budget suggestion.
Use each export's own date range, not today's date. If a campaign export has no date range, ask me for it before ranking anything.

STEP 2 - COMPARE THE QUALIFIED OUTCOME
For each in-scope campaign, compare primary_conversion to the qualified outcome I wrote.
A campaign whose primary_conversion does not match the qualified outcome is skipped for efficiency ranking. Show the reason "primary conversion is not the qualified outcome".
page_view is not a qualified outcome unless I said it is.
If the conversion-actions table is missing, or a remaining row is missing campaign, cost, conversions, or primary_conversion, or the same campaign name appears twice in one period, do not rank it. List it under NEEDS YOUR CHECK.
Skip any campaign I marked out of scope. Show the reason "marked out of scope by you".

STEP 3 - LABELS
Label each point as CONFIRMED (from an export or the conversion-actions table), AI INTERPRETATION (a possible explanation), or RECOMMENDED ACTION.
Do not invent numbers. Use only values from the files I pasted.
Do not treat a Google Ads conversion count and a GA4 event count as the same metric. List both as CONFIRMED counts from their own exports. Any cause of a gap is AI INTERPRETATION.
Do not treat a GA4 All Users report as paid Google traffic. If the export is not filtered to paid Google, list it under NEEDS YOUR CHECK.
Search-terms are optional. If the file is missing, write "Search-terms export: not provided" under NEEDS YOUR CHECK. Do not invent queries.

OUTPUT FORMAT
MEASUREMENT REVIEW FIRST
CONFIRMED: one line per fact taken from an export.
SKIPPED FOR EFFICIENCY: <campaign> (primary conversion is not the qualified outcome).
NEEDS YOUR CHECK: missing files or rows, or "none".
AI INTERPRETATION: a failed measurement check means the conversion number is not a qualified outcome, not that the campaign is a proven waste of spend.
RECOMMENDED ACTION (you decide): allowed suggestions are verify tracking, set the qualified outcome as primary, wait, and re-export. Do not change bids, budget, status, or targeting while any in-scope campaign fails the measurement check.

Never claim that spend was wasted or that a change will save money. Nothing is sent, edited, or paid automatically. I will check every CONFIRMED number against the export row before I change anything in Google Ads.`;

export const PERIOD_REVIEW_PROMPT = `This is the period review. Use this prompt only after every in-scope campaign has passed the measurement check. You prepare; I decide.

Do not change bids. Do not invent clicks, cost, conversions, sessions, events, or savings figures. Do not edit the Google Ads account. I make every change in Google Ads myself.

I am attaching or pasting the current and previous period campaign exports, my measurement rules, and the workbook layout. Fill the workbook from export numbers only and leave visible formulas as text (for example =1860/96). Compare the current period to the previous period with current minus previous shown as formula text.

Rules:
- Use only values from the files I pasted. Do not invent a post-fix results file. If I have not attached a new export, say that no new export was provided.
- A cost-per-conversion figure on a campaign that failed measurement may be shown only with meaningful = no and must not be used to rank spend.
- Period differences are calculations from the two exports, not savings claims. Never claim that spend was wasted.
- Search-terms are optional. If the file is missing, write "Search-terms export: not provided" under NEEDS YOUR CHECK.
- Do not recommend bid, budget, status, or targeting changes. Allowed suggestions are wait and re-export.

OUTPUT FORMAT
For each campaign that passed measurement:
CONFIRMED: clicks, cost, conversions, and primary_conversion from each period.
Workbook row with visible formulas such as =cost/conversions and =current-previous.
AI INTERPRETATION: a possible explanation, never presented as a fact.
RECOMMENDED ACTION (you decide): wait, re-export, or change nothing. Do not change bids.

Label CONFIRMED facts, AI INTERPRETATION, and RECOMMENDED ACTION separately. Nothing is sent, edited, or paid automatically.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "The qualified outcome is written down before any conversion number is trusted.",
  "MEASUREMENT REVIEW FIRST ran before any efficiency ranking.",
  "Each CONFIRMED number matches an export row.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "No bid or budget change is recommended while any in-scope campaign failed measurement.",
  "Campaigns that failed measurement are skipped for efficiency ranking.",
  "Google Ads conversion counts and GA4 event counts are listed as separate CONFIRMED numbers and are not forced to match.",
  "I will make any change in Google Ads myself. The kit changes nothing.",
  "I will not change live bids, budgets, or campaign status from a hypothesis.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload exports. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove columns the workflow does not need, including customer emails.",
  "Do not paste Google account passwords, billing account numbers, or customer emails into the AI tool.",
  "Do not treat a GA4 All Users report as paid Google traffic.",
  "Do not force Google Ads and GA4 counts to match. A gap is two CONFIRMED export counts, not a diagnosed tracking bug.",
  "Do not change live bids, budgets, or campaign status from a hypothesis, and do not treat MEASUREMENT REVIEW FIRST as proof that spend was wasted.",
  "Nothing is sent, edited, cancelled, or paid automatically. You change Google Ads yourself. The kit changes nothing.",
  "Atlas does not connect to Google Ads, GA4, Google Analytics, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const QUALIFIED_OUTCOME_ERROR = "Enter a qualified outcome.";
export const DEFAULT_QUALIFIED_OUTCOME = "form_submit — completed contact form";

export type MeasurementRulesInput = {
  qualifiedOutcome: string;
  pageViewDoesNotCount: boolean;
  addToCartDoesNotCount: boolean;
  outOfScope: string;
};

export const DEFAULT_RULES_INPUT: MeasurementRulesInput = {
  qualifiedOutcome: DEFAULT_QUALIFIED_OUTCOME,
  pageViewDoesNotCount: true,
  addToCartDoesNotCount: true,
  outOfScope: "",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

export function generateMeasurementRules(input: MeasurementRulesInput): RulesResult {
  if (!input.qualifiedOutcome.trim()) {
    return { ok: false, errors: [QUALIFIED_OUTCOME_ERROR] };
  }

  const skipCampaigns = input.outOfScope
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const lines = [
    `Qualified outcome: ${input.qualifiedOutcome.trim()}.`,
    ...(input.pageViewDoesNotCount
      ? ["page_view does not count as a qualified outcome."]
      : []),
    ...(input.addToCartDoesNotCount
      ? ["add_to_cart does not count as a qualified outcome."]
      : []),
    ...skipCampaigns.map((name) => `Always skip: ${name}`),
    "Run MEASUREMENT REVIEW FIRST before any efficiency ranking.",
    "If the primary conversion is not the qualified outcome, stop. Do not change bids.",
    "Do not edit the Google Ads account.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
