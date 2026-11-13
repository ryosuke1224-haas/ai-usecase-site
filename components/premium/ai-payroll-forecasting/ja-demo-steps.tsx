"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { payrollPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { payrollCopy } from "@/src/lib/premium/ai-payroll-forecasting/copy";
import {
  EMPLOYER_LOAD,
  OVERTIME_FLAG_RULE,
  OVERTIME_MULTIPLIER,
  PAY_PERIOD,
  PROJECTED_REVENUE,
  SCHEDULE_COLUMNS,
  SCHEDULE_ROWS,
  STYLIST_FACT_CHECK,
  TARGET_LABOR,
} from "@/src/lib/premium/ai-payroll-forecasting/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function JaScheduleExportStep() {
  const demo = payrollCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.payPeriodLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{PAY_PERIOD}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.projectedRevenueLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{PROJECTED_REVENUE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.employerLoadLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{EMPLOYER_LOAD}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.targetLaborLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{TARGET_LABOR}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.overtimeMultiplierLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{OVERTIME_MULTIPLIER}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.overtimeFlagRuleLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{OVERTIME_FLAG_RULE}</dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.exportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.exportTableLabel}
            columns={SCHEDULE_COLUMNS}
            monospaceHeader
            rows={SCHEDULE_ROWS.map((row) => [
              row.role,
              row.scheduledHours,
              row.hourlyRate,
              row.overtimeHours,
            ])}
          />
        </div>
      </div>
    </div>
  );
}

export function JaFormulasStep() {
  const demo = payrollCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <ul aria-label={demo.formulasLabel} className="space-y-3">
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">stylist</p>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.stylistConfirmed}
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">front_desk</p>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.frontDeskConfirmed}
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p>
            <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
            {demo.ownerLoadLine}
          </p>
          <p>
            <FactLabel kind="CALCULATED" label="計算済み" />
            {demo.calculatedBaseLine}
          </p>
        </li>
      </ul>
    </div>
  );
}

export function JaFlagsStep() {
  const demo = payrollCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CALCULATED" label="計算済み" />
        {demo.laborPctLine}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.overtimeFlagLine}</p>
      <ul aria-label={demo.labelsHow} className="space-y-2 text-sm leading-relaxed text-foreground">
        <li>
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.confirmedHelp}
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          {demo.ownerHelp}
        </li>
        <li>
          <FactLabel kind="CALCULATED" label="計算済み" />
          {demo.calculatedHelp}
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
          {demo.interpretationHelp}
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
          {demo.recommendedHelp}
        </li>
      </ul>
    </div>
  );
}

export function JaFactCheckStep() {
  const demo = payrollCopy("ja").demo;
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.stylistConfirmedLine}
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
            columns={[...demo.factColumns]}
            rows={STYLIST_FACT_CHECK.rows.map((row) => [
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

export function JaInterpretationStep() {
  const demo = payrollCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
        {demo.interpretation}
      </p>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p className="font-semibold">{demo.varianceHeading}</p>
        <p>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          {demo.actualPayrollLine}
        </p>
        <p>
          <FactLabel kind="CALCULATED" label="計算済み" />
          {demo.varianceCalcLine}
        </p>
        <p>{demo.recheckSentence}</p>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
        {demo.recommendedAction}
      </p>
    </div>
  );
}

export function JaYouEditStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = payrollCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.doNotCutCoverage}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        {demo.boundaries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={BODY}>{demo.kitLead}</p>
      <Link
        href={payrollPaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
