import type { Metadata } from "next";
import Link from "next/link";
import {
  DraftReviewChecklistSection,
  NextWeekPromptSection,
  OutcomeLogTemplateSection,
  QueuePromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleAgingReportSection,
  SetupChecklistSection,
} from "@/components/premium/ai-collections-assistant/kit-sections";
import { FOCUS_RING } from "@/components/premium/ai-collections-assistant/styles";
import { requireUser } from "@/src/lib/auth";
import { COLLECTIONS_DEMO_PATH } from "@/src/lib/premium/ai-collections-assistant/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/ai-collections-assistant/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Collections Assistant Premium Kit",
  description:
    "Prompts, worksheet, outcome log template, and review checklist for the AI Collections Assistant weekly queue.",
  alternates: { canonical: "/blueprints/ai-collections-assistant/kit" },
  robots: { index: false, follow: false },
};

export default async function AiCollectionsAssistantKitPage() {
  await requireUser("/blueprints/ai-collections-assistant/kit");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        AI Collections Assistant Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for the weekly collections queue in
        ChatGPT, Claude, or Gemini. AI prepares the queue and the drafts. You
        check every number, choose every recipient, and send from your own email.
        Nothing is sent automatically.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
        {PLAN_DIFFERENCE_NOTICE}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground">
        {SESSION_ONLY_NOTICE}
      </p>

      <nav
        aria-label="Kit contents"
        className="mt-8 rounded-2xl border border-border/60 bg-surface p-4 sm:p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          In this kit
        </h2>
        <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {KIT_SECTIONS.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`inline-block rounded text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-6">
        <SetupChecklistSection />
        <QueuePromptSection />
        <NextWeekPromptSection />
        <RulesWorksheetSection />
        <OutcomeLogTemplateSection />
        <DraftReviewChecklistSection />
        <SampleAgingReportSection />
        <SafetyGuidanceSection />
      </div>

      <Link
        href={COLLECTIONS_DEMO_PATH}
        className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
      >
        Back to the guided demo
      </Link>
    </div>
  );
}
