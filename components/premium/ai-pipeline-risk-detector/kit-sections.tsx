import type { ReactNode } from "react";
import {
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_CSV,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  SAMPLE_DEAL_CSV,
} from "@/src/lib/premium/ai-pipeline-risk-detector/demo-data";
import {
  kitSectionTitle,
  NEXT_WEEK_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  STALL_QUEUE_PROMPT,
  type KitSectionId,
} from "@/src/lib/premium/ai-pipeline-risk-detector/kit-content";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RecoveryReviewChecklist } from "./recovery-review-checklist";
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
        Run these steps for one weekly stall review. Practice first with the
        Fictional Sample Deal Export before you use a real pipeline export.
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

export function StallQueuePromptSection() {
  return (
    <PromptSection
      id="stall-queue-prompt"
      intro="Paste this prompt with your rules block, then paste the open-deals export and last week's outcome log. It runs SKIP RULES FIRST, ranks remaining rows by amount, and labels CONFIRMED separately from AI INTERPRETATION."
      prompt={STALL_QUEUE_PROMPT}
    />
  );
}

export function NextWeekPromptSection() {
  return (
    <PromptSection
      id="next-week-prompt"
      intro="Paste this the following week with a new export and the current outcome log. It skips rows whose log outcome is lost or on_hold, and keeps still_stalled rows labelled from the log."
      prompt={NEXT_WEEK_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set the stall limits, owner minimum, statuses that are never chased, and
        deals to always skip. Then generate a rules block to paste with the
        prompts. Nothing you enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function OutcomeLogTemplateSection() {
  return (
    <KitSection id="outcome-log-template">
      <p className={BODY}>
        Column layout with the fictional Harbor Lane on_hold and Northgate
        still_stalled rows from the guided demo. Allowed outcome values are
        moved, still_stalled, lost, on_hold, skipped_not_stalled,
        skipped_below_minimum, and skipped_closed. Copy CSV so you can start
        your own spreadsheet.
      </p>
      <DataTable
        label="Outcome log template"
        columns={OUTCOME_LOG_COLUMNS}
        monospaceHeader
        rows={OUTCOME_LOG_ROWS.map((row) => outcomeLogCells(row))}
      />
      <CopyButton text={OUTCOME_LOG_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function RecoveryReviewChecklistSection() {
  return (
    <KitSection id="recovery-review-checklist">
      <p className={BODY}>
        Use this before you contact anyone. Progress stays in this browser
        session only.
      </p>
      <RecoveryReviewChecklist />
    </KitSection>
  );
}

export function SampleDealExportSection() {
  return (
    <KitSection id="sample-deal-export">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented four-row deal CSV used in the guided demo. Paste it
        into your AI tool with the prompts to practice before you use a real
        pipeline export.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_DEAL_CSV}</pre>
      <CopyButton text={SAMPLE_DEAL_CSV} label="Copy CSV" />
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
