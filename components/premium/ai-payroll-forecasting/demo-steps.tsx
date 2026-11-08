"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  DO_NOT_CUT_COVERAGE,
  EMPLOYER_LOAD,
  KIT_PATH,
  OVERTIME_FLAG_RULE,
  OVERTIME_MULTIPLIER,
  PAY_PERIOD,
  PROJECTED_REVENUE,
  RECHECK_SENTENCE,
  SCHEDULE_COLUMNS,
  SCHEDULE_ROWS,
  STYLIST_FACT_CHECK,
  TARGET_LABOR,
  YOU_EDIT_SCHEDULE,
} from "@/src/lib/premium/ai-payroll-forecasting/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function ScheduleExportStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This table is invented. No live scheduling, time-clock, POS, or payroll
        account is attached. Atlas does not connect, upload, or edit anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Pay period
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{PAY_PERIOD}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Projected revenue this period
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {PROJECTED_REVENUE}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Employer load
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{EMPLOYER_LOAD}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Target labor % of revenue
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{TARGET_LABOR}</dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Overtime multiplier
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {OVERTIME_MULTIPLIER}
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Overtime flag rule
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {OVERTIME_FLAG_RULE}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className={SUBHEADING}>Fictional schedule export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Fictional schedule export"
            columns={SCHEDULE_COLUMNS}
            monospaceHeader
            rows={SCHEDULE_ROWS.map((row) => [
              row.role,
              row.scheduledHours,
              row.hourlyRate,
              row.overtimeHours,
            ])}
          />
        </div>
      </div>
    </div>
  );
}

export function FormulasStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI calculates regular pay, overtime, and loaded payroll with every
        formula left visible as text. Schedule × rate is CONFIRMED. Load and
        revenue are OWNER-ENTERED. Totals are CALCULATED.
      </p>
      <ul aria-label="Visible payroll formulas" className="space-y-3">
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">stylist</p>
          <p>
            <FactLabel kind="CONFIRMED" />
            regular =124*22 = 2728; overtime =4*33 = 132; subtotal 2860.
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p className="font-semibold">front_desk</p>
          <p>
            <FactLabel kind="CONFIRMED" />
            =64*18 = 1152.
          </p>
        </li>
        <li className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
          <p>
            <FactLabel kind="OWNER-ENTERED" />
            load {EMPLOYER_LOAD}; revenue figure {PROJECTED_REVENUE}.
          </p>
          <p>
            <FactLabel kind="CALCULATED" />
            base pay =4012; loaded payroll =4012*1.20 = 4814.40.
          </p>
        </li>
      </ul>
    </div>
  );
}

export function FlagsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Flags use only the owner&apos;s target and overtime rule. A single busy
        day is not flagged.
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="CALCULATED" />
        loaded labor =4814.40/9800 = 49.1% of that revenue figure (above the 40%
        target).
      </p>
      <p className="text-sm leading-relaxed text-foreground">
        Overtime flag: stylist schedule includes 4 overtime hours.
      </p>
      <ul
        aria-label="How labels are used"
        className="space-y-2 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Schedule × rate from the export.
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" />
          Load factor, target, revenue estimate, overtime rule.
        </li>
        <li>
          <FactLabel kind="CALCULATED" />
          Formula results and labor percentage.
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" />
          An inference, never presented as a fact.
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" />
          A suggestion. You decide whether it happens.
        </li>
      </ul>
    </div>
  );
}

export function FactCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Open the stylist CONFIRMED line. Before any schedule change, every
        CONFIRMED hour and rate is checked against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {STYLIST_FACT_CHECK.confirmed}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
      >
        Check facts against the export row
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label="Fact check for stylist"
            columns={["Field", "In the CONFIRMED line", "In the export row", "Result"]}
            rows={STYLIST_FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.exportValue,
              <span
                key="result"
                className="font-semibold text-emerald-800 dark:text-emerald-300"
              >
                Matches
              </span>,
            ])}
          />
        ) : null}
      </div>
    </div>
  );
}

export function InterpretationStep() {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION_TEXT}
      </p>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p className="font-semibold">POST-PAY VARIANCE (fictional)</p>
        <p>
          <FactLabel kind="OWNER-ENTERED" />
          actual_payroll_total: 4960.
        </p>
        <p>
          <FactLabel kind="CALCULATED" />
          projected loaded payroll 4814.40; variance =4960-4814.40 = 145.60.
        </p>
        <p>{RECHECK_SENTENCE}</p>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="RECOMMENDED ACTION" />
        review stylist overtime on the next schedule in your own tool, keeping
        any minimum coverage you set.
      </p>
    </div>
  );
}

export function YouEditStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_EDIT_SCHEDULE}</p>
      <p className="text-sm leading-relaxed text-foreground">{DO_NOT_CUT_COVERAGE}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You edit shifts in your own scheduling tool, or you decide not to.
        </li>
        <li>
          Nothing is sent, edited, cancelled, or paid automatically. The kit
          changes nothing.
        </li>
        <li>You wait for the pay run and re-check, or you change nothing.</li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to a scheduling tool, time clock, POS, or payroll
        provider. The prompts, worksheet, and checklists are in the Premium kit.
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
