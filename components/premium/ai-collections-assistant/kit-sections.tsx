import type { ReactNode } from "react";
import {
  AGING_COLUMNS,
  ALLOWED_OUTCOMES,
  AS_OF_DATE,
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_TEMPLATE_CSV,
  SAMPLE_AGING_CSV,
  SAMPLE_AGING_ROWS,
  SAMPLE_OUTCOME_LOG,
} from "@/src/lib/premium/ai-collections-assistant/demo-data";
import {
  kitSectionTitle,
  NEXT_WEEK_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  QUEUE_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/ai-collections-assistant/kit-content";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { DraftReviewChecklist } from "./draft-review-checklist";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function KitSection({ id, children }: { id: KitSectionId; children: ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="scroll-mt-20 rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-bold tracking-tight text-foreground">
        {kitSectionTitle(id)}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function PlanNotice() {
  return (
    <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
      {PLAN_DIFFERENCE_NOTICE}
    </p>
  );
}

export function SetupChecklistSection() {
  return (
    <KitSection id="setup-checklist">
      <p className={BODY}>
        Run these steps once a week. Practice first with the Fictional Sample
        Aging Report before you use real customer data.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {SETUP_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <PlanNotice />
    </KitSection>
  );
}

function PromptSection({
  id,
  intro,
  prompt,
}: {
  id: KitSectionId;
  intro: string;
  prompt: string;
}) {
  return (
    <KitSection id={id}>
      <p className={BODY}>{intro}</p>
      <pre className={PRE_BLOCK}>{prompt}</pre>
      <CopyButton text={prompt} label="Copy Prompt" />
    </KitSection>
  );
}

export function QueuePromptSection() {
  return (
    <PromptSection
      id="queue-prompt"
      intro="Paste this prompt with your rules block, then attach or paste the export and last week's outcome log. It applies the skip rules first and labels confirmed facts, interpretation, and recommended actions separately."
      prompt={QUEUE_PROMPT}
    />
  );
}

export function NextWeekPromptSection() {
  return (
    <PromptSection
      id="next-week-prompt"
      intro="Use this the following week with the new export and your updated outcome log. Disputes stay skipped until you mark them resolved, and promises are respected until their date passes."
      prompt={NEXT_WEEK_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set your minimum amount, tone bands, and customers to always skip, then
        generate a rules block to paste with the queue prompt. Nothing you enter
        here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function OutcomeLogTemplateSection() {
  return (
    <KitSection id="outcome-log-template">
      <p className={BODY}>
        Start your own spreadsheet with these columns. Only you record outcomes.
        Next week&apos;s run reads this log, so promised dates are respected and
        disputes stay skipped until you change them. Copy CSV copies the column
        header only. The rows below are a fictional example, and they are not
        included in that copy.
      </p>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Allowed outcomes
        </h3>
        <ul aria-label="Allowed outcomes" className="mt-2 flex flex-wrap gap-2">
          {ALLOWED_OUTCOMES.map((outcome) => (
            <li
              key={outcome}
              className="rounded-md border border-border/60 bg-surface px-2 py-0.5 font-mono text-xs text-foreground"
            >
              {outcome}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Fill promised_date only when the outcome is promised. When you decide a
          dispute is resolved, write resolved in notes.
        </p>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Fictional example rows
      </p>
      <DataTable
        label="Outcome log template with fictional example rows"
        columns={OUTCOME_LOG_COLUMNS}
        monospaceHeader
        rows={SAMPLE_OUTCOME_LOG.map((row) => [
          row.weekOf,
          row.invoice,
          row.customer,
          row.actionTaken,
          row.outcome,
          row.promisedDate,
          row.notes,
        ])}
      />
      <CopyButton text={OUTCOME_LOG_TEMPLATE_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function DraftReviewChecklistSection() {
  return (
    <KitSection id="draft-review-checklist">
      <p className={BODY}>
        Use this before you send each draft. Progress stays in this browser
        session only.
      </p>
      <DraftReviewChecklist />
    </KitSection>
  );
}

export function SampleAgingReportSection() {
  return (
    <KitSection id="sample-aging-report">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same eight invented invoices used in the guided demo, as of{" "}
        {AS_OF_DATE}. Paste them into your AI tool with the queue prompt to
        practice the full workflow before you use real customer data.
      </p>
      <DataTable
        label="Fictional sample aging report"
        columns={AGING_COLUMNS}
        monospaceHeader
        rows={SAMPLE_AGING_ROWS.map((row) => [
          row.invoice,
          row.customer,
          row.amount,
          row.dueDate,
          row.daysOverdue,
          row.status,
          row.notes,
        ])}
      />
      <CopyButton text={SAMPLE_AGING_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function SafetyGuidanceSection() {
  return (
    <KitSection id="safety-guidance">
      <PlanNotice />
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {SAFETY_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
        <li>{SESSION_ONLY_NOTICE}</li>
      </ul>
    </KitSection>
  );
}
