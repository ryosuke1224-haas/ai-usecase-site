import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishPayrollCopy } from "./copy-en";
import { japanesePayrollCopy } from "./copy-ja";
import type { JapanesePayrollCopy, PayrollCopy } from "./copy-types";

export type {
  JapanesePayrollCopy,
  PayrollCopy,
  PayrollDemo,
  PayrollSection,
  PayrollSectionId,
} from "./copy-types";

export function payrollCopy(locale: "ja"): JapanesePayrollCopy;
export function payrollCopy(locale: UiLocale): PayrollCopy;
export function payrollCopy(locale: UiLocale): PayrollCopy {
  return locale === "ja" ? japanesePayrollCopy : englishPayrollCopy;
}
