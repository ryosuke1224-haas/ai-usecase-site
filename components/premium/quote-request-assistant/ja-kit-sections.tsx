import type { ReactNode } from "react";
import { quoteCopy } from "@/src/lib/premium/quote-request-assistant/copy";
import type { QuoteSectionId } from "@/src/lib/premium/quote-request-assistant/copy-types";
import {
  SAMPLE_REQUESTS_TEXT,
  TRACKER_CELLS,
  TRACKER_COLUMNS,
  TRACKER_CSV,
} from "@/src/lib/premium/quote-request-assistant/demo-data";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function Section({
  id,
  title,
  children,
}: {
  id: QuoteSectionId;
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
  const copy = quoteCopy("ja");
  const section = (id: QuoteSectionId) => copy.sections.find((item) => item.id === id);

  return (
    <>
      <Section id="setup-checklist" title={section("setup-checklist")?.title ?? "setup-checklist"}>
        <p className={BODY}>{section("setup-checklist")?.intro}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          {copy.planDifferenceNotice}
        </p>
      </Section>
      <Section id="extraction-prompt" title={section("extraction-prompt")?.title ?? "extraction-prompt"}>
        <p className={BODY}>{copy.extractionPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.extractionPrompt}</pre>
        <CopyButton
          text={copy.extractionPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="fit-review-prompt" title={section("fit-review-prompt")?.title ?? "fit-review-prompt"}>
        <p className={BODY}>{copy.fitPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.fitPrompt}</pre>
        <CopyButton
          text={copy.fitPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section id="tracker-template" title={section("tracker-template")?.title ?? "tracker-template"}>
        <p className={BODY}>{copy.trackerIntro}</p>
        <DataTable
          label="見積トラッカーのひな形"
          columns={TRACKER_COLUMNS}
          monospaceHeader
          rows={[TRACKER_CELLS]}
        />
        <CopyButton
          text={TRACKER_CSV}
          label={copy.copyCsv}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section
        id="action-review-checklist"
        title={section("action-review-checklist")?.title ?? "action-review-checklist"}
      >
        <p className={BODY}>{copy.checklistIntro}</p>
        <ActionReviewChecklist
          items={copy.reviewItems}
          checkedLabel={copy.checkedLabel}
          resetLabel={copy.resetChecklist}
          completeLabel={copy.reviewComplete}
        />
      </Section>
      <Section id="sample-request" title={section("sample-request")?.title ?? "sample-request"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <pre className={PRE_BLOCK}>{SAMPLE_REQUESTS_TEXT}</pre>
        <CopyButton
          text={SAMPLE_REQUESTS_TEXT}
          label={copy.copyText}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="safety-guidance" title={section("safety-guidance")?.title ?? "safety-guidance"}>
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          {copy.planDifferenceNotice}
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {copy.safetyRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
          <li>{copy.sessionOnlyNotice}</li>
        </ul>
      </Section>
    </>
  );
}
