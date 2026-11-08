import type { ReactNode } from "react";
import {
  CONTACT_LOG_COLUMNS,
  CONTACT_LOG_CSV,
  CONTACT_LOG_ROWS,
  contactLogCells,
  SAMPLE_CUSTOMERS_CSV,
} from "@/src/lib/premium/inactive-customer-winback/demo-data";
import {
  DRAFT_PROMPT,
  kitSectionTitle,
  PLAN_DIFFERENCE_NOTICE,
  RETURN_CHECK_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  SKIP_RULES_PROMPT,
  type KitSectionId,
} from "@/src/lib/premium/inactive-customer-winback/kit-content";
import { ActionReviewChecklist } from "./action-review-checklist";
import { CopyButton } from "./copy-button";
import { DataTable } from "./data-table";
import { RulesWorksheet } from "./rules-worksheet";
import { PRE_BLOCK } from "./styles";

const BODY = "text-sm leading-relaxed text-muted";

function KitSection({ id, children }: { id: KitSectionId; children: ReactNode }) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="min-w-0 scroll-mt-20 rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
    >
      <h2 id={headingId} className="text-xl font-bold tracking-tight text-foreground">
        {kitSectionTitle(id)}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function PlanNotice() {
  return (
    <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
      {PLAN_DIFFERENCE_NOTICE}
    </p>
  );
}

export function SetupChecklistSection() {
  return (
    <KitSection id="setup-checklist">
      <p className={BODY}>
        Run these steps for one cycle. Practice first with the Fictional Sample
        Customer Export before you use a real customer list.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {SETUP_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <PlanNotice />
    </KitSection>
  );
}

function PromptSection({
  id,
  intro,
  prompt,
}: {
  id: KitSectionId;
  intro: string;
  prompt: string;
}) {
  return (
    <KitSection id={id}>
      <p className={BODY}>{intro}</p>
      <pre className={PRE_BLOCK}>{prompt}</pre>
      <CopyButton text={prompt} label="Copy Prompt" />
    </KitSection>
  );
}

export function SkipRulesPromptSection() {
  return (
    <PromptSection
      id="skip-rules-prompt"
      intro="Paste this prompt with your rules block, then paste the customer rows and contact-log names. It runs SKIP RULES FIRST, lists every skip with its reason, and labels CONFIRMED separately from AI INTERPRETATION."
      prompt={SKIP_RULES_PROMPT}
    />
  );
}

export function DraftPromptSection() {
  return (
    <PromptSection
      id="draft-prompt"
      intro="Paste this only after skip rules run. It segments VIP vs occasional, ranks VIP first, and drafts from last service, last visit, and the written offer list only."
      prompt={DRAFT_PROMPT}
    />
  );
}

export function ReturnCheckPromptSection() {
  return (
    <PromptSection
      id="return-check-prompt"
      intro="Paste this after a later POS export. It marks returned vs still lapsed and warns that a return is not proof the message caused it."
      prompt={RETURN_CHECK_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set the lapse threshold date, VIP visit floor, whether to skip one-time
        buyers, and the written offer list. Then generate a rules block to paste
        with the prompts. {SESSION_ONLY_NOTICE}
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function ContactLogTemplateSection() {
  return (
    <KitSection id="contact-log-template">
      <p className={BODY}>
        Column layout with the fictional J. Rivera drafted_not_sent and returned
        rows from the guided demo. Allowed action values are skipped_no_consent,
        skipped_dnc, skipped_recent, skipped_one_time, skipped_already_contacted,
        drafted_not_sent, sent_by_owner, and not_sent. Allowed outcome values are
        returned, still_lapsed, and unknown. Copy CSV so you can start your own
        spreadsheet.
      </p>
      <DataTable
        label="Contact log template"
        columns={CONTACT_LOG_COLUMNS}
        monospaceHeader
        rows={CONTACT_LOG_ROWS.map((row) => contactLogCells(row))}
      />
      <CopyButton text={CONTACT_LOG_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you contact anyone. Progress stays in this browser
        session only.
      </p>
      <ActionReviewChecklist />
    </KitSection>
  );
}

export function SampleCustomersSection() {
  return (
    <KitSection id="sample-customers">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented eight-row salon customer export used in the guided
        demo. Paste the CSV into your AI tool with the prompts to practice before
        you use a real customer export. Copy CSV writes the customer rows only.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_CUSTOMERS_CSV}</pre>
      <CopyButton text={SAMPLE_CUSTOMERS_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function SafetyGuidanceSection() {
  return (
    <KitSection id="safety-guidance">
      <PlanNotice />
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
        {SAFETY_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
        <li>{SESSION_ONLY_NOTICE}</li>
      </ul>
    </KitSection>
  );
}
