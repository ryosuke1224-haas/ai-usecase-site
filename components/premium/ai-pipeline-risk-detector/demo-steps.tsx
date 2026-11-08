"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION,
  AS_OF,
  CONFIRMED_HARBOR,
  CONFIRMED_NORTHGATE,
  DEAL_COLUMNS,
  DEAL_ROWS,
  dealCells,
  DO_NOT_INVENT,
  HARBOR_DRAFT,
  KIT_PATH,
  LOGGED_ON_HOLD,
  MIN_AMOUNT_DISPLAY,
  NEXT_WEEK_AS_OF,
  NORTHGATE_DRAFT,
  NUMBER_CHECK,
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  QUEUE_COLUMNS,
  QUEUED_ROWS,
  RECOMMENDED_ACTION_TEXT,
  SKIPPED_BIRCHWOOD,
  SKIPPED_HARBOR_NEXT_WEEK,
  SKIPPED_PELL,
  SKIPPED_STATUS_RULES,
  STALL_LIMIT,
  YOU_SEND_IT,
} from "@/src/lib/premium/ai-pipeline-risk-detector/demo-data";
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
        This deal table is invented. No live HubSpot, Pipedrive, Salesforce, CRM,
        or email account is attached. Atlas does not connect, upload, or send
        anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            as_of (invented)
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
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
            stall limits (days)
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {STALL_LIMIT} in stage or {STALL_LIMIT} since activity, or blank next
            step
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Open deals (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Open deals"
            columns={DEAL_COLUMNS}
            monospaceHeader
            rows={DEAL_ROWS.map((row) => dealCells(row))}
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
        Skip rules run before any stall scoring, ranking, or recovery note. Every
        skipped row keeps a visible reason.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_BIRCHWOOD}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_PELL}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{SKIPPED_STATUS_RULES}</p>
    </div>
  );
}

export function RankedQueueStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Remaining open deals that match your stall rules are ranked by amount,
        largest first. This export leaves two rows to review.
      </p>
      <p className={SUBHEADING}>
        STALL QUEUE as of {AS_OF} (fictional; 2 to review, 2 skipped)
      </p>
      <DataTable
        label="Ranked stall queue"
        columns={QUEUE_COLUMNS}
        monospaceHeader
        rows={QUEUED_ROWS.map((row) => [
          row.deal,
          row.amount,
          row.stage,
          row.daysInStage,
          row.lastActivity,
          row.nextStep,
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
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {CONFIRMED_HARBOR}
        </p>
        <blockquote className={`${CARD} border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{HARBOR_DRAFT}</p>
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
        Before anyone sends a recovery note, every CONFIRMED number for Northgate
        Clinic is checked against the export row.
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
        1. Northgate Clinic website rebuild still queued (outcome still_stalled).
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_HARBOR_NEXT_WEEK}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_PELL}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_BIRCHWOOD}
      </p>
      <p className="text-sm font-semibold text-foreground">{LOGGED_ON_HOLD}</p>
    </div>
  );
}

export function YouSendItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_SEND_IT}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_INVENT}</p>
      <p className={BODY}>
        You edit and send from your own email or update the next step in your own
        CRM, or you decide not to. Nothing is sent, edited, cancelled, or paid
        automatically.
      </p>
      <p className={BODY}>
        Atlas does not connect to HubSpot, Pipedrive, Salesforce, or email. The
        prompts, worksheet, and checklists are in the Premium kit.
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
