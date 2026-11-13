"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { proposalPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { proposalCopy } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy";
import {
  AS_OF,
  CADENCE_TEXT,
  MIN_AMOUNT_DISPLAY,
  NUMBER_CHECK,
  OUTCOME_LOG_COLUMNS,
  OUTCOME_LOG_ROWS,
  outcomeLogCells,
  PROPOSAL_COLUMNS,
  PROPOSAL_ROWS,
  proposalCells,
  QUEUE_COLUMNS,
  QUEUED_ROWS,
  SILENCE_DATE,
} from "@/src/lib/premium/ai-proposal-follow-up-assistant/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

const JA_LABEL = {
  confirmed: "確認済み",
  interpretation: "AIの解釈",
  action: "推奨アクション",
  skipped: "対象外",
} as const;

function useJaDemo() {
  return proposalCopy("ja").demo;
}

export function JaExportStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.asOfLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{AS_OF}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.silenceLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{SILENCE_DATE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.minimumLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{MIN_AMOUNT_DISPLAY}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.cadenceLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{CADENCE_TEXT}</dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>{demo.exportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.exportTableLabel}
            columns={PROPOSAL_COLUMNS}
            monospaceHeader
            rows={PROPOSAL_ROWS.map((row) => proposalCells(row))}
          />
        </div>
      </div>
    </div>
  );
}

export function JaSkipRulesStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      {demo.skipped.map((reason) => (
        <p key={reason} className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
          {reason}
        </p>
      ))}
      <p className="text-sm leading-relaxed text-foreground">{demo.skippedStatusRules}</p>
    </div>
  );
}

export function JaRankedQueueStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <p className={SUBHEADING}>{demo.queueHeading}</p>
      <DataTable
        label={demo.queueTableLabel}
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
          <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
          {demo.confirmedLine}
        </p>
        <blockquote className={`${CARD} border-l-4 border-l-accent`}>
          <p className="text-sm leading-relaxed text-foreground">{demo.draftText}</p>
        </blockquote>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label={JA_LABEL.interpretation} />
        {demo.interpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label={JA_LABEL.action} />
        {demo.recommended}
      </p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotInvent}</p>
    </div>
  );
}

export function JaCheckNumbersStep() {
  const demo = useJaDemo();
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">{demo.draftText}</p>
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
            rows={NUMBER_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.exportValue,
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

export function JaNextWeekLogStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <h3 className={SUBHEADING}>{demo.outcomeHeading}</h3>
      <DataTable
        label={demo.outcomeTableLabel}
        columns={OUTCOME_LOG_COLUMNS}
        monospaceHeader
        rows={OUTCOME_LOG_ROWS.map((row) => outcomeLogCells(row))}
      />
      <h3 className={SUBHEADING}>{demo.nextWeekHeading}</h3>
      <p className="text-sm leading-relaxed text-foreground">{demo.stillQueued}</p>
      {demo.nextWeekSkipped.map((reason) => (
        <p key={reason} className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
          {reason}
        </p>
      ))}
      <p className="text-sm font-semibold text-foreground">{demo.loggedDeclined}</p>
    </div>
  );
}

export function JaYouSendItStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  const paths = proposalPaths(pathLocale);
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm font-semibold text-foreground">{demo.doNotInvent}</p>
      <p className={BODY}>{demo.step6Body}</p>
      <p className={BODY}>{demo.step6Boundary}</p>
      <Link
        href={paths.kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
