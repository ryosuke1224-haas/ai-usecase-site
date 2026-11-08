import type { ReactNode } from "react";
import {
  CAMPAIGN_COLUMNS,
  CONVERSION_ACTION_COLUMNS,
  CONVERSION_ACTIONS,
  CURRENT_CAMPAIGNS,
  CURRENT_PERIOD,
  GA4_COLUMNS,
  GA4_LANDINGS,
  PREVIOUS_CAMPAIGNS,
  PREVIOUS_PERIOD,
  SAMPLE_EXPORTS_CSV,
  WORKBOOK_COLUMNS,
  WORKBOOK_CSV,
  WORKBOOK_ROWS,
} from "@/src/lib/premium/google-ads-performance-coach/demo-data";
import {
  kitSectionTitle,
  MEASUREMENT_REVIEW_PROMPT,
  PERIOD_REVIEW_PROMPT,
  PLAN_DIFFERENCE_NOTICE,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/google-ads-performance-coach/kit-content";
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
        Exports before you use a real account export.
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

export function MeasurementReviewPromptSection() {
  return (
    <PromptSection
      id="measurement-review-prompt"
      intro="Paste this prompt with your rules block, then attach or paste the conversion-actions table, campaign exports, and GA4 landing-page rows. It runs the measurement check first and stops efficiency ranking when the primary conversion is not the qualified outcome."
      prompt={MEASUREMENT_REVIEW_PROMPT}
    />
  );
}

export function PeriodReviewPromptSection() {
  return (
    <PromptSection
      id="period-review-prompt"
      intro="Use this only after every in-scope campaign passes the measurement check. It fills the workbook from current and previous export numbers and leaves formulas visible."
      prompt={PERIOD_REVIEW_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Write the qualified outcome, confirm or turn off the default events that
        do not count, and list campaigns to mark out of scope. Then generate a
        rules block to paste with the Measurement Review Prompt. Nothing you
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
        Column layout with the fictional demo numbers and visible formula text.
        Spring Promo is labelled meaningful = no. Copy CSV so you can start your
        own spreadsheet.
      </p>
      <DataTable
        label="Calculation workbook template"
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
      <CopyButton text={WORKBOOK_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you change anything in Google Ads. Progress stays in
        this browser session only.
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
        The same invented campaign, previous-period, conversion-action, and GA4
        rows used in the guided demo ({CURRENT_PERIOD} and {PREVIOUS_PERIOD}).
        Paste them into your AI tool with the Measurement Review Prompt to
        practice the full workflow before you use a real account export.
      </p>
      <DataTable
        label="Fictional current-period campaign export"
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
        label="Fictional previous-period campaign export"
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
        label="Fictional conversion-actions table"
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
        label="Fictional GA4 landing-page table"
        columns={GA4_COLUMNS}
        monospaceHeader
        rows={GA4_LANDINGS.map((row) => [
          row.landing,
          row.sessions,
          row.bouncedSessions,
          row.formSubmitEvents,
        ])}
      />
      <CopyButton text={SAMPLE_EXPORTS_CSV} label="Copy CSV" />
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
