"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { winbackPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { winbackCopy } from "@/src/lib/premium/inactive-customer-winback/copy";
import {
  AS_OF,
  CUSTOMER_COLUMNS,
  CUSTOMER_ROWS,
  customerCells,
  FACT_CHECK,
  LAPSE_BEFORE,
  QUEUE_COLUMNS,
  VIP_FLOOR,
  VIP_OFFER,
} from "@/src/lib/premium/inactive-customer-winback/demo-data";
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
  skipped: "対象外",
  returned: "再来",
} as const;

function useJaDemo() {
  return winbackCopy("ja").demo;
}

export function JaCustomersStep() {
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
          <dt className="text-xs font-semibold text-muted">{demo.lapseLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{LAPSE_BEFORE}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.vipLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{VIP_FLOOR}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold text-muted">{demo.skipOneTimeLabel}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{demo.skipOneTimeValue}</dd>
        </div>
      </dl>
      <div className={CARD}>
        <h3 className={SUBHEADING}>{demo.offersHeading}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
          <li>{demo.vipOfferLine}</li>
          <li>{demo.occasionalOfferLine}</li>
        </ul>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.exportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.exportTableLabel}
            columns={CUSTOMER_COLUMNS}
            monospaceHeader
            rows={CUSTOMER_ROWS.map((row) => customerCells(row))}
          />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{demo.contactLogLine}</p>
    </div>
  );
}

export function JaSkipRulesStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <ul className="space-y-3" aria-label={demo.skippedLabel}>
        {demo.skipped.map((reason) => (
          <li key={reason} className="text-sm leading-relaxed text-foreground">
            <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
            {reason}
          </li>
        ))}
      </ul>
      <p className="text-sm font-semibold text-foreground">{demo.lapseDateSentence}</p>
    </div>
  );
}

export function JaQueueDraftsStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <DataTable
        label={demo.queueTableLabel}
        columns={QUEUE_COLUMNS}
        monospaceHeader
        rows={demo.drafts.map((row) => [row.rank, row.first, row.segment, row.draft])}
      />
      {demo.drafts.map((row) => (
        <div key={row.first} className={`${CARD} space-y-2`}>
          <p className="text-sm font-semibold text-foreground">
            {row.rank}. {row.first}
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
            {row.confirmed}
          </p>
          <blockquote className="border-l-4 border-l-accent pl-3 text-sm leading-relaxed text-foreground">
            {row.draft}
          </blockquote>
        </div>
      ))}
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label={JA_LABEL.interpretation} />
        {demo.interpretation}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label={JA_LABEL.action} />
        {demo.recommended}
      </p>
      <p className={BODY}>{demo.noInventLine}</p>
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
              row.field === "offer" ? VIP_OFFER : row.confirmed,
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

export function JaReturnCheckStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <ul className="space-y-3" aria-label="再来確認の結果">
        {demo.returnOutcomes.map((line, index) => (
          <li key={line} className="text-sm leading-relaxed text-foreground">
            {index === 0 ? (
              <FactLabel kind="RETURNED" label={JA_LABEL.returned} />
            ) : (
              <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
            )}
            {line}
          </li>
        ))}
      </ul>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label={JA_LABEL.interpretation} />
        {demo.returnNotProof}
      </p>
      <p className="text-sm font-semibold text-foreground">{demo.confirmConsent}</p>
      {demo.stillSkipped.map((reason) => (
        <p key={reason} className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
          {reason}
        </p>
      ))}
    </div>
  );
}

export function JaYouSendItStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  const paths = winbackPaths(pathLocale);
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
