import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishPipelineCopy } from "./copy-en";
import { japanesePipelineCopy } from "./copy-ja";
import type { JapanesePipelineCopy, PipelineCopy } from "./copy-types";

export type {
  JapanesePipelineCopy,
  PipelineCopy,
  PipelineDemo,
  PipelineSection,
  PipelineSectionId,
} from "./copy-types";

export function pipelineCopy(locale: "ja"): JapanesePipelineCopy;
export function pipelineCopy(locale: UiLocale): PipelineCopy;
export function pipelineCopy(locale: UiLocale): PipelineCopy {
  return locale === "ja" ? japanesePipelineCopy : englishPipelineCopy;
}
