import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-staffing-optimizer/fact-label";
import { LaunchPurchasePanel } from "@/components/premium/shared/launch-purchase-panel";
import { GuidedDemo } from "@/components/premium/ai-staffing-optimizer/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-staffing-optimizer/demo-data";

export const metadata: Metadata = {
  title: "Shift Coverage vs Demand Check guided demo",
  description:
    "A fictional walkthrough that lines up hourly POS demand against clocked hours under owner-set rules. Nothing is connected or edited.",
  alternates: { canonical: "/blueprints/ai-staffing-optimizer" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AiStaffingOptimizerDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const checkoutUnavailable = (await searchParams).checkout === "unavailable";
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip launch-surface px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Shift Coverage vs Demand Check
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Line up hourly POS demand against clocked hours under owner-set
        minimums and a 3-of-4-weeks pattern rule. AI prepares the math. Schedule
        edits stay in your own tool.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Calculated from the exports.
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" />
          Minimum, target range, protected roles, non-sales day-parts.
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
        <LaunchPurchasePanel slug="ai-staffing-optimizer" checkoutUnavailable={checkoutUnavailable} />
        <GuidedDemo />
      </div>
    </div>
  );
}
