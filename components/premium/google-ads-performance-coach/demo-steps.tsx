"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  BRAND_PERIOD_CHANGE,
  CAMPAIGN_COLUMNS,
  CONFIRMED_LINES,
  CONVERSION_ACTION_COLUMNS,
  CONVERSION_ACTIONS,
  CURRENT_CAMPAIGNS,
  CURRENT_PERIOD,
  DO_NOT_CHANGE_BIDS,
  GA4_COLUMNS,
  GA4_LANDINGS,
  KIT_PATH,
  LATER_RUN_INTERPRETATION,
  PREVIOUS_CAMPAIGNS,
  PREVIOUS_PERIOD,
  QUALIFIED_OUTCOME,
  RECOMMENDED_ACTION_TEXT,
  RERUN_SENTENCE,
  SEARCH_TERMS_MISSING,
  SPRING_PROMO_FACT_CHECK,
  WORKBOOK_COLUMNS,
  WORKBOOK_ROWS,
  YOU_CHANGE_IT,
} from "@/src/lib/premium/google-ads-performance-coach/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

function campaignCells(row: (typeof CURRENT_CAMPAIGNS)[number]) {
  return [row.campaign, row.clicks, row.cost, row.conversions, row.primaryConversion];
}

export function ExportsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        These tables are invented. No live Google Ads or GA4 account is attached.
        Atlas does not connect, upload, or edit anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Qualified outcome
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {QUALIFIED_OUTCOME}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Date ranges
          </dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{CURRENT_PERIOD}</p>
            <p>{PREVIOUS_PERIOD}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Current-period campaign export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Current-period campaign export"
            columns={CAMPAIGN_COLUMNS}
            monospaceHeader
            rows={CURRENT_CAMPAIGNS.map(campaignCells)}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>Previous-period campaign export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Previous-period campaign export"
            columns={CAMPAIGN_COLUMNS}
            monospaceHeader
            rows={PREVIOUS_CAMPAIGNS.map(campaignCells)}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>Conversion-actions table (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Conversion-actions table"
            columns={CONVERSION_ACTION_COLUMNS}
            monospaceHeader
            rows={CONVERSION_ACTIONS.map((row) => [
              row.conversionAction,
              row.category,
              row.counting,
              row.primaryFor,
            ])}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>GA4 landing-page table (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="GA4 landing-page table"
            columns={GA4_COLUMNS}
            monospaceHeader
            rows={GA4_LANDINGS.map((row) => [
              row.landing,
              row.sessions,
              row.bouncedSessions,
              row.formSubmitEvents,
            ])}
          />
        </div>
      </div>
    </div>
  );
}

export function MeasurementFirstStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI compares each primary_conversion to the qualified outcome before it
        ranks spend. Spring Promo is skipped for efficiency because its primary
        conversion is not the qualified outcome.
      </p>
      <ul aria-label="Measurement results" className="space-y-3">
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">Spring Promo — failed</p>
          <p>
            <FactLabel kind="CONFIRMED" />
            {CONFIRMED_LINES[0]}
          </p>
          <p>
            <FactLabel kind="CONFIRMED" />
            {CONFIRMED_LINES[1]}
          </p>
          <p>
            primary_conversion is page_view, not form_submit. Conversions = 96.
            /spring-landing form_submit_events = 12.
          </p>
          <p>
            <FactLabel kind="SKIPPED" />
            SKIPPED FOR EFFICIENCY: Spring Promo (primary conversion is not the
            qualified outcome).
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">Brand — passed</p>
          <p>
            <FactLabel kind="CONFIRMED" />
            {CONFIRMED_LINES[3]}
          </p>
          <p>primary_conversion is form_submit, which matches the qualified outcome.</p>
        </li>
      </ul>
    </div>
  );
}

export function WorkbookStopStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The workbook leaves every formula visible. Spring Promo is labelled
        meaningful no, so that figure is not used to rank spend.
      </p>
      <DataTable
        label="Calculation workbook"
        columns={WORKBOOK_COLUMNS}
        monospaceHeader
        rows={WORKBOOK_ROWS.filter((row) => row.period === CURRENT_PERIOD).map((row) => [
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
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_LINES[2]}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION_TEXT}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" />
        {RECOMMENDED_ACTION_TEXT}
      </p>
    </div>
  );
}

export function FactCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Open the {SPRING_PROMO_FACT_CHECK.campaign} row. Before anything is
        changed in Google Ads, every CONFIRMED field is checked against the
        export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {SPRING_PROMO_FACT_CHECK.confirmed}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
      >
        Check facts against the export row
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label={`Fact check for ${SPRING_PROMO_FACT_CHECK.campaign}`}
            columns={["Field", "In the CONFIRMED line", "In the export row", "Result"]}
            rows={SPRING_PROMO_FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.exportValue,
              <span key="result" className="font-semibold text-emerald-800 dark:text-emerald-300">
                Matches
              </span>,
            ])}
          />
        ) : null}
      </div>
    </div>
  );
}

export function LaterRunStep() {
  const brandPrevious = WORKBOOK_ROWS.find(
    (row) => row.campaign === "Brand" && row.period === PREVIOUS_PERIOD,
  );
  if (!brandPrevious) {
    throw new Error("Brand previous workbook row is missing");
  }

  return (
    <div className="space-y-5">
      <p className={BODY}>
        No post-fix export exists. A later run needs a new campaign export. Do
        not invent a results file.
      </p>
      <div>
        <h3 className={SUBHEADING}>Brand previous-period workbook row</h3>
        <div className="mt-2">
          <DataTable
            label="Brand previous-period workbook row"
            columns={WORKBOOK_COLUMNS}
            monospaceHeader
            rows={[[
              brandPrevious.campaign,
              brandPrevious.period,
              brandPrevious.clicks,
              brandPrevious.cost,
              brandPrevious.conversions,
              brandPrevious.primaryConversion,
              brandPrevious.formula,
              brandPrevious.result,
              brandPrevious.meaningful,
            ]]}
          />
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Cost change
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {BRAND_PERIOD_CHANGE.costFormula} = {BRAND_PERIOD_CHANGE.costChange}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Conversion change
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {BRAND_PERIOD_CHANGE.conversionFormula} ={" "}
            {BRAND_PERIOD_CHANGE.conversionChange}
          </dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        NEEDS YOUR CHECK: {SEARCH_TERMS_MISSING}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {LATER_RUN_INTERPRETATION}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{RERUN_SENTENCE}</p>
    </div>
  );
}

export function YouChangeItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_CHANGE_IT}</p>
      <p className="text-sm leading-relaxed text-foreground">{DO_NOT_CHANGE_BIDS}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You set form_submit as primary in Google Ads yourself, or you decide
          not to.
        </li>
        <li>
          Nothing is sent, edited, or paid automatically. The kit changes
          nothing.
        </li>
        <li>You wait and re-export, or you change nothing.</li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to Google Ads or GA4. The prompts, worksheet, and
        checklists are in the Premium kit.
      </p>
      <Link
        href={KIT_PATH}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        Open the Premium kit (sign-in is required, private preview)
      </Link>
    </div>
  );
}
