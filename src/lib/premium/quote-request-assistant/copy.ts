import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishQuoteCopy } from "./copy-en";
import { japaneseQuoteCopy } from "./copy-ja";
import type { JapaneseQuoteCopy, QuoteCopy } from "./copy-types";

export type {
  JapaneseQuoteCopy,
  QuoteCopy,
  QuoteDemo,
  QuoteSection,
  QuoteSectionId,
} from "./copy-types";

export function quoteCopy(locale: "ja"): JapaneseQuoteCopy;
export function quoteCopy(locale: UiLocale): QuoteCopy;
export function quoteCopy(locale: UiLocale): QuoteCopy {
  return locale === "ja" ? japaneseQuoteCopy : englishQuoteCopy;
}
