import type { ReactNode } from "react";
import { adsCopy } from "@/src/lib/premium/google-ads-performance-coach/copy";
import type { AdsSectionId } from "@/src/lib/premium/google-ads-performance-coach/copy-types";
import {
  CAMPAIGN_COLUMNS,
  CONVERSION_ACTION_COLUMNS,
  CONVERSION_ACTIONS,
  CURRENT_CAMPAIGNS,
  GA4_COLUMNS,
  GA4_LANDINGS,
  PREVIOUS_CAMPAIGNS,
  SAMPLE_EXPORTS_CSV,
  WORKBOOK_COLUMNS,
  WORKBOOK_CSV,
  WORKBOOK_ROWS,
} from "@/src/lib/premium/google-ads-performance-coach/demo-data";
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
  id: AdsSectionId;
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
  const copy = adsCopy("ja");
  const section = (id: AdsSectionId) => copy.sections.find((item) => item.id === id);

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
        id="measurement-review-prompt"
        title={section("measurement-review-prompt")?.title ?? "measurement-review-prompt"}
      >
        <p className={BODY}>{copy.measurementPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.measurementPrompt}</pre>
        <CopyButton
          text={copy.measurementPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section
        id="period-review-prompt"
        title={section("period-review-prompt")?.title ?? "period-review-prompt"}
      >
        <p className={BODY}>{copy.periodPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.periodPrompt}</pre>
        <CopyButton
          text={copy.periodPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section id="workbook-template" title={section("workbook-template")?.title ?? "workbook-template"}>
        <p className={BODY}>{copy.workbookIntro}</p>
        <DataTable
          label={copy.workbookTemplateLabel}
          columns={WORKBOOK_COLUMNS}
          monospaceHeader
          rows={WORKBOOK_ROWS.map((row) => [
            row.campaign,
            row.period,
            row.clicks,
            row.cost,
            row.conversions,
            row.primaryConversion,
            row.formula,
            row.result,
            row.meaningful,
          ])}
        />
        <CopyButton
          text={WORKBOOK_CSV}
          label={copy.copyCsv}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section
        id="action-review-checklist"
        title={section("action-review-checklist")?.title ?? "action-review-checklist"}
      >
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
        <DataTable
          label={copy.currentSampleLabel}
          columns={CAMPAIGN_COLUMNS}
          monospaceHeader
          rows={CURRENT_CAMPAIGNS.map((row) => [
            row.campaign,
            row.clicks,
            row.cost,
            row.conversions,
            row.primaryConversion,
          ])}
        />
        <DataTable
          label={copy.previousSampleLabel}
          columns={CAMPAIGN_COLUMNS}
          monospaceHeader
          rows={PREVIOUS_CAMPAIGNS.map((row) => [
            row.campaign,
            row.clicks,
            row.cost,
            row.conversions,
            row.primaryConversion,
          ])}
        />
        <DataTable
          label={copy.conversionSampleLabel}
          columns={CONVERSION_ACTION_COLUMNS}
          monospaceHeader
          rows={CONVERSION_ACTIONS.map((row) => [
            row.conversionAction,
            row.category,
            row.counting,
            row.primaryFor,
          ])}
        />
        <DataTable
          label={copy.ga4SampleLabel}
          columns={GA4_COLUMNS}
          monospaceHeader
          rows={GA4_LANDINGS.map((row) => [
            row.landing,
            row.sessions,
            row.bouncedSessions,
            row.formSubmitEvents,
          ])}
        />
        <CopyButton
          text={SAMPLE_EXPORTS_CSV}
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
