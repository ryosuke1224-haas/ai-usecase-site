"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { noShowPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

const JA_LABEL = {
  confirmed: "確認済み",
  needsCheck: "要確認",
  interpretation: "AIの解釈",
  action: "推奨アクション",
  skipped: "対象外",
} as const;

function useJaDemo() {
  return noShowCopy("ja").demo;
}

export function JaBookingsStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <p className="text-sm text-foreground">
        <span className="font-semibold">{demo.asOfLabel}: </span>
        {demo.asOfValue}
      </p>
      <DataTable
        label={demo.bookingsLabel}
        columns={demo.columns}
        monospaceHeader
        rows={demo.rows.map((row) => [
          row.time,
          row.client,
          row.service,
          row.status,
          row.contactPref,
          row.smsConsent,
          row.prior,
        ])}
      />
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{demo.openSlotsLabel}</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {demo.slots.map((slot) => (
            <li key={`${slot.service}-${slot.when}`}>
              {slot.service} — {slot.when}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-foreground">{demo.consentTeaching}</p>
    </div>
  );
}

export function JaConfirmAttendanceStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{demo.skippedLabel}</h3>
        <ul className="mt-2 space-y-2">
          {demo.skipped.map((item) => (
            <li key={item.client} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="SKIPPED" label={JA_LABEL.skipped} />
              <span className="font-semibold">{item.client}</span>: {item.reason}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{demo.confirmedLabel}</h3>
        <ul className="mt-2 space-y-2">
          {demo.confirmed.map((item) => (
            <li key={item.client} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="CONFIRMED" label={JA_LABEL.confirmed} />
              <span className="font-semibold">{item.client}</span>: {item.detail}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.smsHold}
      </p>
    </div>
  );
}

export function JaDraftStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-xs font-semibold text-muted">{demo.draftLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{demo.draftText}</p>
      </blockquote>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" label={JA_LABEL.needsCheck} />
        {demo.step3Needs}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.step3Policy}</p>
      <p className="text-sm font-medium leading-relaxed text-foreground">{demo.step3Boundary}</p>
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
            columns={demo.factColumns}
            rows={demo.factRows.map((row) => [
              row.field,
              row.confirmed,
              row.booking,
              <span key={row.field} className="font-semibold text-emerald-800 dark:text-emerald-300">
                {demo.factResult}
              </span>,
            ])}
          />
        ) : null}
      </div>
    </div>
  );
}

export function JaRepeatPolicyStep() {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <p className={`${CARD} text-sm leading-relaxed text-foreground`}>
        <span className="font-semibold">{demo.policyLabel}：</span>
        {demo.policyDetail}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" label="人が決める" />
        {demo.step5Boundary}
      </p>
    </div>
  );
}

export function JaYouReviewAndSendStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = useJaDemo();
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6TitleSentence}</p>
      <p className={BODY}>{demo.step6Body}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.step6Boundary}</p>
      <Link
        href={noShowPaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
