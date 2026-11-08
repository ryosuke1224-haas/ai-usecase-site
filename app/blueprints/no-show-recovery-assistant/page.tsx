import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/no-show-recovery-assistant/fact-label";
import { GuidedDemo } from "@/components/premium/no-show-recovery-assistant/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/no-show-recovery-assistant/demo-data";

export const metadata: Metadata = {
  title: "No-show Recovery Assistant guided demo",
  description:
    "A fictional walkthrough that labels no-show drafts with real open times and a consent check. Nothing is connected or sent.",
  alternates: { canonical: "/blueprints/no-show-recovery-assistant" },
  robots: { index: false, follow: false },
};

export default function NoShowRecoveryAssistantDemoPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        No-show Recovery Assistant
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Turn a day&apos;s booking export into labelled no-show drafts with real
        open times and a consent check. AI prepares. You review and send, or
        you decide not to. The kit changes nothing.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the booking export.
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" />
          An inference by the AI, never presented as a fact.
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" />
          A suggestion. You decide whether it happens.
        </li>
      </ul>

      <p
        role="note"
        className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200"
      >
        {FICTIONAL_DATA_NOTICE}
      </p>

      <div className="mt-6">
        <GuidedDemo />
      </div>
    </div>
  );
}
