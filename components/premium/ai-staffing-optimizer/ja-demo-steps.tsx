"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { staffingPaths, type UiLocale } from "@/src/lib/i18n/locale";
import { staffingCopy } from "@/src/lib/premium/ai-staffing-optimizer/copy";
import {
  HOURLY_COLUMNS,
  HOURLY_ROWS,
  hourlyCells,
  MINIMUM_STAFF,
  PROTECTED_ROLE,
  TARGET_RANGE,
  TUE_FACT_CHECK,
} from "@/src/lib/premium/ai-staffing-optimizer/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

function FlagBadge({
  kind,
  icon,
  label,
}: {
  kind: "over" | "under";
  icon: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
        kind === "over"
          ? "border-sky-600/40 text-sky-900 dark:text-sky-200"
          : "border-amber-600/40 text-amber-900 dark:text-amber-200"
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </span>
  );
}

export function JaExportsStep() {
  const demo = staffingCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step1Lead}</p>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p>{demo.rulesCard}</p>
        <p>{demo.protectedRoleLine}</p>
      </div>
      <div>
        <h3 className={SUBHEADING}>{demo.exportHeading}</h3>
        <div className="mt-2">
          <DataTable
            label={demo.exportTableLabel}
            columns={["day-hour", ...HOURLY_COLUMNS.slice(2)]}
            monospaceHeader
            rows={HOURLY_ROWS.map((row) => [`${row.day} ${row.hour}`, ...hourlyCells(row).slice(2)])}
          />
        </div>
      </div>
    </div>
  );
}

export function JaOwnerRulesStep() {
  const demo = staffingCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step2Lead}</p>
      <ul aria-label={demo.ownerRulesLabel} className="space-y-3">
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          フロア最少人数 <span className="font-semibold">{MINIMUM_STAFF}</span>。
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          スタッフ1時間あたり取引数の目標 <span className="font-semibold">{TARGET_RANGE}</span>。
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          守る役割 {PROTECTED_ROLE}。静かな時間帯には仕込みがある場合があります。
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>{demo.patternLine}</li>
      </ul>
    </div>
  );
}

export function JaFlagsStep() {
  const demo = staffingCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step3Lead}</p>
      <ul aria-label={demo.flagsLabel} className="space-y-4">
        <li className={`${CARD} space-y-3 text-sm leading-relaxed text-foreground`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">火 14:00</p>
            <FlagBadge kind="over" icon="▼" label={demo.overstaffedLabel} />
          </div>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.tueConfirmed}
          </p>
        </li>
        <li className={`${CARD} space-y-3 text-sm leading-relaxed text-foreground`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">土 12:00</p>
            <FlagBadge kind="under" icon="▲" label={demo.understaffedLabel} />
          </div>
          <p>
            <FactLabel kind="CONFIRMED" label="確認済み" />
            {demo.satConfirmed}
          </p>
        </li>
      </ul>
      <ul aria-label={demo.labelsHow} className="space-y-2 text-sm leading-relaxed text-foreground">
        <li>
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.confirmedHelp}
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" label="オーナー入力" />
          {demo.ownerHelp}
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
          {demo.interpretationHelp}
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
          {demo.recommendedHelp}
        </li>
      </ul>
    </div>
  );
}

export function JaFactCheckStep() {
  const demo = staffingCopy("ja").demo;
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>{demo.step4Lead}</p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.tueConfirmed}
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
            rows={TUE_FACT_CHECK.rows.map((row) => [
              row.week,
              row.confirmedTx,
              row.exportTx,
              row.confirmedStaff,
              row.exportStaff,
              <span key="result" className="font-semibold text-emerald-800 dark:text-emerald-300">
                {demo.factResult}
              </span>,
            ])}
          />
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" label="AIの解釈" />
        {demo.interpretation}
      </p>
    </div>
  );
}

export function JaRecommendationStep() {
  const demo = staffingCopy("ja").demo;
  return (
    <div className="space-y-5">
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p>
          <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
          {demo.recommendedTue}
        </p>
        <p>
          <FactLabel kind="RECOMMENDED ACTION" label="推奨アクション" />
          {demo.recommendedSat}
        </p>
        <p>{demo.checkLocalRules}</p>
      </div>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p className="font-semibold">{demo.recheckHeading}</p>
        <p>
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.recheckTue}
        </p>
        <p>
          <FactLabel kind="CONFIRMED" label="確認済み" />
          {demo.recheckSat}
        </p>
        <p>{demo.recheckSentence}</p>
      </div>
    </div>
  );
}

export function JaYouEditStep({ pathLocale }: { pathLocale: UiLocale | null }) {
  const demo = staffingCopy("ja").demo;
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{demo.step6Title}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.doNotCutMinimum}</p>
      <p className="text-sm leading-relaxed text-foreground">{demo.checkLocalRules}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        {demo.boundaries.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={BODY}>{demo.kitLead}</p>
      <Link
        href={staffingPaths(pathLocale).kit}
        prefetch={false}
        className={`${PRIMARY_BUTTON} w-full max-w-full whitespace-normal text-center sm:w-auto`}
      >
        {demo.kitLink}
      </Link>
    </div>
  );
}
