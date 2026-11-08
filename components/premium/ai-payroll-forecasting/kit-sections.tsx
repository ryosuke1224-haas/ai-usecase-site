import type { ReactNode } from "react";
import {
  SAMPLE_SCHEDULE_CSV,
  SCHEDULE_COLUMNS,
  SCHEDULE_ROWS,
  WORKBOOK_COLUMNS,
  WORKBOOK_CSV,
  WORKBOOK_ROWS,
  workbookCells,
} from "@/src/lib/premium/ai-payroll-forecasting/demo-data";
import {
  kitSectionTitle,
  LABOR_CHECK_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  VARIANCE_PROMPT,
  type KitSectionId,
} from "@/src/lib/premium/ai-payroll-forecasting/kit-content";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { ScheduleReviewChecklist } from "./schedule-review-checklist";
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
        Run these steps for one pay period. Practice first with the Fictional
        Sample Schedule Export before you use a real schedule or payroll export.
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

export function LaborCheckPromptSection() {
  return (
    <PromptSection
      id="labor-check-prompt"
      intro="Paste this prompt with your rules block, then attach or paste the schedule rows and revenue figure. It runs NEXT-PAY LABOR CHECK with visible formulas and stops schedule-edit language until the math and flags are done."
      prompt={LABOR_CHECK_PROMPT}
    />
  );
}

export function VariancePromptSection() {
  return (
    <PromptSection
      id="variance-prompt"
      intro="Use this only after the pay run. It compares the earlier projected loaded payroll to your OWNER-ENTERED actual payroll total with a visible variance formula."
      prompt={VARIANCE_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set employer load factor, target labor percentage, overtime multiplier,
        overtime flag rule, and optional minimum coverage by role. Then generate
        a rules block to paste with the Next-Pay Labor Check Prompt. Nothing you
        enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function WorkbookTemplateSection() {
  return (
    <KitSection id="workbook-template">
      <p className={BODY}>
        Column layout with the fictional stylist and front_desk demo numbers and
        visible formula text such as =124*22 and =4012*1.20. Copy CSV so you can
        start your own spreadsheet.
      </p>
      <DataTable
        label="Loaded payroll workbook template"
        columns={WORKBOOK_COLUMNS}
        monospaceHeader
        rows={WORKBOOK_ROWS.map(workbookCells)}
      />
      <CopyButton text={WORKBOOK_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ScheduleReviewChecklistSection() {
  return (
    <KitSection id="schedule-review-checklist">
      <p className={BODY}>
        Use this before you change the next schedule. Progress stays in this
        browser session only.
      </p>
      <ScheduleReviewChecklist />
    </KitSection>
  );
}

export function SampleExportsSection() {
  return (
    <KitSection id="sample-exports">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented two-role schedule CSV used in the guided demo. Paste
        it into your AI tool with the Next-Pay Labor Check Prompt to practice
        the full workflow before you use a real schedule export.
      </p>
      <DataTable
        label="Fictional sample schedule export"
        columns={SCHEDULE_COLUMNS}
        monospaceHeader
        rows={SCHEDULE_ROWS.map((row) => [
          row.role,
          row.scheduledHours,
          row.hourlyRate,
          row.overtimeHours,
        ])}
      />
      <CopyButton text={SAMPLE_SCHEDULE_CSV} label="Copy CSV" />
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
