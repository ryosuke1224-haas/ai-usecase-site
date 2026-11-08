"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  CHECK_LOCAL_RULES,
  DO_NOT_CUT_MINIMUM,
  HOURLY_COLUMNS,
  HOURLY_ROWS,
  hourlyCells,
  KIT_PATH,
  MINIMUM_STAFF,
  PROTECTED_ROLE,
  RECHECK_SENTENCE,
  RECOMMENDED_SAT,
  RECOMMENDED_TUE,
  SAT_CONFIRMED,
  TARGET_RANGE,
  TUE_CONFIRMED,
  TUE_FACT_CHECK,
  YOU_EDIT_SCHEDULE,
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

export function ExportsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        This table is invented. No live POS, scheduling, or time-clock account
        is attached. Atlas does not connect, upload, or edit anything.
      </p>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p>
          Owner rules shown with the export:{" "}
          <span className="font-semibold">minimum 2</span> on floor; target{" "}
          <span className="font-semibold">{TARGET_RANGE}</span>; flag only if
          outside target in 3+ of 4 weeks.
        </p>
        <p>Protected role: {PROTECTED_ROLE}.</p>
      </div>
      <div>
        <h3 className={SUBHEADING}>Fictional hourly export (invented)</h3>
        <div className="mt-2">
          <DataTable
            label="Fictional hourly export"
            columns={["day-hour", ...HOURLY_COLUMNS.slice(2)]}
            monospaceHeader
            rows={HOURLY_ROWS.map((row) => [
              `${row.day} ${row.hour}`,
              ...hourlyCells(row).slice(2),
            ])}
          />
        </div>
      </div>
    </div>
  );
}

export function OwnerRulesStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Write OWNER RULES FIRST and finish the arithmetic before any schedule
        change suggestion. A single week outside the target is not enough to
        flag.
      </p>
      <ul aria-label="Owner-entered staffing rules" className="space-y-3">
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" />
          minimum <span className="font-semibold">{MINIMUM_STAFF}</span> on
          floor.
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" />
          target <span className="font-semibold">{TARGET_RANGE}</span>{" "}
          transactions per staff-hour.
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          <FactLabel kind="OWNER-ENTERED" />
          protected role {PROTECTED_ROLE}; quiet hours may include prep.
        </li>
        <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
          Flag only when outside target in 3 or more of 4 weeks. A single week
          outside the target is not enough to flag.
        </li>
      </ul>
    </div>
  );
}

export function FlagsStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        Over and under flags use visible text and an icon, not color alone.
        Confirmed facts, owner-entered rules, AI interpretation, and recommended
        actions stay labelled as words.
      </p>
      <ul aria-label="Day-by-hour coverage flags" className="space-y-4">
        <li className={`${CARD} space-y-3 text-sm leading-relaxed text-foreground`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Tue 14:00</p>
            <FlagBadge kind="over" icon="▼" label="Overstaffed pattern" />
          </div>
          <p>
            <FactLabel kind="CONFIRMED" />
            {TUE_CONFIRMED}
          </p>
        </li>
        <li className={`${CARD} space-y-3 text-sm leading-relaxed text-foreground`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">Sat 12:00</p>
            <FlagBadge kind="under" icon="▲" label="Understaffed pattern" />
          </div>
          <p>
            <FactLabel kind="CONFIRMED" />
            {SAT_CONFIRMED}
          </p>
        </li>
      </ul>
      <ul
        aria-label="How labels are used"
        className="space-y-2 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Calculated from the exports.
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" />
          Minimum, target range, pattern rule, protected roles.
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
        Open the CONFIRMED line for Tuesday afternoon. Before any schedule
        change, every CONFIRMED figure is checked against the export row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {TUE_FACT_CHECK.confirmed}
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
            label="Fact check for Tue 14:00"
            columns={[
              "Week",
              "CONFIRMED tx",
              "Export tx",
              "CONFIRMED staff",
              "Export staff",
              "Result",
            ]}
            rows={TUE_FACT_CHECK.rows.map((row) => [
              row.week,
              row.confirmedTx,
              row.exportTx,
              row.confirmedStaff,
              row.exportStaff,
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
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="AI INTERPRETATION" />
        {AI_INTERPRETATION_TEXT}
      </p>
    </div>
  );
}

export function RecommendationStep() {
  return (
    <div className="space-y-5">
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p>
          <FactLabel kind="RECOMMENDED ACTION" />
          {RECOMMENDED_TUE}
        </p>
        <p>
          <FactLabel kind="RECOMMENDED ACTION" />
          {RECOMMENDED_SAT}
        </p>
        <p>{CHECK_LOCAL_RULES}</p>
      </div>
      <div className={`${CARD} space-y-2 text-sm leading-relaxed text-foreground`}>
        <p className="font-semibold">FOUR-WEEK RE-CHECK (fictional)</p>
        <p>
          <FactLabel kind="CONFIRMED" />
          Tue 14:00 with 2 staff =12/2=6.0, =11/2=5.5, =13/2=6.5, =12/2=6.0;
          still below target in 4 of 4 weeks — keep reviewing non-sales work
          before cutting further.
        </p>
        <p>
          <FactLabel kind="CONFIRMED" />
          Sat 12:00 with 4 staff =90/4=22.5, =82/4=20.5, =88/4=22.0, =92/4=23.0;
          inside 15-25 in 4 of 4 weeks.
        </p>
        <p>{RECHECK_SENTENCE}</p>
      </div>
    </div>
  );
}

export function YouEditStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_EDIT_SCHEDULE}</p>
      <p className="text-sm leading-relaxed text-foreground">{DO_NOT_CUT_MINIMUM}</p>
      <p className="text-sm leading-relaxed text-foreground">{CHECK_LOCAL_RULES}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You edit shifts in your own scheduling tool, or you decide not to.
        </li>
        <li>
          Nothing is sent, edited, cancelled, or paid automatically. The kit
          changes nothing.
        </li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to a POS, scheduling tool, or time clock. The
        prompts, worksheet, and checklists are in the Premium kit.
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
