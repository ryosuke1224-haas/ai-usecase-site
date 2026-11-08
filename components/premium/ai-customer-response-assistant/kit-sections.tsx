import type { ReactNode } from "react";
import {
  CONSISTENCY_LOG_COLUMNS,
  CONSISTENCY_LOG_CSV,
  CONSISTENCY_LOG_ROWS,
  consistencyLogCells,
  SAMPLE_MESSAGES_TEXT,
} from "@/src/lib/premium/ai-customer-response-assistant/demo-data";
import {
  DRAFT_PROMPT,
  ESCALATE_PROMPT,
  kitSectionTitle,
  PLAN_DIFFERENCE_NOTICE,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/ai-customer-response-assistant/kit-content";
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
        Run these steps for one review. Practice first with the Fictional Sample
        Messages before you use a real message.
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

export function EscalatePromptSection() {
  return (
    <PromptSection
      id="escalate-prompt"
      intro="Paste this prompt with your rules block, then paste one inbound message as text. It runs ESCALATE RULES FIRST, writes an INTERNAL NOTE and STOP on a match, forbids a customer-facing reply about money or harm, and labels CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION separately. Do not invent. Do not send."
      prompt={ESCALATE_PROMPT}
    />
  );
}

export function DraftPromptSection() {
  return (
    <PromptSection
      id="draft-prompt"
      intro="Paste this only after escalate rules run. It answers only with pasted FAQ facts, writes NEEDS YOUR CHECK when the FAQ does not cover the question, and may add a PARTIAL DRAFT for a covered question on a mixed message. Never promise a refund. You send it. Nothing is sent automatically."
      prompt={DRAFT_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Write tone rules, FAQ facts (one per line), and an escalate list (one
        per line). Then generate a rules block to paste with the prompts.
        Nothing you enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function ReplyLogTemplateSection() {
  return (
    <KitSection id="reply-log-template">
      <p className={BODY}>
        Column layout with the fictional R. Cole escalated row from the guided
        demo. Allowed action values are escalated, drafted_not_sent,
        sent_by_owner, and held. Allowed outcome values are owner_handled, sent,
        not_sent, and held. Copy CSV so you can start your own spreadsheet.
      </p>
      <DataTable
        label="Weekly consistency log"
        columns={CONSISTENCY_LOG_COLUMNS}
        monospaceHeader
        rows={CONSISTENCY_LOG_ROWS.map((row) => consistencyLogCells(row))}
      />
      <CopyButton text={CONSISTENCY_LOG_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you contact the customer. Progress stays in this
        browser session only.
      </p>
      <ActionReviewChecklist />
    </KitSection>
  );
}

export function SampleMessagesSection() {
  return (
    <KitSection id="sample-messages">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented R. Cole mixed message used in the guided demo, plus a
        second invented how-to-only message from A. Nguyen about color-visit
        length and a cancellation. Paste them into your AI tool with the
        prompts to practice before you use a real message.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_MESSAGES_TEXT}</pre>
      <CopyButton text={SAMPLE_MESSAGES_TEXT} label="Copy text" />
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
