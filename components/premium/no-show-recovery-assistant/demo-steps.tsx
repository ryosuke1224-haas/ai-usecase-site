"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { noShowPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

function useDemo(locale: UiLocale) {
  return noShowCopy(locale).demo;
}

export function BookingsStep({ locale }: { locale: UiLocale; pathLocale: UiLocale | null }) {
  const demo = useDemo(locale);
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
        <h3 className={SUBHEADING}>{demo.openSlotsLabel}</h3>
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

export function ConfirmAttendanceStep({ locale }: { locale: UiLocale; pathLocale: UiLocale | null }) {
  const demo = useDemo(locale);
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <div>
        <h3 className={SUBHEADING}>{demo.skippedLabel}</h3>
        <ul aria-label={demo.skippedLabel} className="mt-2 space-y-2">
          {demo.skipped.map((item) => (
            <li key={item.client} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="SKIPPED" locale={locale} />
              <span className="font-semibold">{item.client}</span>: {item.reason}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.confirmedLabel}</h3>
        <ul aria-label={demo.confirmedLabel} className="mt-2 space-y-2">
          {demo.confirmed.map((item) => (
            <li key={item.client} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="CONFIRMED" locale={locale} />
              <span className="font-semibold">{item.client}</span>: {item.detail}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" locale={locale} />
        {demo.smsHold}
      </p>
    </div>
  );
}

export function DraftStep({ locale }: { locale: UiLocale; pathLocale: UiLocale | null }) {
  const demo = useDemo(locale);
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className={`text-xs font-semibold text-muted ${locale === "ja" ? "" : "uppercase tracking-wider"}`}>
          {demo.draftLabel}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{demo.draftText}</p>
      </blockquote>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="NEEDS YOUR CHECK" locale={locale} />
        {demo.step3Needs}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{demo.step3Policy}</p>
      <p className="text-sm font-medium leading-relaxed text-foreground">{demo.step3Boundary}</p>
    </div>
  );
}

export function FactCheckStep({ locale }: { locale: UiLocale; pathLocale: UiLocale | null }) {
  const demo = useDemo(locale);
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

export function RepeatPolicyStep({ locale }: { locale: UiLocale; pathLocale: UiLocale | null }) {
  const demo = useDemo(locale);
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step5Lead}</p>
      <p className={`${CARD} text-sm leading-relaxed text-foreground`}>
        <span className="font-semibold">{locale === "ja" ? `${demo.policyLabel}：` : `${demo.policyLabel}. `}</span>
        {demo.policyDetail}
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="YOU DECIDE" locale={locale} />
        {demo.step5Boundary}
      </p>
    </div>
  );
}

export function YouReviewAndSendStep({
  locale,
  pathLocale,
}: {
  locale: UiLocale;
  pathLocale: UiLocale | null;
}) {
  const demo = useDemo(locale);
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
