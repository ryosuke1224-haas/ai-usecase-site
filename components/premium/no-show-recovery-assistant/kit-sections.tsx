import type { ReactNode } from "react";
import {
  OPEN_SLOT_COLUMNS,
  OPEN_SLOTS,
  openSlotCells,
  RECOVERY_LOG_COLUMNS,
  RECOVERY_LOG_CSV,
  RECOVERY_LOG_ROWS,
  recoveryLogCells,
  SAMPLE_BOOKINGS_CSV,
} from "@/src/lib/premium/no-show-recovery-assistant/demo-data";
import {
  ATTENDANCE_PROMPT,
  kitSectionTitle,
  PLAN_DIFFERENCE_NOTICE,
  REBOOKING_DRAFT_PROMPT,
  SAFETY_RULES,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/no-show-recovery-assistant/kit-content";
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
        Booking Export before you use a real booking list.
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

export function AttendancePromptSection() {
  return (
    <PromptSection
      id="attendance-prompt"
      intro="Paste this prompt with your rules block, then paste one day's booking rows and open slots. It runs CONFIRM ATTENDANCE FIRST, drafts only when status = no_show, and labels CONFIRMED separately from AI INTERPRETATION."
      prompt={ATTENDANCE_PROMPT}
    />
  );
}

export function RebookingDraftPromptSection() {
  return (
    <PromptSection
      id="rebooking-draft-prompt"
      intro="Paste this only after attendance is confirmed. It requires sms_consent and matching open slots before any SMS wording, and flags repeat no-shows as FLAG FOR POLICY with no draft."
      prompt={REBOOKING_DRAFT_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Set the repeat no-show threshold including today, list statuses that are
        never a no-show, and list clients to always skip. Then generate a rules
        block to paste with the prompts. Nothing you enter here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function RecoveryLogTemplateSection() {
  return (
    <KitSection id="recovery-log-template">
      <p className={BODY}>
        Column layout with the fictional J. Rivera drafted_not_sent row from the
        guided demo. Allowed action values are skipped_attended, skipped_cancelled,
        skipped_no_consent, flagged_policy, drafted_not_sent, sent_by_owner, and
        not_sent. Allowed outcome values are rebooked, no_reply, policy_hold, and
        left_empty. Copy CSV so you can start your own spreadsheet.
      </p>
      <DataTable
        label="Recovery log template"
        columns={RECOVERY_LOG_COLUMNS}
        monospaceHeader
        rows={RECOVERY_LOG_ROWS.map((row) => recoveryLogCells(row))}
      />
      <CopyButton text={RECOVERY_LOG_CSV} label="Copy CSV" />
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

export function SampleBookingsSection() {
  return (
    <KitSection id="sample-bookings">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented five-row salon day and matching open-slot rows used in
        the guided demo. Paste the booking CSV into your AI tool with the
        prompts to practice before you use a real booking export. Copy CSV
        writes the booking rows only.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_BOOKINGS_CSV}</pre>
      <CopyButton text={SAMPLE_BOOKINGS_CSV} label="Copy CSV" />
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Open slots (invented)
      </h3>
      <DataTable
        label="Sample open slots"
        columns={OPEN_SLOT_COLUMNS}
        monospaceHeader
        rows={OPEN_SLOTS.map((slot) => openSlotCells(slot))}
      />
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
