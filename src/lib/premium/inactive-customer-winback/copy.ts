import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishWinbackCopy } from "./copy-en";
import { japaneseWinbackCopy } from "./copy-ja";
import type { JapaneseWinbackCopy, WinbackCopy } from "./copy-types";

export type {
  JapaneseWinbackCopy,
  WinbackCopy,
  WinbackDemo,
  WinbackSection,
  WinbackSectionId,
} from "./copy-types";

export function winbackCopy(locale: "ja"): JapaneseWinbackCopy;
export function winbackCopy(locale: UiLocale): WinbackCopy;
export function winbackCopy(locale: UiLocale): WinbackCopy {
  return locale === "ja" ? japaneseWinbackCopy : englishWinbackCopy;
}
