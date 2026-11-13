import Link from "next/link";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowPaths } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { JapaneseKitSections } from "./ja-kit-sections";
import {
  ActionReviewChecklistSection,
  AttendancePromptSection,
  RebookingDraftPromptSection,
  RecoveryLogTemplateSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleBookingsSection,
  SetupChecklistSection,
} from "./kit-sections";
import { FOCUS_RING } from "./styles";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12";

export function NoShowKitView({
  locale,
  pathLocale,
}: {
  locale: UiLocale;
  pathLocale: UiLocale | null;
}) {
  const copy = noShowCopy(locale);
  const paths = noShowPaths(pathLocale);
  return (
    <div className={PAGE}>
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        {copy.kitEyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{copy.kitTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{copy.kitBody}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">{copy.planDifferenceNotice}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">{copy.sessionOnlyNotice}</p>
      <nav aria-label={copy.kitNavLabel} className="mt-8 rounded-2xl border border-border/60 bg-surface p-4 sm:p-5">
        <h2 className={`text-sm font-semibold text-muted ${locale === "ja" ? "" : "uppercase tracking-wider"}`}>
          {copy.inThisKit}
        </h2>
        <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {copy.sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`inline-block max-w-full rounded text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-8 space-y-6">
        {locale === "ja" ? (
          <JapaneseKitSections />
        ) : (
          <>
            <SetupChecklistSection />
            <AttendancePromptSection />
            <RebookingDraftPromptSection />
            <RulesWorksheetSection />
            <RecoveryLogTemplateSection />
            <ActionReviewChecklistSection />
            <SampleBookingsSection />
            <SafetyGuidanceSection />
          </>
        )}
      </div>
      <Link href={paths.demo} className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}>
        {copy.backToDemo}
      </Link>
    </div>
  );
}
