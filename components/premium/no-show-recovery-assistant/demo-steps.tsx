"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  AS_OF,
  BOOKING_COLUMNS,
  BOOKING_ROWS,
  bookingCells,
  CONFIRMED_OPEN_SLOTS,
  CONFIRMED_RIVERA,
  CONFIRM_CONSENT,
  DO_NOT_SEND,
  DRAFT_SMS,
  FACT_CHECK,
  FLAGGED_KIM,
  KIT_PATH,
  NO_DEPOSIT,
  NOT_OFFERED,
  OPEN_SLOT_COLUMNS,
  OPEN_SLOTS,
  openSlotCells,
  RECOMMENDED_ACTION_TEXT,
  REPEAT_NO_SHOW_THRESHOLD,
  SERVICE_DOES_NOT_MATCH,
  SKIPPED_CHEN,
  SKIPPED_OKONKWO,
  SKIPPED_PATEL,
  THIRD_NO_SHOW_POLICY,
  YOU_REVIEW_AND_SEND,
} from "@/src/lib/premium/no-show-recovery-assistant/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function BookingsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This booking list is invented. No live calendar, SMS, Calendly, Square,
        Acuity, or Twilio account is attached. Atlas does not connect, upload,
        or send anything.
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
            repeat_no_show_threshold
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {REPEAT_NO_SHOW_THRESHOLD}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Day&apos;s bookings (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Day's bookings"
            columns={BOOKING_COLUMNS}
            monospaceHeader
            rows={BOOKING_ROWS.map((row) => bookingCells(row))}
          />
        </div>
      </div>
      <div>
        <h3 className={SUBHEADING}>Open slots (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Open slots"
            columns={OPEN_SLOT_COLUMNS}
            monospaceHeader
            rows={OPEN_SLOTS.map((slot) => openSlotCells(slot))}
          />
        </div>
      </div>
    </div>
  );
}

export function ConfirmAttendanceStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Attendance is confirmed against the booking row before any draft. Skipped
        rows keep a visible reason.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_RIVERA}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_CHEN}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED" />
        {SKIPPED_PATEL}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED FOR SMS" />
        {SKIPPED_OKONKWO}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="FLAG FOR POLICY" />
        {FLAGGED_KIM}
      </p>
    </div>
  );
}

export function DraftStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        One unsent SMS draft for the confirmed miss. Offered times come from the
        open-slot list and match the missed service.
      </p>
      <blockquote aria-label="Draft SMS" className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{DRAFT_SMS}</p>
      </blockquote>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_RIVERA} {CONFIRMED_OPEN_SLOTS}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION_TEXT}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" />
        {RECOMMENDED_ACTION_TEXT}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{NOT_OFFERED}</p>
      <p className="text-sm leading-relaxed text-foreground">{SERVICE_DOES_NOT_MATCH}</p>
    </div>
  );
}

export function FactCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Before anyone contacts a client, every CONFIRMED field is checked against
        the booking row.
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
        Check facts against the booking row
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label="Fact check against the booking row"
            columns={["Field", "In the CONFIRMED line", "In the booking row", "Result"]}
            rows={FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.bookingValue,
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

export function RepeatPolicyStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Repeat no-shows stay with the owner. Missing consent is not a text.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="FLAG FOR POLICY" />
        {FLAGGED_KIM}
      </p>
      <p className="text-sm font-semibold text-foreground">{THIRD_NO_SHOW_POLICY}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="SKIPPED FOR SMS" />
        {SKIPPED_OKONKWO}
      </p>
      <p className="text-sm font-semibold text-foreground">{CONFIRM_CONSENT}</p>
      <p className="text-sm font-semibold text-foreground">{NO_DEPOSIT}</p>
    </div>
  );
}

export function YouReviewAndSendStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_REVIEW_AND_SEND}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_SEND}</p>
      <p className={BODY}>
        You pick the recipient from your own contacts and send from your own SMS
        or email tool, or you decide not to. Nothing is sent, booked, cancelled,
        or paid automatically.
      </p>
      <p className={BODY}>
        Atlas does not connect to a calendar, SMS tool, Calendly, Square, Acuity,
        or Twilio. The prompts, worksheet, and checklists are in the Premium kit.
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
