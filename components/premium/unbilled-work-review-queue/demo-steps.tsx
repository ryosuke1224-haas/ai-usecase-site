"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  AS_OF,
  BILLING_LOG_COLUMNS,
  BILLING_LOG_ROWS,
  billingLogCells,
  CONFIRMED_J88,
  DO_NOT_ADD_TAX,
  JOB_COLUMNS,
  JOB_ROWS,
  jobCells,
  KIT_PATH,
  LOGGED_INVOICED_WORK,
  MIN_AMOUNT_DISPLAY,
  NEEDS_YOUR_CHECK_TEXT,
  NEXT_WEEK_AS_OF,
  NUMBER_CHECK,
  OTHER_SKIP_RULES,
  OUTLINE_TEXT,
  QUEUE_COLUMNS,
  QUEUED_ROW,
  RECOMMENDED_ACTION_TEXT,
  SKIPPED_J70,
  SKIPPED_J88_NEXT_WEEK,
  SKIPPED_J91,
  SKIPPED_J94,
  YOU_CREATE_THE_INVOICE,
} from "@/src/lib/premium/unbilled-work-review-queue/demo-data";
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
        This job table is invented. No live QuickBooks, Xero, time tracker, or
        invoicing tool is attached. Atlas does not connect, upload, or send
        anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            as_of (invented)
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            min_amount
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {MIN_AMOUNT_DISPLAY}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Completed jobs (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Completed jobs"
            columns={JOB_COLUMNS}
            monospaceHeader
            rows={JOB_ROWS.map((row) => jobCells(row))}
          />
        </div>
      </div>
    </div>
  );
}

export function SkipRulesStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Skip rules run before any ranking or invoice outline. Every skipped row
        keeps a visible reason.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J91}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J70}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J94}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{OTHER_SKIP_RULES}</p>
    </div>
  );
}

export function RankedQueueStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Remaining unbilled rows are ranked by oldest completion date first. This
        export leaves one row to outline.
      </p>
      <p className={SUBHEADING}>
        UNBILLED QUEUE as of {AS_OF} (fictional; 1 to bill, 3 skipped)
      </p>
      <DataTable
        label="Ranked unbilled queue"
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
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_J88}
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{OUTLINE_TEXT}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{DO_NOT_ADD_TAX}</p>
      </blockquote>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" />
        {NEEDS_YOUR_CHECK_TEXT}
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

export function CheckNumbersStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Before anyone creates an invoice, every CONFIRMED number is checked
        against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{NUMBER_CHECK.outline}</p>
        <p className="mt-2 text-sm font-semibold text-foreground">{DO_NOT_ADD_TAX}</p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
      >
        Check numbers against the export row
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label="Number check against the export row"
            columns={["Field", "In the outline", "In the export row", "Result"]}
            rows={NUMBER_CHECK.rows.map((row) => [
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

export function NextWeekLogStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        After the owner records outcomes, the next run starts from a new export
        and this billing log.
      </p>
      <h3 className={SUBHEADING}>Billing log for the week of {AS_OF} (invented)</h3>
      <DataTable
        label="Billing log"
        columns={BILLING_LOG_COLUMNS}
        monospaceHeader
        rows={BILLING_LOG_ROWS.map((row) => billingLogCells(row))}
      />
      <h3 className={SUBHEADING}>Mock run as of {NEXT_WEEK_AS_OF}</h3>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J88_NEXT_WEEK}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J91}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J70}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_J94}
      </p>
      <p className="text-sm font-semibold text-foreground">{LOGGED_INVOICED_WORK}</p>
    </div>
  );
}

export function YouCreateTheInvoiceStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_CREATE_THE_INVOICE}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_ADD_TAX}</p>
      <p className={BODY}>
        You create, hold, or write off each row in your own invoicing tool, or
        you decide not to. Nothing is sent, edited, cancelled, or marked paid
        automatically.
      </p>
      <p className={BODY}>
        Atlas does not connect to QuickBooks, Xero, a time tracker, or an
        invoicing tool. The prompts, worksheet, and checklists are in the
        Premium kit.
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
