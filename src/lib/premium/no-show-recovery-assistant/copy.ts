import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishNoShowCopy } from "./copy-en";
import { japaneseNoShowCopy } from "./copy-ja";
import type { NoShowCopy } from "./copy-types";

export type { NoShowCopy, NoShowSection, NoShowSectionId } from "./copy-types";

export function noShowCopy(locale: UiLocale): NoShowCopy {
  return locale === "ja" ? japaneseNoShowCopy : englishNoShowCopy;
}
