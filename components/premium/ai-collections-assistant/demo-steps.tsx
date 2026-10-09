"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AGING_COLUMNS,
  AI_INTERPRETATION_TEXT,
  AS_OF_DATE,
  COLLECTIONS_KIT_PATH,
  DRAFT_CHECK,
  formatUsd,
  NEXT_WEEK_AS_OF_DATE,
  NEXT_WEEK_QUEUE,
  NEXT_WEEK_REMOVED,
  NEXT_WEEK_SKIPPED,
  OWNER_MINIMUM,
  RANKED_QUEUE,
  RECOMMENDED_ACTION_TEXT,
  SAMPLE_AGING_ROWS,
  SAMPLE_OUTCOME_LOG,
  SKIP_RULES,
  SKIPPED_INVOICES,
  TONE_LADDER,
} from "@/src/lib/premium/ai-collections-assistant/demo-data";
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
        The owner exported the overdue-invoice aging report as CSV and removed
        contact columns first. The workflow needs only these seven columns and
        the export&apos;s as-of date.
      </p>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            As-of date
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {AS_OF_DATE} (fictional)
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Your minimum to chase
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {formatUsd(OWNER_MINIMUM)} (fictional)
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Your tone ladder
          </dt>
          <dd className="mt-1">
            <ul className="space-y-0.5 text-sm text-foreground">
              {TONE_LADDER.map((band) => (
                <li key={band.tone}>{band.label}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <DataTable
        label="Fictional aging report export"
        columns={AGING_COLUMNS}
        monospaceHeader
        rows={SAMPLE_AGING_ROWS.map((row) => [
          row.invoice,
          row.customer,
          row.amount,
          row.dueDate,
          row.daysOverdue,
          row.status,
          row.notes,
        ])}
      />
    </div>
  );
}

export function SkipRulesStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI applies the skip rules before it ranks or drafts anything. Skipped
        invoices are never ranked or drafted, and each one is listed with its
        reason.
      </p>
      <div>
        <h3 className={SUBHEADING}>The five skip rules</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
          {SKIP_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className={SUBHEADING}>Set aside this week ({SKIPPED_INVOICES.length})</h3>
        <ul aria-label="Skipped invoices" className="mt-2 space-y-2">
          {SKIPPED_INVOICES.map((item) => (
            <li key={item.invoice} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="SKIPPED" />
              <span className="font-semibold">{item.invoice}</span>, {item.customer},{" "}
              {formatUsd(item.amount)}: {item.reason}.
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="YOU DECIDE" />
        Whether to resolve the dispute, accept the promise, or override a skip.
      </p>
    </div>
  );
}

export function RankedQueueStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The six remaining invoices are ranked by age band (45+ days, then 15-44,
        then 1-14), then by amount, largest first. Each tone comes from your
        ladder. Invoices at 45+ days get a call note instead of an email draft.
      </p>
      <ol aria-label="Collections queue" className="space-y-3">
        {RANKED_QUEUE.map((item, index) => (
          <li key={item.invoice} className={`${CARD} space-y-1.5 text-sm leading-relaxed`}>
            <p className="font-semibold text-foreground">
              {index + 1}. {item.invoice}, {item.customer}
            </p>
            <p className="text-foreground">
              {formatUsd(item.amount)}, {item.daysOverdue} days overdue
            </p>
            <p className="text-foreground">
              <FactLabel kind="CONFIRMED" />
              {item.confirmed}
            </p>
            <p className="text-foreground">Tone: {item.tone}</p>
            <p className="text-muted">
              {item.messageKind}: &lsquo;{item.message}&rsquo;
            </p>
          </li>
        ))}
      </ol>
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

export function DraftCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Open the {DRAFT_CHECK.invoice} draft (tone: {DRAFT_CHECK.tone}). Before
        anything is sent, every number in it is checked against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{DRAFT_CHECK.draft}</p>
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
            label={`Number check for ${DRAFT_CHECK.invoice}`}
            columns={["Field", "In the draft", "In the export row", "Result"]}
            rows={DRAFT_CHECK.rows.map((row) => [
              row.field,
              row.inDraft,
              row.inExport,
              <span key="result" className="font-semibold text-emerald-800 dark:text-emerald-300">
                Matches
              </span>,
            ])}
          />
        ) : null}
      </div>
      <p className={BODY}>
        Do this for every draft. The Draft Review Checklist in the kit also
        covers the recipient, the tone, and invented facts.
      </p>
    </div>
  );
}

export function NextWeekStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className={SUBHEADING}>
          Outcome log, week of {AS_OF_DATE} (fictional, entered by the owner)
        </h3>
        <DataTable
          label={`Fictional outcome log for the week of ${AS_OF_DATE}`}
          columns={["invoice", "customer", "action_taken", "outcome", "promised_date"]}
          monospaceHeader
          rows={SAMPLE_OUTCOME_LOG.map((row) => [
            row.invoice,
            row.customer,
            row.actionTaken,
            row.outcome,
            row.promisedDate,
          ])}
        />
      </div>
      <div className="space-y-3">
        <h3 className={SUBHEADING}>Mock run as of {NEXT_WEEK_AS_OF_DATE}</h3>
        <p className={BODY}>
          Next week&apos;s run reads the outcome log with the new export. Days
          overdue are recounted from the new as-of date.
        </p>
        <ol aria-label="Next week queue" className="space-y-2">
          {NEXT_WEEK_QUEUE.map((item, index) => (
            <li key={item.invoice} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              {index + 1}. <span className="font-semibold">{item.invoice}</span>,{" "}
              {item.daysOverdue} days overdue, {item.tone}
            </li>
          ))}
        </ol>
        <ul aria-label="Next week skipped invoices" className="space-y-2">
          {NEXT_WEEK_SKIPPED.map((item) => (
            <li key={item.invoice} className="text-sm leading-relaxed text-foreground">
              <FactLabel kind="SKIPPED" />
              {item.invoice} ({item.reason}).
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="REMOVED" />
          {NEXT_WEEK_REMOVED.invoices.join(" and ")} ({NEXT_WEEK_REMOVED.reason}).
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="YOU DECIDE" />
          Only you record outcomes, and only you change a dispute to resolved.
        </p>
      </div>
    </div>
  );
}

export function YouSendItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">
        You send it. Nothing is sent automatically.
      </p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You pick the recipient from your own contacts. AI never chooses or
          sees the recipient address.
        </li>
        <li>You edit the wording and check every number against the export row.</li>
        <li>You send from your own email, or make the call yourself.</li>
        <li>You record the outcome in your log for next week&apos;s run.</li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to QuickBooks, Xero, an invoicing tool, or email.
        The prompts, worksheet, and checklists are in the Premium kit.
      </p>
      <Link
        href={COLLECTIONS_KIT_PATH}
        prefetch={false}
        className={`${PRIMARY_BUTTON} text-center`}
      >
        Open the Premium kit (sign-in required, private preview)
      </Link>
    </div>
  );
}
