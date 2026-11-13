import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishAdsCopy } from "./copy-en";
import { japaneseAdsCopy } from "./copy-ja";
import type { AdsCopy, JapaneseAdsCopy } from "./copy-types";

export type { AdsCopy, AdsDemo, AdsSection, AdsSectionId, JapaneseAdsCopy } from "./copy-types";

export function adsCopy(locale: "ja"): JapaneseAdsCopy;
export function adsCopy(locale: UiLocale): AdsCopy;
export function adsCopy(locale: UiLocale): AdsCopy {
  return locale === "ja" ? japaneseAdsCopy : englishAdsCopy;
}
