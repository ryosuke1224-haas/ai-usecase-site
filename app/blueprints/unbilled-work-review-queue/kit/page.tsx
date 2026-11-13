import type { Metadata } from "next";
import Link from "next/link";
import {
  BillingLogTemplateSection,
  NextWeekPromptSection,
  OutlineReviewChecklistSection,
  QueuePromptSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleJobExportSection,
  SetupChecklistSection,
} from "@/components/premium/unbilled-work-review-queue/kit-sections";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/unbilled-work-review-queue/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH } from "@/src/lib/premium/unbilled-work-review-queue/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/unbilled-work-review-queue/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unbilled Work Review Queue Premium Kit",
  description:
    "Prompts, worksheet, billing log, and review checklist for the Unbilled Work Review Queue workflow.",
  alternates: { canonical: "/blueprints/unbilled-work-review-queue/kit" },
  robots: { index: false, follow: false },
};

export default async function UnbilledWorkReviewQueueKitPage() {
  const user = await requireUser("/blueprints/unbilled-work-review-queue/kit");
  const entitled = await hasActiveEntitlement(user.id, "unbilled-work-review-queue");
  if (!entitled) {
    return (
      <PremiumKitLocked
        productSlug="unbilled-work-review-queue"
        demoPath={DEMO_PATH}
        note="You create the invoice. Nothing is sent or collected."
        linkClassName={FOCUS_RING}
      />
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Unbilled Work Review Queue Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for reviewing a job or time-entry
        export in ChatGPT, Claude, or Gemini. AI applies skip rules and drafts
        outlines from export fields only. You create the invoice. Nothing is
        sent or collected.
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
        <QueuePromptSection />
        <NextWeekPromptSection />
        <RulesWorksheetSection />
        <BillingLogTemplateSection />
        <OutlineReviewChecklistSection />
        <SampleJobExportSection />
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
