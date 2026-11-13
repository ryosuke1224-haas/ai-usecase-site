import type { ReactNode } from "react";
import { unbilledCopy } from "@/src/lib/premium/unbilled-work-review-queue/copy";
import type { UnbilledSectionId } from "@/src/lib/premium/unbilled-work-review-queue/copy-types";
import {
  BILLING_LOG_COLUMNS,
  BILLING_LOG_CSV,
  BILLING_LOG_ROWS,
  billingLogCells,
  SAMPLE_JOB_CSV,
} from "@/src/lib/premium/unbilled-work-review-queue/demo-data";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { OutlineReviewChecklist } from "./outline-review-checklist";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: UnbilledSectionId;
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
  const copy = unbilledCopy("ja");
  const section = (id: UnbilledSectionId) => copy.sections.find((item) => item.id === id);

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
      <Section id="queue-prompt" title={section("queue-prompt")?.title ?? "queue-prompt"}>
        <p className={BODY}>{copy.queuePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.queuePrompt}</pre>
        <CopyButton
          text={copy.queuePrompt}
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
      <Section id="billing-log-template" title={section("billing-log-template")?.title ?? "billing-log-template"}>
        <p className={BODY}>{copy.billingLogIntro}</p>
        <p className="text-sm leading-relaxed text-foreground">
          {copy.allowedOutcomesLabel}: {copy.allowedOutcomes.join("、")}
        </p>
        <DataTable
          label="請求ログのひな形"
          columns={BILLING_LOG_COLUMNS}
          monospaceHeader
          rows={BILLING_LOG_ROWS.map((row) => billingLogCells(row))}
        />
        <CopyButton text={BILLING_LOG_CSV} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
      </Section>
      <Section
        id="outline-review-checklist"
        title={section("outline-review-checklist")?.title ?? "outline-review-checklist"}
      >
        <p className={BODY}>{copy.checklistIntro}</p>
        <OutlineReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section id="sample-job-export" title={section("sample-job-export")?.title ?? "sample-job-export"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <pre className={PRE_BLOCK}>{SAMPLE_JOB_CSV}</pre>
        <CopyButton
          text={SAMPLE_JOB_CSV}
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
