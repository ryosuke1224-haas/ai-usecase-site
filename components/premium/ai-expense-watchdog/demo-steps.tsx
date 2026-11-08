"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  AS_OF,
  CONFIRMED_CHANGE_LINE,
  DESIGNHUB_FACT_CHECK,
  DO_NOT_CANCEL_FROM_A_GUESS,
  EXPORT_COLUMNS,
  EXPORT_RANGE,
  EXPORT_ROWS,
  KEEP_LIST,
  KIT_PATH,
  LEDGER_COLUMNS,
  LEDGER_ROWS,
  MINIMUM_CHANGE,
  NO_NEW_EXPORT,
  NO_USAGE_COLUMN,
  NOT_RECURRING_LINE,
  OVERLAP_WATCH,
  RECOMMENDED_ACTION_TEXT,
  RECURRING_VENDORS,
  RERUN_SENTENCE,
  SKIPPED_CANCEL_LINE,
  YOU_CANCEL_IT,
  ledgerCells,
} from "@/src/lib/premium/ai-expense-watchdog/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function ExportStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This table is invented. No live card, bank, QuickBooks, or Plaid account
        is attached. Atlas does not connect, upload, or cancel anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Export range
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{EXPORT_RANGE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            As of
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Keep list
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{KEEP_LIST}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Overlap watch
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{OVERLAP_WATCH}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Minimum change
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{MINIMUM_CHANGE}</dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Fictional card export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Fictional card export"
            columns={EXPORT_COLUMNS}
            monospaceHeader
            rows={EXPORT_ROWS.map((row) => [row.date, row.vendor, row.amount, row.source])}
          />
        </div>
      </div>
    </div>
  );
}

export function LedgerFirstStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI groups a vendor as recurring only when that vendor appears in at
        least two months. One-time charges are listed as NOT RECURRING and are
        never called subscriptions.
      </p>
      <ul aria-label="Recurring ledger results" className="space-y-3">
        {RECURRING_VENDORS.map((item) => (
          <li
            key={item.vendor}
            className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}
          >
            <p className="font-semibold">{item.vendor} — recurring</p>
            <p>
              <FactLabel kind="CONFIRMED" />
              {item.confirmed}
            </p>
            {item.vendor === "ZoomMeet" ? (
              <p>
                <FactLabel kind="SKIPPED" />
                SKIPPED FOR CANCEL REVIEW: {SKIPPED_CANCEL_LINE}
              </p>
            ) : null}
          </li>
        ))}
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">Harbor Office Supply — NOT RECURRING</p>
          <p>NOT RECURRING: {NOT_RECURRING_LINE}</p>
        </li>
      </ul>
    </div>
  );
}

export function VisibleFormulasStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The ledger leaves every change formula visible. A later higher amount is
        a CONFIRMED price change from the CSV, not a savings figure.
      </p>
      <DataTable
        label="Recurring ledger"
        columns={LEDGER_COLUMNS}
        monospaceHeader
        rows={LEDGER_ROWS.map(ledgerCells)}
      />
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_CHANGE_LINE}
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
        Open the {DESIGNHUB_FACT_CHECK.vendor} row. Before anything is changed
        at a vendor, every CONFIRMED amount is checked against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {DESIGNHUB_FACT_CHECK.confirmed}
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
            label={`Fact check for ${DESIGNHUB_FACT_CHECK.vendor}`}
            columns={["Date", "In the CONFIRMED line", "In the export row", "Result"]}
            rows={DESIGNHUB_FACT_CHECK.rows.map((row) => [
              row.date,
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
  return (
    <div className="space-y-5">
      <p className={BODY}>
        No post-cancel export exists. A later run needs a new export. Do not
        invent a results file.
      </p>
      <p className="text-sm font-semibold text-foreground">{NO_NEW_EXPORT}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Keep list
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{KEEP_LIST}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            ZoomMeet
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            Still on the keep list
          </dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        NEEDS YOUR CHECK: {NO_USAGE_COLUMN}. Do not call any vendor unused.
      </p>
      <p className="text-sm leading-relaxed text-foreground">{RERUN_SENTENCE}</p>
    </div>
  );
}

export function YouCancelItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_CANCEL_IT}</p>
      <p className="text-sm leading-relaxed text-foreground">{DO_NOT_CANCEL_FROM_A_GUESS}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You cancel in the vendor&apos;s own site yourself, or you decide not
          to.
        </li>
        <li>
          Nothing is sent, edited, cancelled, or paid automatically. The kit
          changes nothing.
        </li>
        <li>You wait and re-export, or you change nothing.</li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to a card network, bank, QuickBooks, or Plaid.
        The prompts, worksheet, and checklists are in the Premium kit.
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
