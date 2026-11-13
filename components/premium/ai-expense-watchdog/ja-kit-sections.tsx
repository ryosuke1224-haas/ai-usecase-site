import type { ReactNode } from "react";
import { expenseCopy } from "@/src/lib/premium/ai-expense-watchdog/copy";
import type { ExpenseSectionId } from "@/src/lib/premium/ai-expense-watchdog/copy-types";
import {
  EXPORT_COLUMNS,
  EXPORT_ROWS,
  LEDGER_COLUMNS,
  LEDGER_CSV,
  LEDGER_ROWS,
  SAMPLE_EXPORT_CSV,
  ledgerCells,
} from "@/src/lib/premium/ai-expense-watchdog/demo-data";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: ExpenseSectionId;
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
  const copy = expenseCopy("ja");
  const section = (id: ExpenseSectionId) => copy.sections.find((item) => item.id === id);

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
      <Section id="ledger-prompt" title={section("ledger-prompt")?.title ?? "ledger-prompt"}>
        <p className={BODY}>{copy.ledgerPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.ledgerPrompt}</pre>
        <CopyButton
          text={copy.ledgerPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="increase-review-prompt" title={section("increase-review-prompt")?.title ?? "increase-review-prompt"}>
        <p className={BODY}>{copy.increasePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.increasePrompt}</pre>
        <CopyButton
          text={copy.increasePrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section id="ledger-template" title={section("ledger-template")?.title ?? "ledger-template"}>
        <p className={BODY}>{copy.ledgerIntro}</p>
        <DataTable
          label="繰り返し台帳のひな形"
          columns={LEDGER_COLUMNS}
          monospaceHeader
          rows={LEDGER_ROWS.map(ledgerCells)}
        />
        <CopyButton text={LEDGER_CSV} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
      </Section>
      <Section id="action-review-checklist" title={section("action-review-checklist")?.title ?? "action-review-checklist"}>
        <p className={BODY}>{copy.checklistIntro}</p>
        <ActionReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section id="sample-exports" title={section("sample-exports")?.title ?? "sample-exports"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <p className={BODY}>{copy.demo.fieldMap}</p>
        <DataTable
          label="架空のカード明細"
          columns={EXPORT_COLUMNS}
          monospaceHeader
          rows={EXPORT_ROWS.map((row) => [row.date, row.vendor, row.amount, row.source])}
        />
        <CopyButton
          text={SAMPLE_EXPORT_CSV}
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
