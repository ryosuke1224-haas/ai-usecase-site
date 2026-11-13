import type { UiLocale } from "@/src/lib/i18n/locale";
import { staffingCopy } from "./copy";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Coverage Check Setup Checklist" },
  { id: "coverage-check-prompt", title: "Coverage Check Prompt" },
  { id: "recheck-prompt", title: "Four-Week Re-Check Prompt" },
  // Checklist sits before the worksheet so keyboard QA reaches checkboxes before
  // the worksheet's many labelled fields fill the Tab-scan budget.
  { id: "schedule-review-checklist", title: "Schedule Change Review Checklist" },
  { id: "rules-worksheet", title: "Staffing Rules Worksheet" },
  { id: "workbook-template", title: "Hourly Coverage Workbook Template" },
  { id: "sample-exports", title: "Fictional Sample Hourly Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write the minimum staff per open hour (or by role), a target range of transactions per staff-hour, roles that cannot be cut (such as the keyholder), and day-parts with non-sales work (prep, restocking, cleaning). You decide the minimum, the target range, protected roles, and which quiet hours still need coverage for non-sales work.",
  "Export 4-8 weeks of hourly transactions or sales from the POS, and clocked hours by hour from the time-clock or scheduling app, then remove employee names, pay rates, tax IDs, and other columns the workflow does not need. You decide which columns to keep. This is an export review, not a live POS, scheduling, or time-clock connection.",
  "Atlas does not connect to a POS, scheduling tool, time clock, payroll provider, or any other vendor.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Coverage Check Prompt and your rules from the Staffing Rules Worksheet, then attach or paste the aligned hourly rows.",
  "Use the Schedule Change Review Checklist and check every CONFIRMED transactions-per-staff-hour figure against the export rows. You edit the next schedule in your own scheduling tool, or you change nothing. The Blueprint never edits schedules, posts shifts, or contacts staff. After about 4 weeks, paste the Four-Week Re-Check Prompt with a new export for the same flagged blocks.",
] as const;

export const COVERAGE_CHECK_PROMPT = `You are helping me run a SHIFT COVERAGE VS DEMAND CHECK from a pasted hourly export and my staffing rules. You prepare; I decide.

Do not invent transaction counts, staff counts, savings, labor-cost percentages, or return-on-investment claims. Do not edit schedules or contact staff. You edit the schedule in your own tool. The kit changes nothing. Do not cut below my minimum staff.

I am pasting:
1. My staffing rules from the Staffing Rules Worksheet.
2. Aligned hourly rows with day, hour, week1_tx through week4_tx, and week1_staff through week4_staff (names removed).

OWNER RULES FIRST
Write OWNER RULES FIRST and finish the arithmetic before any schedule-change suggestion or interpretation.

Transactions per staff-hour for a week equals that week's transactions divided by that week's staff count for the same day-part. Leave every formula visible as text (for example =12/4 and =90/3).
Flag a day-part only when transactions per staff-hour is outside my target range in at least 3 of the weeks in the export (or my stated N of M pattern). Do not flag a single bad day.
Never recommend staffing below my written minimum for that open hour. If a cut would break the minimum, say so and stop at the minimum.
Never recommend cutting a role on my protected-role list (for example keyholder).
If a remaining row is missing day, hour, a week of transactions, or a week of staff, or staff is 0, do not include that week in the pattern count. List it under NEEDS YOUR CHECK.
A quiet POS hour is CONFIRMED low transactions per staff-hour only. Possible prep, restocking, or cleaning needs are AI INTERPRETATION unless I labelled that day-part as non-sales work in the rules.
Include a reminder to check local scheduling, break, and predictive-scheduling rules before changing posted shifts. The export cannot show those rules.

Label each point as CONFIRMED (calculated from the exports), OWNER-ENTERED (minimum, target range, pattern rule, protected roles, or non-sales day-parts), AI INTERPRETATION, or RECOMMENDED ACTION.

OUTPUT FORMAT
OWNER RULES FIRST
COVERAGE CHECK
CONFIRMED: transactions per staff-hour with every formula visible.
OWNER-ENTERED: minimum, target range, pattern rule, protected roles, non-sales day-parts.
AI INTERPRETATION: possible causes the data cannot confirm. Never present it as a confirmed fact.
RECOMMENDED ACTION (you decide): a coverage-safe shift move that never drops below my minimum. You edit the schedule in your own tool. The kit changes nothing. Do not cut below your minimum staff. Check local scheduling and break rules before changing posted shifts.

Do not invent. Do not edit. Respect the minimum. You edit the schedule.`;

export const RECHECK_PROMPT = `This prompt is used only after about 4 weeks for a re-check of previously flagged day-parts. You prepare; I decide.

Do not invent the new week numbers. Do not edit the schedule. You edit the schedule in your own tool. The kit changes nothing.

I am pasting a new export for the same previously flagged day-parts, plus my earlier OWNER-ENTERED target range and minimum.

Recalculate transactions per staff-hour for each previously flagged block with every formula left visible as text.
Compare whether each block moved into the target range.
If no new export was provided, say that no new export was provided.

OUTPUT FORMAT
FOUR-WEEK RE-CHECK
CONFIRMED: recalculated transactions per staff-hour with formulas visible, and whether each block is inside or outside the target.
RECOMMENDED ACTION (you decide): whether to keep, reverse, or further adjust the schedule change. You edit the schedule in your own tool. The kit changes nothing.

Do not invent. Do not edit. You edit the schedule.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "Every CONFIRMED transactions-per-staff-hour figure matches the export rows.",
  "Flags used the 3-of-4 (or my owner-set) pattern rule rather than a single week.",
  "Recommendations never drop below my minimum staff rule.",
  "Protected roles were not cut.",
  "Quiet hours with possible prep were not treated as confirmed overstaffing alone.",
  "Local scheduling and break rules were considered.",
  "Every formula stayed visible as text.",
  "I will edit the schedule in my own tool myself, or I will change nothing.",
  "The kit changes nothing. Nothing is sent, edited, cancelled, or paid automatically.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload exports. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove employee names, pay rates, tax IDs, and other columns the workflow does not need.",
  "Do not paste scheduling-system passwords, bank account numbers, Social Security numbers, or full employee names into the AI tool.",
  "Do not recommend coverage below a safe or legally required minimum, and do not ignore non-sales work in quiet hours.",
  "Do not invent savings or return-on-investment claims.",
  "Check local scheduling and break rules before changing posted shifts.",
  "You edit the schedule in your own tool yourself, or you decide not to. The kit changes nothing.",
  "Nothing is sent, edited, cancelled, or paid automatically.",
  "Atlas does not connect to a POS, scheduling tool, time clock, payroll provider, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const MINIMUM_STAFF_ERROR = "Enter a minimum staff of 1 or more.";
export const TARGET_RANGE_ERROR =
  "Enter a target range with low less than or equal to high.";

export type StaffingRulesInput = {
  minimumStaff: string;
  targetLow: string;
  targetHigh: string;
  flagN: string;
  flagM: string;
  protectedRoles: string;
  nonSalesDayParts: string;
};

export const DEFAULT_RULES_INPUT: StaffingRulesInput = {
  minimumStaff: "2",
  targetLow: "15",
  targetHigh: "25",
  flagN: "3",
  flagM: "4",
  protectedRoles: "keyholder",
  nonSalesDayParts: "",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 1) {
    return null;
  }
  return amount;
}

function parseNonNegativeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function linesOf(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function generateStaffingRules(
  input: StaffingRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const errors: string[] = [];
  const minimumStaff = parsePositiveInt(input.minimumStaff);
  if (minimumStaff === null) {
    errors.push(
      locale === "ja" ? staffingCopy("ja").minimumStaffError : MINIMUM_STAFF_ERROR,
    );
  }

  const targetLow = parseNonNegativeNumber(input.targetLow);
  const targetHigh = parseNonNegativeNumber(input.targetHigh);
  if (
    targetLow === null ||
    targetHigh === null ||
    targetLow > targetHigh
  ) {
    errors.push(
      locale === "ja" ? staffingCopy("ja").targetRangeError : TARGET_RANGE_ERROR,
    );
  }

  if (errors.length > 0 || minimumStaff === null || targetLow === null || targetHigh === null) {
    return { ok: false, errors };
  }

  const flagN = input.flagN.trim() || "3";
  const flagM = input.flagM.trim() || "4";
  const protectedRoles = linesOf(input.protectedRoles);
  const nonSales = linesOf(input.nonSalesDayParts);

  if (locale === "ja") {
    return {
      ok: true,
      rules: staffingCopy("ja").reviewRules({
        minimumStaff: input.minimumStaff.trim(),
        targetLow: input.targetLow.trim(),
        targetHigh: input.targetHigh.trim(),
        flagN,
        flagM,
        protectedRoles,
        nonSalesDayParts: nonSales,
      }),
    };
  }

  const lines = [
    `Minimum staff on floor: ${input.minimumStaff.trim()}.`,
    `Target transactions per staff-hour: ${input.targetLow.trim()}-${input.targetHigh.trim()}.`,
    `Flag only when outside target in at least ${flagN} of ${flagM} weeks.`,
    ...(protectedRoles.length > 0
      ? [`Protected roles: ${protectedRoles.join("; ")}.`]
      : []),
    ...(nonSales.length > 0
      ? [`Non-sales day-parts: ${nonSales.join("; ")}.`]
      : []),
    "Do not invent transaction counts or savings.",
    "Do not edit schedules or contact staff. You edit the schedule in your own tool. The kit changes nothing.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
