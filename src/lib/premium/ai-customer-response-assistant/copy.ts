import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishReplyCopy } from "./copy-en";
import { japaneseReplyCopy } from "./copy-ja";
import type { JapaneseReplyCopy, ReplyCopy } from "./copy-types";

export type {
  JapaneseReplyCopy,
  ReplyCopy,
  ReplyDemo,
  ReplySection,
  ReplySectionId,
} from "./copy-types";

export function replyCopy(locale: "ja"): JapaneseReplyCopy;
export function replyCopy(locale: UiLocale): ReplyCopy;
export function replyCopy(locale: UiLocale): ReplyCopy {
  return locale === "ja" ? japaneseReplyCopy : englishReplyCopy;
}
