"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  CONFIRMED_TEXT,
  DO_NOT_DRAFT_MONEY,
  DO_NOT_INVENT_FRIDAY,
  DO_NOT_SEND,
  ESCALATE_IF,
  ESCALATE_LINE,
  FACT_CHECK,
  FAQ_FACTS,
  FAQ_FACT_TEXT,
  HOW_TO_ONLY_CONTRAST,
  INTERNAL_NOTE_TEXT,
  KIT_PATH,
  LONG_WAIT_UNVERIFIED,
  MESSAGE_SOURCE,
  MESSAGE_TEXT,
  NEEDS_YOUR_CHECK_TEXT,
  NEVER_IN_DRAFT,
  OTHER_ESCALATE_RULES,
  PARTIAL_DRAFT,
  RECEIVED_DATE,
  RECOMMENDED_ACTION_TEXT,
  REVIEW_QUEUE_LINE,
  SENDER,
  TONE,
  YOU_SEND_IT,
} from "@/src/lib/premium/ai-customer-response-assistant/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function FaqToneAndMessageStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This website-form message is invented. No live inbox, form tool, or
        helpdesk is attached. Atlas does not connect, upload, or send anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Sender
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{SENDER}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Received
          </dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{RECEIVED_DATE}</p>
            <p>{MESSAGE_SOURCE}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Website-form message (invented)</h3>
        <blockquote className={`${CARD} mt-2 border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{MESSAGE_TEXT}</p>
        </blockquote>
      </div>
      <div>
        <h3 className={SUBHEADING}>Owner-written FAQ (invented)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
          {FAQ_FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            escalate_if
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{ESCALATE_IF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            tone
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{TONE}</dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">
        never_in_draft: {NEVER_IN_DRAFT}
      </p>
    </div>
  );
}

export function EscalateFirstStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Escalate rules run before any customer-facing draft. A mixed message can
        still keep a timing question, but money stays off the draft.
      </p>
      <p className="text-sm font-semibold text-foreground">{REVIEW_QUEUE_LINE}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="ESCALATE" />
        {ESCALATE_LINE}
      </p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_DRAFT_MONEY}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="INTERNAL NOTE" />
        {INTERNAL_NOTE_TEXT}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{OTHER_ESCALATE_RULES}</p>
    </div>
  );
}

export function FaqOnlyTimingStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The timing question is answered only from the pasted FAQ. The money
        topic stays with the owner.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" />
        {CONFIRMED_TEXT}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="FAQ FACT" />
        {FAQ_FACT_TEXT}
      </p>
      <div>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="PARTIAL DRAFT" />
          timing only, you may discard
        </p>
        <blockquote
          aria-label="Partial draft"
          className={`${CARD} mt-2 border-l-4 border-l-accent`}
        >
          <p className="text-sm leading-relaxed text-foreground">{PARTIAL_DRAFT}</p>
        </blockquote>
      </div>
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

export function CheckFactsStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Before anyone sends, every FAQ FACT is checked against the pasted FAQ
        and the message.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="FAQ FACT" />
          {FACT_CHECK.faqFactLine}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed(true)}
      >
        Check facts against the FAQ
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label="Fact check against the FAQ"
            columns={["Field", "In the review", "In the FAQ or message", "Result"]}
            rows={FACT_CHECK.rows.map((row) => [
              row.field,
              row.reviewValue,
              row.sourceValue,
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

export function MissingAnswersStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Missing answers stay labelled. The shop does not invent Friday openings
        or treat an unverified wait as a fact.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" />
        {NEEDS_YOUR_CHECK_TEXT}
      </p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_INVENT_FRIDAY}</p>
      <p className="text-sm font-semibold text-foreground">{LONG_WAIT_UNVERIFIED}</p>
      <p className="text-sm leading-relaxed text-foreground">{HOW_TO_ONLY_CONTRAST}</p>
    </div>
  );
}

export function YouSendItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_SEND_IT}</p>
      <p className="text-sm font-semibold text-foreground">{DO_NOT_SEND}</p>
      <p className={BODY}>
        The owner handles the refund themselves, may edit or discard the timing
        sentence, sends from their own inbox, and logs sent, held, or escalated.
        Nothing is sent, edited, cancelled, or paid automatically.
      </p>
      <p className={BODY}>
        Atlas does not connect to an inbox, form tool, or helpdesk. The prompts,
        worksheet, and checklists are in the Premium kit.
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
