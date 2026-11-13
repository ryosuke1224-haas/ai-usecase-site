import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishProposalCopy } from "./copy-en";
import { japaneseProposalCopy } from "./copy-ja";
import type { JapaneseProposalCopy, ProposalCopy } from "./copy-types";

export type {
  JapaneseProposalCopy,
  ProposalCopy,
  ProposalDemo,
  ProposalSection,
  ProposalSectionId,
} from "./copy-types";

export function proposalCopy(locale: "ja"): JapaneseProposalCopy;
export function proposalCopy(locale: UiLocale): ProposalCopy;
export function proposalCopy(locale: UiLocale): ProposalCopy {
  return locale === "ja" ? japaneseProposalCopy : englishProposalCopy;
}
