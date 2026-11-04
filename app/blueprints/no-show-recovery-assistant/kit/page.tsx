import type { Metadata } from "next";
import Link from "next/link";
import {
  ActionReviewChecklistSection,
  AttendancePromptSection,
  RebookingDraftPromptSection,
  RecoveryLogTemplateSection,
  RulesWorksheetSection,
  SafetyGuidanceSection,
  SampleBookingsSection,
  SetupChecklistSection,
} from "@/components/premium/no-show-recovery-assistant/kit-sections";
import { PremiumKitLocked } from "@/components/premium/shared/premium-kit-locked";
import { FOCUS_RING } from "@/components/premium/no-show-recovery-assistant/styles";
import { requireUser } from "@/src/lib/auth";
import { hasActiveEntitlement } from "@/src/lib/payments/access";
import { DEMO_PATH } from "@/src/lib/premium/no-show-recovery-assistant/demo-data";
import {
  KIT_SECTIONS,
  PLAN_DIFFERENCE_NOTICE,
  SESSION_ONLY_NOTICE,
} from "@/src/lib/premium/no-show-recovery-assistant/kit-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "No-show Recovery Assistant Premium Kit",
  description:
    "Prompts, worksheet, recovery log, and review checklist for the No-show Recovery Assistant workflow.",
  alternates: { canonical: "/blueprints/no-show-recovery-assistant/kit" },
  robots: { index: false, follow: false },
};

export default async function NoShowRecoveryAssistantKitPage() {
  const user = await requireUser("/blueprints/no-show-recovery-assistant/kit");
  const entitled = await hasActiveEntitlement(user.id, "no-show-recovery-assistant");
  if (!entitled) {
    return (
      <PremiumKitLocked
        demoPath={DEMO_PATH}
        note="You review and send. The kit changes nothing."
        className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12"
        linkClassName={FOCUS_RING}
      />
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold tracking-wider text-accent">
        Premium · Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        No-show Recovery Assistant Premium Kit
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Prompts, a worksheet, and checklists for reviewing one day&apos;s booking
        export in ChatGPT, Claude, or Gemini. AI labels confirmed misses and
        drafts only after attendance, consent, and matching open slots. You
        review and send yourself. The kit changes nothing.
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
        <AttendancePromptSection />
        <RebookingDraftPromptSection />
        <RulesWorksheetSection />
        <RecoveryLogTemplateSection />
        <ActionReviewChecklistSection />
        <SampleBookingsSection />
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
