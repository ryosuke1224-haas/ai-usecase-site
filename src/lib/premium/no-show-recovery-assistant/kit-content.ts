import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "./copy";
import type { NoShowSectionId } from "./copy-types";

const english = noShowCopy("en");

export const PLAN_DIFFERENCE_NOTICE = english.planDifferenceNotice;
export const SESSION_ONLY_NOTICE = english.sessionOnlyNotice;
export const KIT_SECTIONS = english.sections;
export const SETUP_STEPS = english.setupSteps;
export const ATTENDANCE_PROMPT = english.attendancePrompt;
export const REBOOKING_DRAFT_PROMPT = english.rebookingDraftPrompt;
export const REVIEW_CHECKLIST_ITEMS = english.reviewItems;
export const SAFETY_RULES = english.safetyRules;
export const THRESHOLD_ERROR = english.thresholdError;

export type KitSectionId = NoShowSectionId;

export function kitSectionTitle(id: KitSectionId, locale: UiLocale = "en"): string {
  return noShowCopy(locale).sections.find((section) => section.id === id)?.title ?? id;
}

export type RecoveryRulesInput = {
  threshold: string;
  neverStatuses: string;
  alwaysSkip: string;
};

export const DEFAULT_RULES_INPUT: RecoveryRulesInput = {
  threshold: "3",
  neverStatuses: "cancelled",
  alwaysSkip: "",
};

export type RulesResult = { ok: true; rules: string } | { ok: false; errors: string[] };

function parseThreshold(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

export function generateRecoveryRules(
  input: RecoveryRulesInput,
  locale: UiLocale = "en",
): RulesResult {
  const threshold = parseThreshold(input.threshold);
  const copy = noShowCopy(locale);
  if (threshold === null) return { ok: false, errors: [copy.thresholdError] };

  const neverStatuses = input.neverStatuses
    .split(/\r?\n/)
    .map((status) => status.trim())
    .filter(Boolean);
  const skipClients = input.alwaysSkip
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    ok: true,
    rules: copy.recoveryRules({ threshold, neverStatuses, skipClients }),
  };
}
