import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/unbilled-work-review-queue/fact-label";
import { GuidedDemo } from "@/components/premium/unbilled-work-review-queue/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/unbilled-work-review-queue/demo-data";

export const metadata: Metadata = {
  title: "Unbilled Work Review Queue guided demo",
  description:
    "A fictional walkthrough that ranks unbilled jobs after skip rules and drafts field-limited invoice outlines. You create the invoice. Nothing is sent or collected.",
  alternates: { canonical: "/blueprints/unbilled-work-review-queue" },
  robots: { index: false, follow: false },
};

export default function UnbilledWorkReviewQueueDemoPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Unbilled Work Review Queue
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Turn a job or time-entry export into a skip-ruled unbilled queue with
        oldest-first ranking and field-limited invoice outlines. AI prepares.
        You create or hold each invoice. Nothing is sent or collected.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the job export or billing log.
        </li>
        <li>
          <FactLabel kind="NEEDS YOUR CHECK" />
          Missing fields. Not outlined until you complete them.
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
