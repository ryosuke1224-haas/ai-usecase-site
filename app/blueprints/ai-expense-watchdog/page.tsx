import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-expense-watchdog/fact-label";
import { LaunchPurchasePanel } from "@/components/premium/shared/launch-purchase-panel";
import { GuidedDemo } from "@/components/premium/ai-expense-watchdog/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-expense-watchdog/demo-data";

export const metadata: Metadata = {
  title: "AI Expense Watchdog guided demo",
  description:
    "A fictional walkthrough that turns card CSV rows into a recurring-charge ledger. Nothing is connected or cancelled.",
  alternates: { canonical: "/blueprints/ai-expense-watchdog" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AiExpenseWatchdogDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const checkoutUnavailable = (await searchParams).checkout === "unavailable";
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto launch-surface px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        AI Expense Watchdog
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Turn a few months of card or accounting CSV rows into a recurring-charge
        ledger with labelled amount changes and possible overlaps. AI prepares
        the review. You decide what to cancel. You cancel in the vendor&apos;s
        own site yourself. The kit changes nothing.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the export row.
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
        <LaunchPurchasePanel slug="ai-expense-watchdog" checkoutUnavailable={checkoutUnavailable} />
        <GuidedDemo />
      </div>
    </div>
  );
}
