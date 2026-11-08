"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  CONFIRMED_LINE,
  DO_NOT_SEND,
  DRAFT_ACKNOWLEDGMENT,
  FACT_CHECK,
  FIT_NO_EXAMPLE,
  KIT_PATH,
  NEEDS_CHECK_EXAMPLE,
  QUESTIONS,
  RECEIVED_DATE,
  RECOMMENDED_ACTION_TEXT,
  REQUEST_SOURCE,
  REQUEST_TEXT,
  REQUESTER,
  RULES_COLUMNS,
  RULES_ROWS,
  TRACKER_CELLS,
  TRACKER_COLUMNS,
  YOU_PRICE_IT,
} from "@/src/lib/premium/quote-request-assistant/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function RequestAndRulesStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This request is invented. No live form, inbox, or CRM is attached. Atlas
        does not connect, upload, or send anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Requester
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{REQUESTER}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Received
          </dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{RECEIVED_DATE}</p>
            <p>{REQUEST_SOURCE}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Website-form request (invented)</h3>
        <blockquote className={`${CARD} mt-2 border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{REQUEST_TEXT}</p>
        </blockquote>
      </div>
      <div>
        <h3 className={SUBHEADING}>Owner-written qualification rules</h3>
        <div className="mt-2">
          <DataTable
            label="Qualification rules"
            columns={RULES_COLUMNS}
            monospaceHeader
            rows={RULES_ROWS}
          />
        </div>
      </div>
    </div>
  );
}

export function ExtractStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI extracts only what the request stated. Approximate wording stays
        approximate. No figure is invented.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_LINE}
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

export function FitStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Fit uses only the written qualification rules. Unusual work that is
        close to the catalog is not auto-rejected.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        Riverside is in service_area. 300 is above minimum_size_sq_ft 150. deck
        replacement is offered.
      </p>
      <p className="text-sm leading-relaxed text-foreground">{FIT_NO_EXAMPLE}</p>
      <p className="text-sm leading-relaxed text-foreground">{NEEDS_CHECK_EXAMPLE}</p>
    </div>
  );
}

export function FactCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Before anyone prices or sends, every CONFIRMED field is checked against
        the request.
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
        Check facts against the request
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label="Fact check against the request"
            columns={["Field", "In the CONFIRMED line", "In the request", "Result"]}
            rows={FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.requestValue,
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

export function QuestionsDraftStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Two clarifying questions and a draft acknowledgment. The draft is not
        sent.
      </p>
      <div>
        <h3 className={SUBHEADING}>Questions</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
          {QUESTIONS.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className={SUBHEADING}>Draft acknowledgment</h3>
        <blockquote
          aria-label="Draft acknowledgment"
          className={`${CARD} mt-2 border-l-4 border-l-accent`}
        >
          <p className="text-sm leading-relaxed text-foreground">{DRAFT_ACKNOWLEDGMENT}</p>
        </blockquote>
      </div>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_SEND}</p>
    </div>
  );
}

export function YouPriceAndSendStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_PRICE_IT}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_SEND}</p>
      <p className={BODY}>
        You add the tracker row, price the job, and send any reply yourself. The
        kit suggests the row. It does not create it.
      </p>
      <DataTable
        label="Suggested tracker row"
        columns={TRACKER_COLUMNS}
        monospaceHeader
        rows={[TRACKER_CELLS]}
      />
      <p className={BODY}>
        Atlas does not connect to a form, inbox, or CRM. The prompts, worksheet,
        and checklists are in the Premium kit.
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
