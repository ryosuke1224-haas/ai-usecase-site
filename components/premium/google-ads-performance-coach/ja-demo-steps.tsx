"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { googleAdsPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { adsCopy } from "@/src/lib/premium/google-ads-performance-coach/copy";
import {
  BRAND_PERIOD_CHANGE,
  CAMPAIGN_COLUMNS,
  CONVERSION_ACTION_COLUMNS,
  CONVERSION_ACTIONS,
  CURRENT_CAMPAIGNS,
  CURRENT_PERIOD,
  GA4_COLUMNS,
  GA4_LANDINGS,
  PREVIOUS_CAMPAIGNS,
  PREVIOUS_PERIOD,
  QUALIFIED_OUTCOME,
  SPRING_PROMO_FACT_CHECK,
  WORKBOOK_COLUMNS,
  WORKBOOK_ROWS,
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

export function JaExportsStep() {
  const demo = adsCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.qualifiedOutcomeLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{QUALIFIED_OUTCOME}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.dateRangesLabel}</dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{CURRENT_PERIOD}</p>
            <p>{PREVIOUS_PERIOD}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.currentExportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.currentExportLabel}
            columns={CAMPAIGN_COLUMNS}
            monospaceHeader
            rows={CURRENT_CAMPAIGNS.map(campaignCells)}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.previousExportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.previousExportLabel}
            columns={CAMPAIGN_COLUMNS}
            monospaceHeader
            rows={PREVIOUS_CAMPAIGNS.map(campaignCells)}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.conversionActionsHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.conversionActionsLabel}
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
        <h3 className={SUBHEADING}>{demo.ga4Heading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.ga4Label}
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

export function JaMeasurementFirstStep() {
  const demo = adsCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <ul aria-label={demo.resultsLabel} className="space-y-3">
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">{demo.springFailedHeading}</p>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.confirmedLines[0]}
          </p>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.confirmedLines[1]}
          </p>
          <p>{demo.springDetail}</p>
          <p>
            <FactLabel kind="SKIPPED" label="対象外" />
            {demo.springSkipped}
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">{demo.brandPassedHeading}</p>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.confirmedLines[3]}
          </p>
          <p>{demo.brandDetail}</p>
        </li>
      </ul>
    </div>
  );
}

export function JaWorkbookStopStep() {
  const demo = adsCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <DataTable
        label={demo.workbookLabel}
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
        <FactLabel kind="CONFIRMED" label="確認済み" />
        {demo.confirmedLines[2]}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
        {demo.interpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
        {demo.recommended}
      </p>
    </div>
  );
}

export function JaFactCheckStep() {
  const demo = adsCopy("ja").demo;
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.factConfirmed}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
      >
        {demo.factButton}
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label={demo.factTableLabel}
            columns={demo.factColumns}
            rows={SPRING_PROMO_FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.exportValue,
              <span key="result" className="font-semibold text-emerald-800 dark:text-emerald-300">
                {demo.factResult}
              </span>,
            ])}
          />
        ) : null}
      </div>
    </div>
  );
}

export function JaLaterRunStep() {
  const demo = adsCopy("ja").demo;
  const brandPrevious = WORKBOOK_ROWS.find(
    (row) => row.campaign === "Brand" && row.period === PREVIOUS_PERIOD,
  );
  if (!brandPrevious) {
    throw new Error("Brand previous workbook row is missing");
  }

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <div>
        <h3 className={SUBHEADING}>{demo.brandPreviousHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.brandPreviousLabel}
            columns={WORKBOOK_COLUMNS}
            monospaceHeader
            rows={[
              [
                brandPrevious.campaign,
                brandPrevious.period,
                brandPrevious.clicks,
                brandPrevious.cost,
                brandPrevious.conversions,
                brandPrevious.primaryConversion,
                brandPrevious.formula,
                brandPrevious.result,
                brandPrevious.meaningful,
              ],
            ]}
          />
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.costChangeLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {BRAND_PERIOD_CHANGE.costFormula} = {BRAND_PERIOD_CHANGE.costChange}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.conversionChangeLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {BRAND_PERIOD_CHANGE.conversionFormula} = {BRAND_PERIOD_CHANGE.conversionChange}
          </dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label="要確認" />
        {demo.searchTermsNeedsCheck}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
        {demo.laterInterpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.rerun}</p>
    </div>
  );
}

export function JaYouChangeItStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = adsCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.doNotChangeBids}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        {demo.boundaries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={BODY}>{demo.kitBoundary}</p>
      <Link
        href={googleAdsPaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
