import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-payroll-forecasting/fact-label";
import { GuidedDemo } from "@/components/premium/ai-payroll-forecasting/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-payroll-forecasting/demo-data";

export const metadata: Metadata = {
  title: "Next-Pay Labor Check guided demo",
  description:
    "A fictional walkthrough that calculates loaded payroll from a posted schedule with visible formulas. Nothing is connected or edited.",
  alternates: { canonical: "/blueprints/ai-payroll-forecasting" },
  robots: { index: false, follow: false },
};

export default function AiPayrollForecastingDemoPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Next-Pay Labor Check
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Before the pay period starts, calculate loaded payroll from the posted
        schedule with visible formulas, flag only against your labor-share
        target and overtime rule, and re-check against the actual pay run. AI
        prepares the math. Schedule edits stay in your own tool.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Schedule × rate from the export.
        </li>
        <li>
          <FactLabel kind="OWNER-ENTERED" />
          Load factor, target, revenue estimate, overtime rule.
        </li>
        <li>
          <FactLabel kind="CALCULATED" />
          Formula results and labor percentage.
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
