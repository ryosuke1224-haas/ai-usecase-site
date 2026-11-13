import type { Metadata } from "next";
import Link from "next/link";
import {
  ActionReviewChecklistSection,
  MeasurementReviewPromptSection,
  PeriodReviewPromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleExportsSection,
  SetupChecklistSection,
  WorkbookTemplateSection,
} from "@/components/premium/google-ads-performance-coach/kit-sections";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/google-ads-performance-coach/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH } from "@/src/lib/premium/google-ads-performance-coach/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/google-ads-performance-coach/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Google Ads Performance Coach Premium Kit",
  description:
    "Prompts, worksheet, workbook template, and review checklist for the Google Ads Performance Coach measurement-first review.",
  alternates: { canonical: "/blueprints/google-ads-performance-coach/kit" },
  robots: { index: false, follow: false },
};

export default async function GoogleAdsPerformanceCoachKitPage() {
  const user = await requireUser("/blueprints/google-ads-performance-coach/kit");
  const entitled = await hasActiveEntitlement(
    user.id,
    "google-ads-performance-coach",
  );
  if (!entitled) {
    return (
      <PremiumKitLocked
        productSlug="google-ads-performance-coach"
        demoPath={DEMO_PATH}
        className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12"
        linkClassName={FOCUS_RING}
      />
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Google Ads Performance Coach Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for a measurement-first Google Ads
        review in ChatGPT, Claude, or Gemini. AI compares each primary
        conversion to the qualified outcome you wrote. You check every CONFIRMED
        number and make every change in Google Ads. The kit changes nothing.
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
        <MeasurementReviewPromptSection />
        <PeriodReviewPromptSection />
        <RulesWorksheetSection />
        <WorkbookTemplateSection />
        <ActionReviewChecklistSection />
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
