import Link from "next/link";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { staffingPaths } from "@/src/lib/i18n/locale";
import { staffingCopy } from "@/src/lib/premium/ai-staffing-optimizer/copy";
import { KIT_SECTIONS } from "@/src/lib/premium/ai-staffing-optimizer/kit-content";
import { JapaneseKitSections } from "./ja-kit-sections";
import {
  CoverageCheckPromptSection,
  RecheckPromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleExportsSection,
  ScheduleReviewChecklistSection,
  SetupChecklistSection,
  WorkbookTemplateSection,
} from "./kit-sections";
import { FOCUS_RING } from "./styles";

const PAGE = "mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12";

export function StaffingKitView({
  locale,
  pathLocale,
}: {
  locale: UiLocale;
  pathLocale: UiLocale | null;
}) {
  const copy = staffingCopy(locale);
  const paths = staffingPaths(pathLocale);
  const sections = locale === "ja" ? staffingCopy("ja").sections : KIT_SECTIONS;
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
          {sections.map((section, index) => (
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
            <CoverageCheckPromptSection />
            <RecheckPromptSection />
            <ScheduleReviewChecklistSection />
            <RulesWorksheetSection />
            <WorkbookTemplateSection />
            <SampleExportsSection />
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
