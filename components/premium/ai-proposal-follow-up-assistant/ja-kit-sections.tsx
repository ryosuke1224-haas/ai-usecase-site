import type { ReactNode } from "react";
import { proposalCopy } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy";
import type { ProposalSectionId } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy-types";
import {
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_CSV,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  SAMPLE_PROPOSAL_CSV,
} from "@/src/lib/premium/ai-proposal-follow-up-assistant/demo-data";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { FollowUpReviewChecklist } from "./follow-up-review-checklist";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: ProposalSectionId;
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
  const copy = proposalCopy("ja");
  const section = (id: ProposalSectionId) => copy.sections.find((item) => item.id === id);

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
        id="silence-queue-prompt"
        title={section("silence-queue-prompt")?.title ?? "silence-queue-prompt"}
      >
        <p className={BODY}>{copy.silenceQueuePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.silenceQueuePrompt}</pre>
        <CopyButton
          text={copy.silenceQueuePrompt}
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
        id="follow-up-review-checklist"
        title={section("follow-up-review-checklist")?.title ?? "follow-up-review-checklist"}
      >
        <p className={BODY}>{copy.checklistIntro}</p>
        <FollowUpReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section
        id="sample-proposal-export"
        title={section("sample-proposal-export")?.title ?? "sample-proposal-export"}
      >
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <pre className={PRE_BLOCK}>{SAMPLE_PROPOSAL_CSV}</pre>
        <CopyButton
          text={SAMPLE_PROPOSAL_CSV}
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
