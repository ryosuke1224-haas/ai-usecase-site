import type { ReactNode } from "react";
import { staffingCopy } from "@/src/lib/premium/ai-staffing-optimizer/copy";
import type { StaffingSectionId } from "@/src/lib/premium/ai-staffing-optimizer/copy-types";
import {
  HOURLY_COLUMNS,
  HOURLY_ROWS,
  hourlyCells,
  SAMPLE_HOURLY_CSV,
  WORKBOOK_COLUMNS,
  WORKBOOK_CSV,
  WORKBOOK_ROWS,
  workbookCells,
} from "@/src/lib/premium/ai-staffing-optimizer/demo-data";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { ScheduleReviewChecklist } from "./schedule-review-checklist";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: StaffingSectionId;
  title: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-20 rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Japanese kit body. Canonical English sections stay untouched. */
export function JapaneseKitSections() {
  const copy = staffingCopy("ja");
  const section = (id: StaffingSectionId) => copy.sections.find((item) => item.id === id);

  return (
    <>
      <Section id="setup-checklist" title={section("setup-checklist")?.title ?? "setup-checklist"}>
        <p className={BODY}>{section("setup-checklist")?.intro}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          {copy.planDifferenceNotice}
        </p>
      </Section>
      <Section id="coverage-check-prompt" title={section("coverage-check-prompt")?.title ?? "coverage-check-prompt"}>
        <p className={BODY}>{copy.coveragePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.coveragePrompt}</pre>
        <CopyButton
          text={copy.coveragePrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="recheck-prompt" title={section("recheck-prompt")?.title ?? "recheck-prompt"}>
        <p className={BODY}>{copy.recheckPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.recheckPrompt}</pre>
        <CopyButton
          text={copy.recheckPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section
        id="schedule-review-checklist"
        title={section("schedule-review-checklist")?.title ?? "schedule-review-checklist"}
      >
        <p className={BODY}>{copy.checklistIntro}</p>
        <ScheduleReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section id="workbook-template" title={section("workbook-template")?.title ?? "workbook-template"}>
        <p className={BODY}>{copy.workbookIntro}</p>
        <DataTable
          label={copy.workbookTableLabel}
          columns={WORKBOOK_COLUMNS}
          monospaceHeader
          rows={WORKBOOK_ROWS.map(workbookCells)}
        />
        <CopyButton text={WORKBOOK_CSV} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
      </Section>
      <Section id="sample-exports" title={section("sample-exports")?.title ?? "sample-exports"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <p className={BODY}>{copy.fieldMap}</p>
        <DataTable
          label={copy.sampleTableLabel}
          columns={HOURLY_COLUMNS}
          monospaceHeader
          rows={HOURLY_ROWS.map(hourlyCells)}
        />
        <CopyButton
          text={SAMPLE_HOURLY_CSV}
          label={copy.copyCsv}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="safety-guidance" title={section("safety-guidance")?.title ?? "safety-guidance"}>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          {copy.planDifferenceNotice}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.safetyRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
          <li>{copy.sessionOnlyNotice}</li>
        </ul>
      </Section>
    </>
  );
}
