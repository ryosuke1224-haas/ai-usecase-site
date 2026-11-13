"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { expensePaths, type UiLocale } from "@/src/lib/i18n/locale";
import { expenseCopy } from "@/src/lib/premium/ai-expense-watchdog/copy";
import {
  AS_OF,
  DESIGNHUB_FACT_CHECK,
  EXPORT_COLUMNS,
  EXPORT_RANGE,
  EXPORT_ROWS,
  KEEP_LIST,
  LEDGER_COLUMNS,
  LEDGER_ROWS,
  MINIMUM_CHANGE,
  OVERLAP_WATCH,
  RECURRING_VENDORS,
  ledgerCells,
} from "@/src/lib/premium/ai-expense-watchdog/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

function appearances(vendor: string): string {
  return EXPORT_ROWS.filter((row) => row.vendor === vendor)
    .map((row) => `${row.date}（${row.amount}）`)
    .join("、");
}

export function JaExportStep() {
  const demo = expenseCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.fieldMap}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.exportRangeLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{EXPORT_RANGE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.asOfLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.keepListLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{KEEP_LIST}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.overlapLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{OVERLAP_WATCH}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.minimumLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{MINIMUM_CHANGE}</dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.exportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.exportTableLabel}
            columns={EXPORT_COLUMNS}
            monospaceHeader
            rows={EXPORT_ROWS.map((row) => [row.date, row.vendor, row.amount, row.source])}
          />
        </div>
      </div>
    </div>
  );
}

export function JaLedgerFirstStep() {
  const demo = expenseCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <ul aria-label={demo.resultsLabel} className="space-y-3">
        {RECURRING_VENDORS.map((item) => (
          <li key={item.vendor} className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
            <p className="font-semibold">
              {item.vendor} — {demo.recurringSuffix}
            </p>
            <p>
              <FactLabel kind="CONFIRMED" label="確認済み" />
              {item.vendor} は {appearances(item.vendor)} にあります。間隔は毎月です。
              {item.vendor === "ZoomMeet" ? "常に残す支払先です。" : ""}
            </p>
            {item.vendor === "ZoomMeet" ? (
              <p>
                <FactLabel kind="SKIPPED" label="対象外" />
                {demo.skippedLine}
              </p>
            ) : null}
          </li>
        ))}
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">{demo.notRecurringHeading}</p>
          <p>{demo.notRecurringLine}</p>
        </li>
      </ul>
    </div>
  );
}

export function JaVisibleFormulasStep() {
  const demo = expenseCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <DataTable
        label={demo.ledgerTableLabel}
        columns={LEDGER_COLUMNS}
        monospaceHeader
        rows={LEDGER_ROWS.map(ledgerCells)}
      />
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" label="確認済み" />
        {demo.confirmedChange}
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
  const demo = expenseCopy("ja").demo;
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {DESIGNHUB_FACT_CHECK.vendor} は {appearances(DESIGNHUB_FACT_CHECK.vendor)} にあります。間隔は毎月です。
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
            rows={DESIGNHUB_FACT_CHECK.rows.map((row) => [
              row.date,
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
  const demo = expenseCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <p className="text-sm font-semibold text-foreground">{demo.noNewExport}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.keepListLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{KEEP_LIST}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">ZoomMeet</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{demo.stillKeep}</dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label="要確認" />
        {demo.needsCheck}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.rerun}</p>
    </div>
  );
}

export function JaYouCancelItStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = expenseCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.doNotCancel}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        {demo.boundaries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={BODY}>
        Atlas はカード会社、銀行、会計ソフトには接続しません。プロンプト、ワークシート、チェックリストはプレミアムキットにあります。
      </p>
      <Link
        href={expensePaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
