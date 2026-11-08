import type { ReactNode } from "react";
import {
  EXPORT_COLUMNS,
  EXPORT_ROWS,
  LEDGER_COLUMNS,
  LEDGER_CSV,
  LEDGER_ROWS,
  SAMPLE_EXPORT_CSV,
  ledgerCells,
} from "@/src/lib/premium/ai-expense-watchdog/demo-data";
import {
  kitSectionTitle,
  PLAN_DIFFERENCE_NOTICE,
  PRICE_CHANGE_OVERLAP_PROMPT,
  RECURRING_LEDGER_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/ai-expense-watchdog/kit-content";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
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
        Run these steps for one review. Practice first with the Fictional Sample
        Card Export before you use a real account export.
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

export function LedgerPromptSection() {
  return (
    <PromptSection
      id="ledger-prompt"
      intro="Paste this prompt with your rules block, then attach or paste the CSV. It runs RECURRING LEDGER FIRST and stops cancel language until recurring vendors, one-time charges, and keep-list skips are listed."
      prompt={RECURRING_LEDGER_PROMPT}
    />
  );
}

export function IncreaseReviewPromptSection() {
  return (
    <PromptSection
      id="increase-review-prompt"
      intro="Use this only after the recurring ledger is built. It fills visible change formulas from export amounts and labels a possible overlap as AI INTERPRETATION, not a savings figure."
      prompt={PRICE_CHANGE_OVERLAP_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Write essential vendors to never flag for cancel, overlap-watch
        categories, and the minimum amount change to list. Then generate a
        rules block to paste with the Recurring Ledger Prompt. Nothing you
        enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function LedgerTemplateSection() {
  return (
    <KitSection id="ledger-template">
      <p className={BODY}>
        Column layout with the fictional demo numbers and visible formula text
        such as =39.00-29.00. ZoomMeet is labelled keep_list = yes. Copy CSV so
        you can start your own spreadsheet.
      </p>
      <DataTable
        label="Recurring ledger template"
        columns={LEDGER_COLUMNS}
        monospaceHeader
        rows={LEDGER_ROWS.map(ledgerCells)}
      />
      <CopyButton text={LEDGER_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you change anything at a vendor. Progress stays in this
        browser session only.
      </p>
      <ActionReviewChecklist />
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
        The same invented 10-row card CSV used in the guided demo. Paste it
        into your AI tool with the Recurring Ledger Prompt to practice the
        full workflow before you use a real account export.
      </p>
      <DataTable
        label="Fictional sample card export"
        columns={EXPORT_COLUMNS}
        monospaceHeader
        rows={EXPORT_ROWS.map((row) => [row.date, row.vendor, row.amount, row.source])}
      />
      <CopyButton text={SAMPLE_EXPORT_CSV} label="Copy CSV" />
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
