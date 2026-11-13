import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishExpenseCopy } from "./copy-en";
import { japaneseExpenseCopy } from "./copy-ja";
import type { ExpenseCopy, JapaneseExpenseCopy } from "./copy-types";

export type { ExpenseCopy, ExpenseDemo, ExpenseSection, ExpenseSectionId, JapaneseExpenseCopy } from "./copy-types";

export function expenseCopy(locale: "ja"): JapaneseExpenseCopy;
export function expenseCopy(locale: UiLocale): ExpenseCopy;
export function expenseCopy(locale: UiLocale): ExpenseCopy {
  return locale === "ja" ? japaneseExpenseCopy : englishExpenseCopy;
}
