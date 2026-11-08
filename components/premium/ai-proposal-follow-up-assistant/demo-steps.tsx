"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION,
  AS_OF,
  CADENCE_TEXT,
  CONFIRMED_NORTHGATE,
  DO_NOT_INVENT,
  KIT_PATH,
  LOGGED_DECLINED,
  MIN_AMOUNT_DISPLAY,
  NEXT_WEEK_AS_OF,
  NORTHGATE_DRAFT,
  NUMBER_CHECK,
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  PROPOSAL_COLUMNS,
  PROPOSAL_ROWS,
  proposalCells,
  QUEUE_COLUMNS,
  QUEUED_ROWS,
  RECOMMENDED_ACTION_TEXT,
  SILENCE_DATE,
  SKIPPED_BIRCHWOOD,
  SKIPPED_BIRCHWOOD_NEXT_WEEK,
  SKIPPED_HARBOR,
  SKIPPED_HARBOR_NEXT_WEEK,
  SKIPPED_PELL,
  SKIPPED_PELL_NEXT_WEEK,
  SKIPPED_STATUS_RULES,
  YOU_SEND_IT,
} from "@/src/lib/premium/ai-proposal-follow-up-assistant/demo-data";
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
        This proposal table is invented. No live CRM, PandaDoc, DocuSign, email,
        or spreadsheet account is attached. Atlas does not connect, upload, or
        send anything.
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
            silence_if_sent_before
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {SILENCE_DATE}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            owner_minimum
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {MIN_AMOUNT_DISPLAY}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            cadence
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {CADENCE_TEXT}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Sent proposals (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Sent proposals"
            columns={PROPOSAL_COLUMNS}
            monospaceHeader
            rows={PROPOSAL_ROWS.map((row) => proposalCells(row))}
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
        Skip rules run before any ranking, cadence assignment, or follow-up
        draft. Every skipped row keeps a visible reason.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_PELL}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_HARBOR}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_BIRCHWOOD}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{SKIPPED_STATUS_RULES}</p>
    </div>
  );
}

export function RankedQueueStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Remaining silent proposals are ranked by amount, largest first, then by
        days since sent. This export leaves one row to chase.
      </p>
      <p className={SUBHEADING}>
        QUEUE as of {AS_OF} (fictional; 1 to chase, 3 skipped)
      </p>
      <DataTable
        label="Ranked silence queue"
        columns={QUEUE_COLUMNS}
        monospaceHeader
        rows={QUEUED_ROWS.map((row) => [
          row.proposal,
          row.customer,
          row.amount,
          row.sentDate,
          row.status,
          row.lineItem,
        ])}
      />
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {CONFIRMED_NORTHGATE}
        </p>
        <blockquote className={`${CARD} border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{NORTHGATE_DRAFT}</p>
        </blockquote>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" />
        {RECOMMENDED_ACTION_TEXT}
      </p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_INVENT}</p>
    </div>
  );
}

export function CheckNumbersStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Before anyone sends a follow-up, every CONFIRMED number for P-441 is
        checked against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{NUMBER_CHECK.draft}</p>
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
            columns={["Field", "In the draft", "In the export row", "Result"]}
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
        and this outcome log.
      </p>
      <h3 className={SUBHEADING}>Outcome log for the week of {AS_OF} (invented)</h3>
      <DataTable
        label="Outcome log"
        columns={OUTCOME_LOG_COLUMNS}
        monospaceHeader
        rows={OUTCOME_LOG_ROWS.map((row) => outcomeLogCells(row))}
      />
      <h3 className={SUBHEADING}>Mock run as of {NEXT_WEEK_AS_OF}</h3>
      <p className="text-sm leading-relaxed text-foreground">
        1. P-441 Northgate Clinic still queued (outcome still_silent).
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_HARBOR_NEXT_WEEK}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_PELL_NEXT_WEEK}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_BIRCHWOOD_NEXT_WEEK}
      </p>
      <p className="text-sm font-semibold text-foreground">{LOGGED_DECLINED}</p>
    </div>
  );
}

export function YouSendItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_SEND_IT}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_INVENT}</p>
      <p className={BODY}>
        You edit and send from your own email, or you decide not to. Nothing is
        sent, edited, cancelled, or paid automatically.
      </p>
      <p className={BODY}>
        Atlas does not connect to a CRM, PandaDoc, DocuSign, email, or
        spreadsheet. The prompts, worksheet, and checklists are in the Premium
        kit.
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
