import type { ReactNode } from "react";
import {
  ALLOWED_OUTCOMES,
  AS_OF_DATE,
  CLOSURE_LOG_COLUMNS,
  CLOSURE_LOG_TEMPLATE_CSV,
  INVENTORY_COLUMNS,
  SAMPLE_CLOSURE_LOG,
  SAMPLE_INVENTORY_CSV,
  SAMPLE_INVENTORY_ROWS,
} from "@/src/lib/premium/security-readiness-action-pack/demo-data";
import {
  kitSectionTitle,
  NEXT_QUARTER_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  QUEUE_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/security-readiness-action-pack/kit-content";
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
        Run these steps once a quarter. Practice first with the Fictional Sample
        Inventory before you use real account names.
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
      intro="Paste this prompt with your rules block, then attach or paste the inventory and last quarter's closure log. It applies the skip rules first and labels confirmed facts, interpretation, and recommended actions separately."
      prompt={QUEUE_PROMPT}
    />
  );
}

export function NextQuarterPromptSection() {
  return (
    <PromptSection
      id="next-quarter-prompt"
      intro="Use this the following quarter with the new inventory and your updated closure log. Closed HIGH items stay in the log, and HIGH items still open stay ranked."
      prompt={NEXT_QUARTER_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        List accounts to mark out of scope and confirm or turn off each default
        HIGH and MEDIUM rule, then generate a rules block to paste with the
        queue prompt. Nothing you enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function ClosureLogTemplateSection() {
  return (
    <KitSection id="closure-log-template">
      <p className={BODY}>
        Start your own spreadsheet with these columns. Only you record outcomes.
        Next quarter&apos;s run reads this log, so closed items stay visible and
        HIGH items still open stay ranked. Copy CSV copies the column header
        only. The rows below are a fictional example, and they are not included
        in that copy.
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
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Fictional example rows
      </p>
      <DataTable
        label="Closure log template with fictional example rows"
        columns={CLOSURE_LOG_COLUMNS}
        monospaceHeader
        rows={SAMPLE_CLOSURE_LOG.map((row) => [
          row.quarterOf,
          row.account,
          row.namedOwner,
          row.actionTaken,
          row.outcome,
          row.checkDate,
          row.notes,
        ])}
      />
      <CopyButton text={CLOSURE_LOG_TEMPLATE_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you change anything in a real product. Progress stays in
        this browser session only.
      </p>
      <ActionReviewChecklist />
    </KitSection>
  );
}

export function SampleInventorySection() {
  return (
    <KitSection id="sample-inventory">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same four invented accounts used in the guided demo, as of{" "}
        {AS_OF_DATE}. Paste them into your AI tool with the queue prompt to
        practice the full workflow before you use real account names.
      </p>
      <DataTable
        label="Fictional sample inventory"
        columns={INVENTORY_COLUMNS}
        monospaceHeader
        rows={SAMPLE_INVENTORY_ROWS.map((row) => [
          row.account,
          row.namedOwner,
          row.stillWithCompany,
          row.mfa,
          row.lastRestoreTest,
          row.sharedLogin,
          row.holdsCustomerOrMoneyData,
        ])}
      />
      <CopyButton text={SAMPLE_INVENTORY_CSV} label="Copy CSV" />
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
