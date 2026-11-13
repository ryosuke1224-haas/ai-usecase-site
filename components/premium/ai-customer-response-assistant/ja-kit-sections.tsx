import type { ReactNode } from "react";
import { replyCopy } from "@/src/lib/premium/ai-customer-response-assistant/copy";
import type { ReplySectionId } from "@/src/lib/premium/ai-customer-response-assistant/copy-types";
import {
  CONSISTENCY_LOG_COLUMNS,
  CONSISTENCY_LOG_CSV,
  CONSISTENCY_LOG_ROWS,
  consistencyLogCells,
  SAMPLE_MESSAGES_TEXT,
} from "@/src/lib/premium/ai-customer-response-assistant/demo-data";
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
  id: ReplySectionId;
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
  const copy = replyCopy("ja");
  const section = (id: ReplySectionId) => copy.sections.find((item) => item.id === id);

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
      <Section id="escalate-prompt" title={section("escalate-prompt")?.title ?? "escalate-prompt"}>
        <p className={BODY}>{copy.escalatePromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.escalatePrompt}</pre>
        <CopyButton
          text={copy.escalatePrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="draft-prompt" title={section("draft-prompt")?.title ?? "draft-prompt"}>
        <p className={BODY}>{copy.draftPromptIntro}</p>
        <pre className={PRE_BLOCK}>{copy.draftPrompt}</pre>
        <CopyButton
          text={copy.draftPrompt}
          label={copy.copyPrompt}
          copiedLabel={copy.copied}
          errorLabel={copy.copyFailed}
        />
      </Section>
      <Section id="rules-worksheet" title={section("rules-worksheet")?.title ?? "rules-worksheet"}>
        <p className={BODY}>{section("rules-worksheet")?.intro}</p>
        <RulesWorksheet locale="ja" />
      </Section>
      <Section
        id="reply-log-template"
        title={section("reply-log-template")?.title ?? "reply-log-template"}
      >
        <p className={BODY}>{copy.logIntro}</p>
        <DataTable
          label="週次の一貫性ログ"
          columns={CONSISTENCY_LOG_COLUMNS}
          monospaceHeader
          rows={CONSISTENCY_LOG_ROWS.map((row) => consistencyLogCells(row))}
        />
        <CopyButton
          text={CONSISTENCY_LOG_CSV}
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
      <Section id="sample-messages" title={section("sample-messages")?.title ?? "sample-messages"}>
        <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
          {copy.fictionalBadge}
        </p>
        <p className={BODY}>{copy.sampleIntro}</p>
        <pre className={PRE_BLOCK}>{SAMPLE_MESSAGES_TEXT}</pre>
        <CopyButton
          text={SAMPLE_MESSAGES_TEXT}
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
