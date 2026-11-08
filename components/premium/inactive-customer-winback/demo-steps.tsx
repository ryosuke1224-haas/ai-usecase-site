"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION,
  AS_OF,
  CONFIRM_CONSENT,
  CONTACT_LOG_NOTE,
  CUSTOMER_COLUMNS,
  CUSTOMER_ROWS,
  customerCells,
  DO_NOT_INVENT,
  FACT_CHECK,
  KIT_PATH,
  LAPSE_BEFORE,
  LAPSE_DATE_SENTENCE,
  OCCASIONAL_OFFER,
  QUEUED_ROWS,
  QUEUE_COLUMNS,
  RECOMMENDED_ACTION,
  RETURN_AS_OF,
  RETURN_NOT_PROOF,
  RETURN_ROWS,
  SKIPPED_CHEN,
  SKIPPED_DIAZ,
  SKIPPED_ORTIZ,
  SKIPPED_SINGH,
  SKIPPED_WELLS,
  VIP_FLOOR,
  VIP_OFFER,
  YOU_SEND_IT,
} from "@/src/lib/premium/inactive-customer-winback/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function CustomersStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This customer table is invented. No live Square, Mindbody, POS, email, or
        SMS account is attached. Atlas does not connect, upload, or send anything.
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
            lapse_if_last_visit_before
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{LAPSE_BEFORE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            vip_if_visits_12mo
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{VIP_FLOOR}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            skip_one_time_buyers
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">yes</dd>
        </div>
      </dl>
      <div className={CARD}>
        <h3 className={SUBHEADING}>Written offers (invented)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          <li>{VIP_OFFER} (VIP only)</li>
          <li>{OCCASIONAL_OFFER} (occasional)</li>
        </ul>
      </div>
      <div>
        <h3 className={SUBHEADING}>Customer export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Customer export"
            columns={CUSTOMER_COLUMNS}
            monospaceHeader
            rows={CUSTOMER_ROWS.map((row) => customerCells(row))}
          />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        Contact log this period: {CONTACT_LOG_NOTE}
      </p>
    </div>
  );
}

export function SkipRulesStep() {
  const skips = [
    SKIPPED_CHEN,
    SKIPPED_ORTIZ,
    SKIPPED_SINGH,
    SKIPPED_DIAZ,
    SKIPPED_WELLS,
  ];

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Skip rules run before any segment, rank, or draft. Every skipped row keeps
        a visible reason. Do not draft first and skip later.
      </p>
      <ul className="space-y-3" aria-label="Skipped customers">
        {skips.map((reason) => (
          <li key={reason} className="text-sm leading-relaxed text-foreground">
            <FactLabel kind="SKIPPED" />
            {reason}
          </li>
        ))}
      </ul>
      <p className="text-sm font-semibold text-foreground">{LAPSE_DATE_SENTENCE}</p>
    </div>
  );
}

export function QueueDraftsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Remaining rows rank VIP first, then by days since last visit. Drafts use
        only export fields and the written offer list.
      </p>
      <DataTable
        label="VIP-first winback queue"
        columns={QUEUE_COLUMNS}
        monospaceHeader
        rows={QUEUED_ROWS.map((row) => [row.rank, row.first, row.segment, row.draft])}
      />
      {QUEUED_ROWS.map((row) => (
        <div key={row.first} className={`${CARD} space-y-2`}>
          <p className="text-sm font-semibold text-foreground">
            {row.rank}. {row.first}
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            <FactLabel kind="CONFIRMED" />
            {row.confirmed}
          </p>
          <blockquote className="border-l-4 border-l-accent pl-3 text-sm leading-relaxed text-foreground">
            {row.draft}
          </blockquote>
        </div>
      ))}
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" />
        {RECOMMENDED_ACTION}
      </p>
      <p className={BODY}>
        No draft invents an offer outside the written list.
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
        Before anyone contacts a customer, every CONFIRMED field is checked against
        the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {FACT_CHECK.confirmed}
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
            label="Fact check against the export row"
            columns={["Field", "In the CONFIRMED line", "In the export row", "Result"]}
            rows={FACT_CHECK.rows.map((row) => [
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

export function ReturnCheckStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Later fictional POS export as_of {RETURN_AS_OF}. Returned vs still lapsed
        comes from the new last-visit dates. Mark outcomes in your contact log
        yourself.
      </p>
      <ul className="space-y-3" aria-label="Return check outcomes">
        {RETURN_ROWS.map((row) => (
          <li key={row.first} className="text-sm leading-relaxed text-foreground">
            {row.status === "RETURNED" ? (
              <FactLabel kind="RETURNED" />
            ) : (
              <FactLabel kind="CONFIRMED" />
            )}
            {row.first}{" "}
            {row.status === "RETURNED"
              ? `RETURNED (last visit ${row.lastVisit})`
              : `still lapsed (last visit ${row.lastVisit})`}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {RETURN_NOT_PROOF}
      </p>
      <p className="text-sm font-semibold text-foreground">{CONFIRM_CONSENT}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_ORTIZ}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_SINGH}
      </p>
    </div>
  );
}

export function YouSendItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_SEND_IT}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_INVENT}</p>
      <p className={BODY}>
        You pick the recipient from your own contacts and send from your own email
        or SMS tool, or you decide not to. Nothing is sent, edited, cancelled, or
        paid automatically. Confirmed facts, AI interpretation, and recommended
        actions stay labelled separately through the Premium kit.
      </p>
      <p className={BODY}>
        Atlas does not connect to Square, Mindbody, a POS, email, or SMS. The
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
