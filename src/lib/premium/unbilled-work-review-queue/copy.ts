import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishUnbilledCopy } from "./copy-en";
import { japaneseUnbilledCopy } from "./copy-ja";
import type { JapaneseUnbilledCopy, UnbilledCopy } from "./copy-types";

export type {
  JapaneseUnbilledCopy,
  UnbilledCopy,
  UnbilledDemo,
  UnbilledSection,
  UnbilledSectionId,
} from "./copy-types";

export function unbilledCopy(locale: "ja"): JapaneseUnbilledCopy;
export function unbilledCopy(locale: UiLocale): UnbilledCopy;
export function unbilledCopy(locale: UiLocale): UnbilledCopy {
  return locale === "ja" ? japaneseUnbilledCopy : englishUnbilledCopy;
}
