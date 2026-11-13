import type { UiLocale } from "@/src/lib/i18n/locale";
import { payrollCopy } from "./copy";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "Next-Pay Labor Check Setup Checklist" },
  { id: "labor-check-prompt", title: "Next-Pay Labor Check Prompt" },
  { id: "variance-prompt", title: "Actual-Versus-Projected Prompt" },
  // Checklist sits before the worksheet so keyboard QA reaches checkboxes before
  // the worksheet's many labelled fields fill the Tab-scan budget.
  { id: "schedule-review-checklist", title: "Schedule Edit Review Checklist" },
  { id: "rules-worksheet", title: "Labor Target and Overtime Rules Worksheet" },
  { id: "workbook-template", title: "Loaded Payroll Workbook Template" },
  { id: "sample-exports", title: "Fictional Sample Schedule Export" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write the employer load factor, target labor percentage of revenue, overtime multiplier, overtime flag rule (for example flag if any role has overtime hours > 0), and any minimum coverage rule by role. You decide the load factor, target, overtime rule, and whether a coverage floor applies.",
  "Export the next pay period's scheduled hours by role (or by person with names removed), hourly rates by role, overtime hours already on the schedule, and a revenue figure for the same period (POS export or owner estimate labelled as such). You decide which columns to keep. Remove employee names, tax IDs, bank details, and other columns the workflow does not need. This is an export review, not a live scheduling, time-clock, POS, or payroll connection.",
  "Atlas does not connect to a scheduling tool, time clock, POS, payroll provider, QuickBooks, or any other vendor.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the rows as text instead, or do not use AI for this data at all.",
  "Paste the Next-Pay Labor Check Prompt and your rules from the Labor Target and Overtime Rules Worksheet, then attach or paste the schedule and rate rows plus the revenue figure.",
  "Use the Schedule Edit Review Checklist and check every CONFIRMED dollar and hour against the export row. You edit the next schedule in your own scheduling tool, or you change nothing. The Blueprint never changes shifts, pay, or payroll. After the pay run, paste the Actual-Versus-Projected Prompt with the actual payroll total and record the variance.",
] as const;

export const LABOR_CHECK_PROMPT = `You are helping me run a NEXT-PAY LABOR CHECK from a pasted schedule export and my labor rules. You prepare; I decide.

Do not invent hours, rates, overtime, load factors, revenue, or savings totals. Do not edit shifts or payroll. You edit the schedule in your own tool. The kit changes nothing. Do not cut hours that break my minimum coverage.

I am pasting:
1. My labor rules from the Labor Target and Overtime Rules Worksheet.
2. Schedule rows with role, scheduled_hours, hourly_rate, and overtime_hours_in_schedule, plus a same-period revenue figure labelled as POS export or owner estimate.

NEXT-PAY LABOR CHECK FIRST
Write NEXT-PAY LABOR CHECK and finish the arithmetic before any schedule-edit suggestion or interpretation.
Use the export's own pay_period dates, not today's date. If the CSV has no pay period, ask me for it before calculating.

Regular hours for a role equal scheduled_hours minus overtime_hours_in_schedule. Leave every formula visible as text (for example =124*22 and =4*33).
Overtime pay uses only my stated overtime multiplier on the stated hourly rate. Do not invent a multiplier or a different OT rate.
Loaded payroll equals base pay times my employer load factor. Leave the formula visible (for example =4012*1.20).
Labor percentage equals loaded payroll divided by the period's revenue figure. Leave the formula visible. Label the revenue figure OWNER-ENTERED when it is an estimate, and do not treat an estimate as a confirmed forecast.

Flag only when calculated loaded labor percentage is above my target, or when a role's overtime_hours_in_schedule exceeds my overtime rule. Do not flag a single busy day.
If a remaining row is missing role, scheduled_hours, or hourly_rate, or the same role appears twice with conflicting rates, do not include it in the totals. List it under NEEDS YOUR CHECK.
If I provided a minimum coverage rule, every schedule-edit option must still respect it. If no coverage rule was provided, say so under NEEDS YOUR CHECK and do not invent one.

Label each point as CONFIRMED (schedule × rate), OWNER-ENTERED (load factor, target, revenue estimate, overtime rule), CALCULATED (formulas and labor percentage), AI INTERPRETATION, or RECOMMENDED ACTION.

OUTPUT FORMAT
NEXT-PAY LABOR CHECK
CONFIRMED: schedule × rate with every formula visible.
OWNER-ENTERED: load factor, target, revenue figure, overtime rule, and any minimum coverage.
CALCULATED: base pay, loaded payroll, and labor percentage with formulas visible.
AI INTERPRETATION: why a gap might exist. Never present it as a confirmed fact.
RECOMMENDED ACTION (you decide): review schedule edits that respect minimum coverage. You edit the schedule in your own tool. The kit changes nothing.

Do not invent. Do not edit. Respect minimum coverage. You edit the schedule.`;

export const VARIANCE_PROMPT = `This prompt is used only after the pay run. You prepare; I decide.

Do not invent the actual payroll total. Do not edit payroll or shifts. You edit the schedule in your own tool. The kit changes nothing.

I am pasting the earlier projected loaded payroll and my OWNER-ENTERED actual payroll total.

Compare the projected loaded payroll to the actual total with a visible variance formula (for example =4960-4814.40).
Label the actual total as OWNER-ENTERED.
If no actual total was provided, say that no actual payroll total was provided.

OUTPUT FORMAT
POST-PAY VARIANCE
OWNER-ENTERED: actual payroll total.
CALCULATED: projected loaded payroll, variance formula, and variance result.
RECOMMENDED ACTION (you decide): whether to trust the projection next period. You edit the schedule in your own tool. The kit changes nothing.

Do not invent. Do not edit. You edit the schedule.`;

export const REVIEW_CHECKLIST_ITEMS = [
  "Every CONFIRMED hour and rate matches the export row.",
  "Load factor and revenue figure are labelled OWNER-ENTERED.",
  "Every regular, overtime, and loaded-payroll formula stays visible as text.",
  "Flags used only my target labor percentage and overtime rule.",
  "A single busy day was not flagged on its own.",
  "An owner-estimated revenue figure was not treated as a confirmed forecast.",
  "Any suggested hour cut still respects my minimum coverage rule.",
  "I will edit the schedule in my own tool myself, or I will change nothing.",
  "The kit changes nothing. Nothing is sent, edited, cancelled, or paid automatically.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload exports. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove employee names, tax IDs, bank details, and other columns the workflow does not need.",
  "Do not paste payroll login passwords, bank account numbers, Social Security numbers, or full employee names into the AI tool.",
  "Do not invent rates or savings, and do not treat an owner-estimated revenue figure as a confirmed forecast.",
  "Do not cut hours that break minimum coverage or local scheduling rules.",
  "You edit the schedule in your own tool yourself, or you decide not to. The kit changes nothing.",
  "Nothing is sent, edited, cancelled, or paid automatically.",
  "Atlas does not connect to a scheduling tool, time clock, POS, payroll provider, QuickBooks, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const LOAD_FACTOR_ERROR = "Enter a load factor greater than 0.";
export const TARGET_LABOR_ERROR =
  "Enter a target labor percentage from 0 to 100.";

export type LaborRulesInput = {
  loadFactor: string;
  targetLabor: string;
  overtimeMultiplier: string;
  overtimeFlagRule: string;
  minimumCoverage: string;
};

export const DEFAULT_RULES_INPUT: LaborRulesInput = {
  loadFactor: "1.20",
  targetLabor: "40",
  overtimeMultiplier: "1.5",
  overtimeFlagRule: "flag if any role has overtime hours > 0",
  minimumCoverage: "",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function parseLoadFactor(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function parseTargetLabor(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100) return null;
  return amount;
}

function linesOf(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function generateLaborCheckRules(
  input: LaborRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const errors: string[] = [];
  const loadFactor = parseLoadFactor(input.loadFactor);
  if (loadFactor === null) {
    errors.push(
      locale === "ja" ? payrollCopy("ja").loadFactorError : LOAD_FACTOR_ERROR,
    );
  }

  const targetLabor = parseTargetLabor(input.targetLabor);
  if (targetLabor === null) {
    errors.push(
      locale === "ja" ? payrollCopy("ja").targetLaborError : TARGET_LABOR_ERROR,
    );
  }

  if (errors.length > 0 || loadFactor === null || targetLabor === null) {
    return { ok: false, errors };
  }

  const coverage = linesOf(input.minimumCoverage);
  const overtimeMultiplier = input.overtimeMultiplier.trim() || "1.5";
  const overtimeFlagRule =
    input.overtimeFlagRule.trim() ||
    "flag if any role has overtime hours > 0";

  if (locale === "ja") {
    return {
      ok: true,
      rules: payrollCopy("ja").reviewRules({
        loadFactor: input.loadFactor.trim(),
        targetLabor: input.targetLabor.trim(),
        overtimeMultiplier,
        overtimeFlagRule,
        minimumCoverage: coverage,
      }),
    };
  }

  const lines = [
    `Employer load factor: ${input.loadFactor.trim()}.`,
    `Target labor % of revenue: ${input.targetLabor.trim()}.`,
    `Overtime multiplier: ${overtimeMultiplier}.`,
    `Overtime flag rule: ${overtimeFlagRule}.`,
    ...(coverage.length > 0
      ? [`Minimum coverage: ${coverage.join("; ")}.`]
      : []),
    "Flag only against your target and overtime rule. Do not flag a single busy day.",
    "Do not invent rates or savings.",
    "Do not edit shifts or payroll. You edit the schedule in your own tool. The kit changes nothing.",
  ];

  return { ok: true, rules: lines.join("\n") };
}
