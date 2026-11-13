import type { ReactNode } from "react";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import type { NoShowSectionId } from "@/src/lib/premium/no-show-recovery-assistant/copy-types";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function csvTable(csv: string): { columns: string[]; rows: string[][] } {
  const lines = csv.split(/\r?\n/).filter((line) => line.length > 0);
  const [header, ...rows] = lines;
  return {
    columns: header ? header.split(",") : [],
    rows: rows.map((line) => line.split(",")),
  };
}

function Section({
  id,
  title,
  children,
}: {
  id: NoShowSectionId;
  title: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-20 rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Japanese kit body. Canonical English sections stay untouched. */
export function JapaneseKitSections() {
  const copy = noShowCopy("ja");
  const section = (id: NoShowSectionId) => copy.sections.find((item) => item.id === id);
  const [bookingsCsv, slotsCsv] = copy.sampleBookingsCsv.split("\n\n");
  const bookings = csvTable(bookingsCsv ?? "");
  const slots = csvTable(slotsCsv ?? "");
  const log = csvTable(copy.recoveryLogCsv);

  return (
    <>
      <Section id="setup-checklist" title={section("setup-checklist")?.title ?? "setup-checklist"}>
        <p className={BODY}>{section("setup-checklist")?.intro}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={BODY}>{copy.planDifferenceNotice}</p>
      </Section>
      <Section id="attendance-prompt" title={section("attendance-prompt")?.title ?? "attendance-prompt"}>
        <p className={BODY}>{section("attendance-prompt")?.intro}</p>
        <pre className={PRE_BLOCK}>{copy.attendancePrompt}</pre>
        <CopyButton
          text={copy.attendancePrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rebooking-draft-prompt" title={section("rebooking-draft-prompt")?.title ?? "rebooking-draft-prompt"}>
        <p className={BODY}>{section("rebooking-draft-prompt")?.intro}</p>
        <pre className={PRE_BLOCK}>{copy.rebookingDraftPrompt}</pre>
        <CopyButton
          text={copy.rebookingDraftPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section id="recovery-log-template" title={section("recovery-log-template")?.title ?? "recovery-log-template"}>
        <p className={BODY}>{section("recovery-log-template")?.intro}</p>
        <DataTable label={copy.logTableLabel} columns={log.columns} monospaceHeader rows={log.rows} />
        <CopyButton text={copy.recoveryLogCsv} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
      </Section>
      <Section id="action-review-checklist" title={section("action-review-checklist")?.title ?? "action-review-checklist"}>
        <p className={BODY}>{section("action-review-checklist")?.intro}</p>
        <ActionReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section id="sample-bookings" title={section("sample-bookings")?.title ?? "sample-bookings"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{section("sample-bookings")?.intro}</p>
        <DataTable label={copy.sampleTableLabel} columns={bookings.columns} monospaceHeader rows={bookings.rows} />
        {slots.rows.length > 0 ? (
          <DataTable label={copy.demo.openSlotsLabel} columns={slots.columns} monospaceHeader rows={slots.rows} />
        ) : null}
        <CopyButton text={copy.sampleBookingsCsv} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
      </Section>
      <Section id="safety-guidance" title={section("safety-guidance")?.title ?? "safety-guidance"}>
        <p className={BODY}>{section("safety-guidance")?.intro}</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.safetyRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Section>
    </>
  );
}
