import type { ReactNode } from "react";
import {
  BILLING_LOG_COLUMNS,
  BILLING_LOG_CSV,
  BILLING_LOG_ROWS,
  billingLogCells,
  SAMPLE_JOB_CSV,
} from "@/src/lib/premium/unbilled-work-review-queue/demo-data";
import {
  kitSectionTitle,
  NEXT_WEEK_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  QUEUE_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/unbilled-work-review-queue/kit-content";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { OutlineReviewChecklist } from "./outline-review-checklist";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function KitSection({ id, children }: { id: KitSectionId; children: ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-20 rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
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
        Run these steps for one weekly review. Practice first with the Fictional
        Sample Job Export before you use a real job list.
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
      intro="Paste this prompt with your rules block, then paste the job export and last week's billing log. It runs SKIP RULES FIRST, ranks remaining rows by oldest completion date, and labels CONFIRMED separately from AI INTERPRETATION."
      prompt={QUEUE_PROMPT}
    />
  );
}

export function NextWeekPromptSection() {
  return (
    <PromptSection
      id="next-week-prompt"
      intro="Paste this the following week with a new export and the current billing log. It skips rows whose invoice id is now present or whose log outcome is invoiced or write-off, and keeps hold rows in the queue."
      prompt={NEXT_WEEK_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set the minimum amount to bill, list statuses that are never billed, and
        list jobs or customers to always skip. Then generate a rules block to
        paste with the prompts. Nothing you enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function BillingLogTemplateSection() {
  return (
    <KitSection id="billing-log-template">
      <p className={BODY}>
        Column layout with the fictional J-88 invoiced INV-241 row from the
        guided demo. Allowed outcome values are invoiced, hold, write-off,
        already_invoiced, warranty, below_minimum, and disputed. Copy CSV so you
        can start your own spreadsheet.
      </p>
      <DataTable
        label="Billing log template"
        columns={BILLING_LOG_COLUMNS}
        monospaceHeader
        rows={BILLING_LOG_ROWS.map((row) => billingLogCells(row))}
      />
      <CopyButton text={BILLING_LOG_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function OutlineReviewChecklistSection() {
  return (
    <KitSection id="outline-review-checklist">
      <p className={BODY}>
        Use this before you create an invoice. Progress stays in this browser
        session only.
      </p>
      <OutlineReviewChecklist />
    </KitSection>
  );
}

export function SampleJobExportSection() {
  return (
    <KitSection id="sample-job-export">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented four-row job CSV used in the guided demo. Paste it
        into your AI tool with the prompts to practice before you use a real
        job export.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_JOB_CSV}</pre>
      <CopyButton text={SAMPLE_JOB_CSV} label="Copy CSV" />
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
