import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishStaffingCopy } from "./copy-en";
import { japaneseStaffingCopy } from "./copy-ja";
import type { JapaneseStaffingCopy, StaffingCopy } from "./copy-types";

export type {
  JapaneseStaffingCopy,
  StaffingCopy,
  StaffingDemo,
  StaffingSection,
  StaffingSectionId,
} from "./copy-types";

export function staffingCopy(locale: "ja"): JapaneseStaffingCopy;
export function staffingCopy(locale: UiLocale): StaffingCopy;
export function staffingCopy(locale: UiLocale): StaffingCopy {
  return locale === "ja" ? japaneseStaffingCopy : englishStaffingCopy;
}
