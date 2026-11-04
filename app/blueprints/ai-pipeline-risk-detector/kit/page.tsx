import type { Metadata } from "next";
import Link from "next/link";
import {
  NextWeekPromptSection,
  OutcomeLogTemplateSection,
  RecoveryReviewChecklistSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleDealExportSection,
  SetupChecklistSection,
  StallQueuePromptSection,
} from "@/components/premium/ai-pipeline-risk-detector/kit-sections";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/ai-pipeline-risk-detector/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH } from "@/src/lib/premium/ai-pipeline-risk-detector/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/ai-pipeline-risk-detector/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stalled Deal Rescue Queue Premium Kit",
  description:
    "Prompts, worksheet, outcome log, and review checklist for the Stalled Deal Rescue Queue workflow.",
  alternates: { canonical: "/blueprints/ai-pipeline-risk-detector/kit" },
  robots: { index: false, follow: false },
};

export default async function AiPipelineRiskDetectorKitPage() {
  const user = await requireUser("/blueprints/ai-pipeline-risk-detector/kit");
  const entitled = await hasActiveEntitlement(user.id, "ai-pipeline-risk-detector");
  if (!entitled) {
    return (
      <PremiumKitLocked
        demoPath={DEMO_PATH}
        note="You send it. Nothing is sent or written to the CRM."
        linkClassName={FOCUS_RING}
      />
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Stalled Deal Rescue Queue Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for reviewing an open-deals export
        in ChatGPT, Claude, or Gemini. AI applies skip rules and drafts recovery
        notes from export fields only. You send it. Nothing is sent or written
        to the CRM.
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
                className={`inline-block max-w-full rounded text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
              >
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-8 space-y-6">
        <SetupChecklistSection />
        <StallQueuePromptSection />
        <NextWeekPromptSection />
        <RulesWorksheetSection />
        <OutcomeLogTemplateSection />
        <RecoveryReviewChecklistSection />
        <SampleDealExportSection />
        <SafetyGuidanceSection />
      </div>

      <Link
        href={DEMO_PATH}
        className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
      >
        Back to the guided demo
      </Link>
    </div>
  );
}
