import type { ReactNode } from "react";
import { pipelineCopy } from "@/src/lib/premium/ai-pipeline-risk-detector/copy";
import type { PipelineSectionId } from "@/src/lib/premium/ai-pipeline-risk-detector/copy-types";
import {
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_CSV,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  SAMPLE_DEAL_CSV,
} from "@/src/lib/premium/ai-pipeline-risk-detector/demo-data";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RecoveryReviewChecklist } from "./recovery-review-checklist";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: PipelineSectionId;
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
  const copy = pipelineCopy("ja");
  const section = (id: PipelineSectionId) => copy.sections.find((item) => item.id === id);

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
      <Section
        id="stall-queue-prompt"
        title={section("stall-queue-prompt")?.title ?? "stall-queue-prompt"}
      >
        <p className={BODY}>{copy.stallQueuePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.stallQueuePrompt}</pre>
        <CopyButton
          text={copy.stallQueuePrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="next-week-prompt" title={section("next-week-prompt")?.title ?? "next-week-prompt"}>
        <p className={BODY}>{copy.nextWeekPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.nextWeekPrompt}</pre>
        <CopyButton
          text={copy.nextWeekPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section
        id="outcome-log-template"
        title={section("outcome-log-template")?.title ?? "outcome-log-template"}
      >
        <p className={BODY}>{copy.outcomeLogIntro}</p>
        <DataTable
          label="結果ログのひな形"
          columns={OUTCOME_LOG_COLUMNS}
          monospaceHeader
          rows={OUTCOME_LOG_ROWS.map((row) => outcomeLogCells(row))}
        />
        <CopyButton
          text={OUTCOME_LOG_CSV}
          label={copy.copyCsv}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section
        id="recovery-review-checklist"
        title={section("recovery-review-checklist")?.title ?? "recovery-review-checklist"}
      >
        <p className={BODY}>{copy.checklistIntro}</p>
        <RecoveryReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section
        id="sample-deal-export"
        title={section("sample-deal-export")?.title ?? "sample-deal-export"}
      >
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <pre className={PRE_BLOCK}>{SAMPLE_DEAL_CSV}</pre>
        <CopyButton
          text={SAMPLE_DEAL_CSV}
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
