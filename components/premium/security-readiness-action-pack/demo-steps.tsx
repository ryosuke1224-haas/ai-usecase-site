"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  AI_INTERPRETATION_TEXT,
  AS_OF_DATE,
  DOES_NOT_CERTIFY,
  INVENTORY_COLUMNS,
  KIT_PATH,
  NEXT_QUARTER_AS_OF_DATE,
  NEXT_QUARTER_CLOSED,
  NEXT_QUARTER_QUEUE,
  NEXT_QUARTER_SKIPPED,
  PAYROLL_FACT_CHECK,
  RANKED_QUEUE,
  RECOMMENDED_ACTION_TEXT,
  SAMPLE_CLOSURE_LOG,
  SAMPLE_INVENTORY_ROWS,
  SEVERITY_LADDER,
  SKIP_RULES,
  SKIPPED_ACCOUNTS,
  YOU_CHANGE_IT,
} from "@/src/lib/premium/security-readiness-action-pack/demo-data";
import { DataTable } from "./data-table";
import { FactLabel } from "./fact-label";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";

const SUBHEADING = "text-sm font-semibold tracking-tight text-foreground";
const BODY = "text-sm leading-relaxed text-muted";
const CARD = "rounded-xl border border-border/60 bg-card p-4";

export function InventoryStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The owner typed four business accounts into an inventory worksheet. This
        table is invented. No live system is attached. Atlas does not scan,
        connect, or certify anything.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            As-of date
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">
            {AS_OF_DATE} (fictional)
          </dd>
        </div>
        <div className={CARD}>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Default severity ladder
          </dt>
          <dd className="mt-1">
            <ul className="space-y-0.5 text-sm text-foreground">
              {SEVERITY_LADDER.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        Invented inventory
      </p>
      <DataTable
        label="Fictional account inventory"
        columns={INVENTORY_COLUMNS}
        monospaceHeader
        rows={SAMPLE_INVENTORY_ROWS.map((row) => [
          row.account,
          row.namedOwner,
          row.stillWithCompany,
          row.mfa,
          row.lastRestoreTest,
          row.sharedLogin,
          row.holdsCustomerOrMoneyData,
        ])}
      />
    </div>
  );
}

export function SkipRulesStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        AI applies the skip rules before it ranks anything. Skipped accounts are
        never given a HIGH or MEDIUM label, and each one is listed with its
        reason.
      </p>
      <div>
        <h3 className={SUBHEADING}>The three skip rules</h3>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
          {SKIP_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className={SUBHEADING}>Set aside this quarter ({SKIPPED_ACCOUNTS.length})</h3>
        <ul aria-label="Skipped accounts" className="mt-2 space-y-2">
          {SKIPPED_ACCOUNTS.map((item) => (
            <li key={item.account} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              <FactLabel kind="SKIPPED" />
              <span className="font-semibold">{item.account}</span>: {item.reason}.
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm leading-relaxed text-foreground">
        <FactLabel kind="YOU DECIDE" />
        Which accounts are personal-only or out of scope, and whether to override
        a skip.
      </p>
    </div>
  );
}

export function RankedQueueStep() {
  return (
    <div className="space-y-5">
      <p className={BODY}>
        The three remaining accounts are ranked HIGH first. Confirmed fields come
        from the inventory. Suggested actions are for you to take in the real
        product. {DOES_NOT_CERTIFY}
      </p>
      <ol aria-label="Readiness queue" className="space-y-3">
        {RANKED_QUEUE.map((item, index) => (
          <li key={item.account} className={`${CARD} space-y-1.5 text-sm leading-relaxed`}>
            <p className="font-semibold text-foreground">
              {index + 1}. {item.account} — {item.namedOwner}
            </p>
            <p className="text-foreground">
              <FactLabel kind="CONFIRMED" />
              {item.confirmed}
            </p>
            <p className="text-foreground">Severity: {item.severity}</p>
            <p className="text-muted">{item.action}</p>
          </li>
        ))}
      </ol>
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

export function FactCheckStep() {
  const [revealed, setRevealed] = useState(false);
  const checkId = useId();

  return (
    <div className="space-y-5">
      <p className={BODY}>
        Open the {PAYROLL_FACT_CHECK.account} row. Before anything is changed in
        a real product, every CONFIRMED field is checked against the inventory
        row.
      </p>
      <blockquote className={`${CARD} border-l-4 border-l-accent`}>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="CONFIRMED" />
          {PAYROLL_FACT_CHECK.confirmed}
        </p>
      </blockquote>
      <button
        type="button"
        className={SECONDARY_BUTTON}
        aria-expanded={revealed}
        aria-controls={checkId}
        onClick={() => setRevealed((current) => !current)}
      >
        Check facts against the inventory row
      </button>
      <div id={checkId} hidden={!revealed}>
        {revealed ? (
          <DataTable
            label={`Fact check for ${PAYROLL_FACT_CHECK.account}`}
            columns={["Field", "In the CONFIRMED line", "In the inventory row", "Result"]}
            rows={PAYROLL_FACT_CHECK.rows.map((row) => [
              row.field,
              row.confirmed,
              row.inventory,
              <span key="result" className="font-semibold text-emerald-800 dark:text-emerald-300">
                Matches
              </span>,
            ])}
          />
        ) : null}
      </div>
      <p className={BODY}>
        Do this for every ranked row. The Action Review Checklist in the kit also
        covers skip reasons, the five-action cap, and who will do each change.
      </p>
    </div>
  );
}

export function NextQuarterStep() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className={SUBHEADING}>
          Closure log after quarter of {AS_OF_DATE} (fictional, entered by the
          owner)
        </h3>
        <DataTable
          label={`Fictional closure log for the quarter of ${AS_OF_DATE}`}
          columns={["account", "named_owner", "action_taken", "outcome", "check_date", "notes"]}
          monospaceHeader
          rows={SAMPLE_CLOSURE_LOG.map((row) => [
            row.account,
            row.namedOwner,
            row.actionTaken,
            row.outcome,
            row.checkDate,
            row.notes,
          ])}
        />
      </div>
      <div className="space-y-3">
        <h3 className={SUBHEADING}>Mock run as of {NEXT_QUARTER_AS_OF_DATE}</h3>
        <p className={BODY}>
          Next quarter&apos;s run reads the closure log with the new inventory.
          Closed HIGH items stay in the log. HIGH items still open stay ranked.
        </p>
        <ul aria-label="Next quarter closed accounts" className="space-y-2">
          <li className={`${CARD} text-sm leading-relaxed text-foreground`}>
            <FactLabel kind="CLOSED" />
            {NEXT_QUARTER_CLOSED.account} ({NEXT_QUARTER_CLOSED.detail}).
          </li>
        </ul>
        <ol aria-label="Next quarter queue" className="space-y-2">
          {NEXT_QUARTER_QUEUE.map((item, index) => (
            <li key={item.account} className={`${CARD} text-sm leading-relaxed text-foreground`}>
              {index + 1}. <span className="font-semibold">{item.account}</span>,{" "}
              {item.detail}
            </li>
          ))}
        </ol>
        <ul aria-label="Next quarter skipped accounts" className="space-y-2">
          {NEXT_QUARTER_SKIPPED.map((item) => (
            <li key={item.account} className="text-sm leading-relaxed text-foreground">
              <FactLabel kind="SKIPPED" />
              {item.account} ({item.reason}).
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-foreground">{DOES_NOT_CERTIFY}</p>
        <p className="text-sm leading-relaxed text-foreground">
          <FactLabel kind="YOU DECIDE" />
          Only you record outcomes, and only you change accounts in the real
          product.
        </p>
      </div>
    </div>
  );
}

export function YouChangeItStep() {
  return (
    <div className="space-y-5">
      <p className="text-base font-semibold text-foreground">{YOU_CHANGE_IT}</p>
      <p className="text-sm leading-relaxed text-foreground">{DOES_NOT_CERTIFY}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
        <li>
          You turn on MFA, remove access, test a restore, or replace a shared
          login in the real product.
        </li>
        <li>
          Nothing is scanned, disabled, or changed automatically. The kit
          changes nothing.
        </li>
        <li>
          You record the outcome in your closure log for next quarter&apos;s run.
        </li>
      </ul>
      <p className={BODY}>
        Atlas does not connect to a bank, POS, payroll, Google Workspace, or
        Microsoft 365. The prompts, worksheet, and checklists are in the Premium
        kit.
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
