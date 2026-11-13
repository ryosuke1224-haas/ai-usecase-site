"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { quotePaths, type UiLocale } from "@/src/lib/i18n/locale";
import { quoteCopy } from "@/src/lib/premium/quote-request-assistant/copy";
import {
  FACT_CHECK,
  RECEIVED_DATE,
  REQUEST_SOURCE,
  REQUEST_TEXT,
  REQUESTER,
  RULES_COLUMNS,
  RULES_ROWS,
  TRACKER_CELLS,
  TRACKER_COLUMNS,
} from "@/src/lib/premium/quote-request-assistant/demo-data";
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
} as const;

function useJaDemo() {
  return quoteCopy("ja").demo;
}

export function JaRequestAndRulesStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.requesterLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{REQUESTER}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.receivedLabel}</dt>
          <dd className="mt-1 space-y-1 text-sm font-semibold text-foreground">
            <p>{RECEIVED_DATE}</p>
            <p>{REQUEST_SOURCE}</p>
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.requestHeading}</h3>
        <blockquote className={`${CARD} mt-2 border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{REQUEST_TEXT}</p>
        </blockquote>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.rulesHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.rulesTableLabel}
            columns={RULES_COLUMNS}
            monospaceHeader
            rows={RULES_ROWS}
          />
        </div>
      </div>
    </div>
  );
}

export function JaExtractStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
        {demo.confirmedLine}
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

export function JaFitStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.fitReasons}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.fitNoExample}</p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.needsCheckExample}
      </p>
    </div>
  );
}

export function JaFactCheckStep() {
  const demo = useJaDemo();
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
          {demo.factConfirmed}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
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
              row.confirmed,
              row.requestValue,
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

export function JaQuestionsDraftStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <div>
        <h3 className={SUBHEADING}>{demo.questionsHeading}</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
          {demo.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.draftHeading}</h3>
        <blockquote
          aria-label={demo.draftHeading}
          className={`${CARD} mt-2 border-l-4 border-l-accent`}
        >
          <p className="text-sm leading-relaxed text-foreground">{demo.draftText}</p>
        </blockquote>
      </div>
      <p className="text-sm font-semibold text-foreground">{demo.doNotSend}</p>
    </div>
  );
}

export function JaYouPriceAndSendStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotSend}</p>
      <p className={BODY}>{demo.step6Body}</p>
      <DataTable
        label={demo.trackerLabel}
        columns={TRACKER_COLUMNS}
        monospaceHeader
        rows={[TRACKER_CELLS]}
      />
      <p className={BODY}>{demo.step6Boundary}</p>
      <Link
        href={quotePaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
