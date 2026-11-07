import type { ReactNode } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import type { NoShowSectionId } from "@/src/lib/premium/no-show-recovery-assistant/copy-types";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function KitSection({ id, title, children }: { id: NoShowSectionId; title: string; children: ReactNode }) {
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

function csvTable(csv: string): { columns: string[]; rows: string[][] } {
  const lines = csv.split("\n").filter((line) => line.length > 0);
  const [header, ...rows] = lines;
  return {
    columns: (header ?? "").split(","),
    rows: rows.map((line) => line.split(",")),
  };
}

function PlanNotice({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
      {text}
    </p>
  );
}

export function SetupChecklistSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections[0];
  return (
    <KitSection id="setup-checklist" title={section.title}>
      <p className={BODY}>{section.intro}</p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {copy.setupSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <PlanNotice text={copy.planDifferenceNotice} />
    </KitSection>
  );
}

function PromptSection({
  id,
  locale,
}: {
  id: "attendance-prompt" | "rebooking-draft-prompt";
  locale: UiLocale;
}) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === id);
  const prompt = id === "attendance-prompt" ? copy.attendancePrompt : copy.rebookingDraftPrompt;
  return (
    <KitSection id={id} title={section?.title ?? id}>
      <p className={BODY}>{section?.intro}</p>
      <pre className={PRE_BLOCK}>{prompt}</pre>
      <CopyButton text={prompt} label={copy.copyPrompt} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
    </KitSection>
  );
}

export function AttendancePromptSection({ locale }: { locale: UiLocale }) {
  return <PromptSection id="attendance-prompt" locale={locale} />;
}

export function RebookingDraftPromptSection({ locale }: { locale: UiLocale }) {
  return <PromptSection id="rebooking-draft-prompt" locale={locale} />;
}

export function RulesWorksheetSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === "rules-worksheet");
  return (
    <KitSection id="rules-worksheet" title={section?.title ?? "rules-worksheet"}>
      <p className={BODY}>{section?.intro}</p>
      <RulesWorksheet locale={locale} />
    </KitSection>
  );
}

export function RecoveryLogTemplateSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === "recovery-log-template");
  const table = csvTable(copy.recoveryLogCsv);
  return (
    <KitSection id="recovery-log-template" title={section?.title ?? "recovery-log-template"}>
      <p className={BODY}>{section?.intro}</p>
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{copy.allowedOutcomesLabel}</h3>
        <ul aria-label={copy.allowedOutcomesLabel} className="mt-2 flex flex-wrap gap-2">
          {copy.allowedOutcomes.map((outcome) => (
            <li
              key={outcome}
              className="rounded-md border border-border/60 bg-surface px-2 py-0.5 font-mono text-xs text-foreground"
            >
              {outcome}
            </li>
          ))}
        </ul>
      </div>
      <p className={`text-xs font-semibold text-muted ${locale === "ja" ? "" : "uppercase tracking-wider"}`}>
        {copy.fictionalExample}
      </p>
      <DataTable label={copy.logTableLabel} columns={table.columns} monospaceHeader rows={table.rows} />
      <CopyButton text={copy.recoveryLogCsv} label={copy.copyCsv} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
    </KitSection>
  );
}

export function ActionReviewChecklistSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === "action-review-checklist");
  return (
    <KitSection id="action-review-checklist" title={section?.title ?? "action-review-checklist"}>
      <p className={BODY}>{section?.intro}</p>
      <ActionReviewChecklist locale={locale} />
    </KitSection>
  );
}

export function SampleBookingsSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === "sample-bookings");
  const [bookingsCsv, slotsCsv] = copy.sampleBookingsCsv.split("\n\n");
  const bookings = csvTable(bookingsCsv ?? "");
  const slots = csvTable(slotsCsv ?? "");
  return (
    <KitSection id="sample-bookings" title={section?.title ?? "sample-bookings"}>
      <p
        className={`inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200 ${locale === "ja" ? "" : "uppercase tracking-wider"}`}
      >
        {copy.fictionalBadge}
      </p>
      <p className={BODY}>{section?.intro}</p>
      <DataTable label={copy.sampleTableLabel} columns={bookings.columns} monospaceHeader rows={bookings.rows} />
      {slots.rows.length > 0 ? (
        <DataTable label={copy.demo.openSlotsLabel} columns={slots.columns} monospaceHeader rows={slots.rows} />
      ) : null}
      <CopyButton
        text={copy.sampleBookingsCsv}
        label={copy.copyCsv}
        copiedLabel={copy.copied}
        errorLabel={copy.copyFailed}
      />
    </KitSection>
  );
}

export function SafetyGuidanceSection({ locale }: { locale: UiLocale }) {
  const copy = noShowCopy(locale);
  const section = copy.sections.find((item) => item.id === "safety-guidance");
  return (
    <KitSection id="safety-guidance" title={section?.title ?? "safety-guidance"}>
      <p className={BODY}>{section?.intro}</p>
      <PlanNotice text={copy.planDifferenceNotice} />
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {copy.safetyRules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
    </KitSection>
  );
}
