"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { unbilledPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { unbilledCopy } from "@/src/lib/premium/unbilled-work-review-queue/copy";
import {
  AS_OF,
  BILLING_LOG_COLUMNS,
  BILLING_LOG_ROWS,
  billingLogCells,
  JOB_COLUMNS,
  JOB_ROWS,
  jobCells,
  MIN_AMOUNT_DISPLAY,
  NUMBER_CHECK,
  QUEUE_COLUMNS,
  QUEUED_ROW,
} from "@/src/lib/premium/unbilled-work-review-queue/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

const JA_LABEL = {
  confirmed: "確認済み",
  needsCheck: "要確認",
  interpretation: "AIの解釈",
  action: "推奨アクション",
  skipped: "対象外",
} as const;

function useJaDemo() {
  return unbilledCopy("ja").demo;
}

export function JaExportStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.asOfLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.minAmountLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{MIN_AMOUNT_DISPLAY}</dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.jobsHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.jobsTableLabel}
            columns={JOB_COLUMNS}
            monospaceHeader
            rows={JOB_ROWS.map((row) => jobCells(row))}
          />
        </div>
      </div>
    </div>
  );
}

export function JaSkipRulesStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ91}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ70}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ94}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.otherSkipRules}</p>
    </div>
  );
}

export function JaRankedQueueStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <p className={SUBHEADING}>{demo.queueHeading}</p>
      <DataTable
        label={demo.queueTableLabel}
        columns={QUEUE_COLUMNS}
        monospaceHeader
        rows={[
          [
            QUEUED_ROW.job,
            QUEUED_ROW.customer,
            QUEUED_ROW.completed,
            QUEUED_ROW.hours,
            QUEUED_ROW.rate,
            QUEUED_ROW.amount,
          ],
        ]}
      />
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
        {demo.confirmedJ88}
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{demo.outlineText}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{demo.doNotAddTax}</p>
      </blockquote>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.needsCheck}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label={JA_LABEL.interpretation} />
        {demo.interpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label={JA_LABEL.action} />
        {demo.recommended}
      </p>
    </div>
  );
}

export function JaCheckNumbersStep() {
  const demo = useJaDemo();
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{NUMBER_CHECK.outline}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{demo.doNotAddTax}</p>
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
            rows={NUMBER_CHECK.rows.map((row) => [
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

export function JaNextWeekLogStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <h3 className={SUBHEADING}>{demo.billingLogHeading}</h3>
      <DataTable
        label={demo.billingLogLabel}
        columns={BILLING_LOG_COLUMNS}
        monospaceHeader
        rows={BILLING_LOG_ROWS.map((row) => billingLogCells(row))}
      />
      <h3 className={SUBHEADING}>{demo.nextWeekHeading}</h3>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ88NextWeek}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ91}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ70}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
        {demo.skippedJ94}
      </p>
      <p className="text-sm font-semibold text-foreground">{demo.loggedInvoiced}</p>
    </div>
  );
}

export function JaYouCreateTheInvoiceStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  const paths = unbilledPaths(pathLocale);
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotAddTax}</p>
      <p className={BODY}>{demo.step6Body}</p>
      <p className={BODY}>{demo.step6Boundary}</p>
      <Link
        href={paths.kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
