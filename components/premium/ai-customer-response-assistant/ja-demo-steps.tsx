"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { replyPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { replyCopy } from "@/src/lib/premium/ai-customer-response-assistant/copy";
import {
  ESCALATE_IF,
  FACT_CHECK,
  FAQ_FACTS,
  MESSAGE_SOURCE,
  MESSAGE_TEXT,
  RECEIVED_DATE,
  SENDER,
  TONE,
} from "@/src/lib/premium/ai-customer-response-assistant/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

const JA_LABEL = {
  confirmed: "確認済み",
  needsCheck: "要確認",
  interpretation: "AIの解釈",
  action: "推奨アクション",
  escalate: "エスカレート",
  faqFact: "FAQの事実",
  internalNote: "社内メモ",
  partialDraft: "一部下書き",
} as const;

function useJaDemo() {
  return replyCopy("ja").demo;
}

export function JaFaqToneAndMessageStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.senderLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{SENDER}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.receivedLabel}</dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{RECEIVED_DATE}</p>
            <p>{MESSAGE_SOURCE}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.messageHeading}</h3>
        <blockquote className={`${CARD} mt-2 border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{MESSAGE_TEXT}</p>
        </blockquote>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.faqHeading}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
          {FAQ_FACTS.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.escalateLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{ESCALATE_IF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.toneLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{TONE}</dd>
        </div>
      </dl>
      <p className="text-sm leading-relaxed text-foreground">{demo.neverInDraftLine}</p>
    </div>
  );
}

export function JaEscalateFirstStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <p className="text-sm font-semibold text-foreground">{demo.reviewQueueLine}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="ESCALATE" label={JA_LABEL.escalate} />
        {demo.escalateLine}
      </p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotDraftMoney}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="INTERNAL NOTE" label={JA_LABEL.internalNote} />
        {demo.internalNote}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.otherEscalateRules}</p>
    </div>
  );
}

export function JaFaqOnlyTimingStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
        {demo.confirmedLine}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="FAQ FACT" label={JA_LABEL.faqFact} />
        {demo.faqFactLine}
      </p>
      <div>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="PARTIAL DRAFT" label={JA_LABEL.partialDraft} />
          {demo.partialDraftLabel}
        </p>
        <blockquote
          aria-label={JA_LABEL.partialDraft}
          className={`${CARD} mt-2 border-l-4 border-l-accent`}
        >
          <p className="text-sm leading-relaxed text-foreground">{demo.partialDraft}</p>
        </blockquote>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.needsCheckLine}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label={JA_LABEL.interpretation} />
        {demo.interpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label={JA_LABEL.action} />
        {demo.recommended}
      </p>
    </div>
  );
}

export function JaCheckFactsStep() {
  const demo = useJaDemo();
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="FAQ FACT" label={JA_LABEL.faqFact} />
          {demo.factFaqLine}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed(true)}
      >
        {demo.factButton}
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label={demo.factTableLabel}
            columns={[...demo.factColumns]}
            rows={FACT_CHECK.rows.map((row) => [
              row.field,
              row.reviewValue,
              row.sourceValue,
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

export function JaMissingAnswersStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.needsCheckLine}
      </p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotInventFriday}</p>
      <p className="text-sm font-semibold text-foreground">{demo.longWaitUnverified}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.howToOnlyContrast}</p>
    </div>
  );
}

export function JaYouSendItStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotSend}</p>
      <p className={BODY}>{demo.step6Body}</p>
      <p className={BODY}>{demo.step6Boundary}</p>
      <Link
        href={replyPaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
