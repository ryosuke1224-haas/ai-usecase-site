import type { Metadata } from "next";
import Link from "next/link";
import {
  CoverageCheckPromptSection,
  RecheckPromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleExportsSection,
  ScheduleReviewChecklistSection,
  SetupChecklistSection,
  WorkbookTemplateSection,
} from "@/components/premium/ai-staffing-optimizer/kit-sections";
import { FOCUS_RING } from "@/components/premium/ai-staffing-optimizer/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH } from "@/src/lib/premium/ai-staffing-optimizer/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/ai-staffing-optimizer/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shift Coverage vs Demand Check Premium Kit",
  description:
    "Prompts, worksheet, workbook template, and review checklist for the Shift Coverage vs Demand Check workflow.",
  alternates: { canonical: "/blueprints/ai-staffing-optimizer/kit" },
  robots: { index: false, follow: false },
};

export default async function AiStaffingOptimizerKitPage() {
  const user = await requireUser("/blueprints/ai-staffing-optimizer/kit");
  const entitled = await hasActiveEntitlement(user.id, "ai-staffing-optimizer");
  if (!entitled) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12">
        <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
          Premium · Private preview
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Premium is locked
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Your Atlas account is signed in. This Premium kit is a private preview. One-time purchase is on the guided demo.
          Atlas has not recorded an entitlement for this account, so the kit
          stays closed. Access for this private preview is by entitlement only.
        </p>
        <Link
          href={DEMO_PATH}
          className={`mt-8 inline-flex text-sm font-medium text-accent hover:underline ${FOCUS_RING}`}
        >
          Back to the guided demo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Shift Coverage vs Demand Check Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for reviewing hourly POS and
        clocked-hour exports in ChatGPT, Claude, or Gemini. AI calculates
        transactions per staff-hour with visible formulas. You check every
        CONFIRMED figure, then edit the schedule in your own tool yourself. The
        kit changes nothing.
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
        <CoverageCheckPromptSection />
        <RecheckPromptSection />
        <ScheduleReviewChecklistSection />
        <RulesWorksheetSection />
        <WorkbookTemplateSection />
        <SampleExportsSection />
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
