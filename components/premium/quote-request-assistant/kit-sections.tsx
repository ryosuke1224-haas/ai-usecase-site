import type { ReactNode } from "react";
import {
  SAMPLE_REQUESTS_TEXT,
  TRACKER_CELLS,
  TRACKER_COLUMNS,
  TRACKER_CSV,
} from "@/src/lib/premium/quote-request-assistant/demo-data";
import {
  FIT_REVIEW_PROMPT,
  kitSectionTitle,
  PLAN_DIFFERENCE_NOTICE,
  SAFETY_RULES,
  SCOPE_EXTRACTION_PROMPT,
  SESSION_ONLY_NOTICE,
  SETUP_STEPS,
  type KitSectionId,
} from "@/src/lib/premium/quote-request-assistant/kit-content";
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
        Requests before you use a real request.
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

export function ExtractionPromptSection() {
  return (
    <PromptSection
      id="extraction-prompt"
      intro="Paste this prompt with your rules block, then paste one request as text. It extracts only stated fields, keeps approximate wording, and labels CONFIRMED separately from AI INTERPRETATION."
      prompt={SCOPE_EXTRACTION_PROMPT}
    />
  );
}

export function FitReviewPromptSection() {
  return (
    <PromptSection
      id="fit-review-prompt"
      intro="Paste this after extraction. It applies your written qualification rules before any FIT label and refuses to auto-reject work that is close to the catalog."
      prompt={FIT_REVIEW_PROMPT}
    />
  );
}

export function RulesWorksheetSection() {
  return (
    <KitSection id="rules-worksheet">
      <p className={BODY}>
        Write the service area, minimum project size, services offered,
        out-of-scope work, and internal notes that must never appear in a draft.
        Then generate a rules block to paste with the prompts. Nothing you enter
        here is saved to Atlas.
      </p>
      <RulesWorksheet />
    </KitSection>
  );
}

export function TrackerTemplateSection() {
  return (
    <KitSection id="tracker-template">
      <p className={BODY}>
        Column layout with the fictional QR-1001 row from the guided demo.
        Allowed fit values are YES, NO, and NEEDS YOUR CHECK. Allowed status
        values are needs pricing, waiting on answers, declined, quoted, and
        sent. Copy CSV so you can start your own spreadsheet.
      </p>
      <DataTable
        label="Quote tracker template"
        columns={TRACKER_COLUMNS}
        monospaceHeader
        rows={[TRACKER_CELLS]}
      />
      <CopyButton text={TRACKER_CSV} label="Copy CSV" />
    </KitSection>
  );
}

export function ActionReviewChecklistSection() {
  return (
    <KitSection id="action-review-checklist">
      <p className={BODY}>
        Use this before you contact the requester. Progress stays in this
        browser session only.
      </p>
      <ActionReviewChecklist />
    </KitSection>
  );
}

export function SampleRequestsSection() {
  return (
    <KitSection id="sample-request">
      <p className="inline-flex items-center rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
        Fictional
      </p>
      <p className={BODY}>
        The same invented Jordan Hale deck request used in the guided demo, plus
        a second invented roofing request in Mesa labelled FIT NO. Paste them
        into your AI tool with the prompts to practice before you use a real
        request.
      </p>
      <pre className={PRE_BLOCK}>{SAMPLE_REQUESTS_TEXT}</pre>
      <CopyButton text={SAMPLE_REQUESTS_TEXT} label="Copy text" />
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
