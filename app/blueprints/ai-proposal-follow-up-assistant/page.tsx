import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-proposal-follow-up-assistant/fact-label";
import { LaunchPurchasePanel } from "@/components/premium/shared/launch-purchase-panel";
import { GuidedDemo } from "@/components/premium/ai-proposal-follow-up-assistant/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-proposal-follow-up-assistant/demo-data";

export const metadata: Metadata = {
  title: "Quiet Proposal Chase Queue guided demo",
  description:
    "A fictional walkthrough that ranks silent proposals after skip rules and drafts field-limited follow-ups. You send it. Nothing is sent automatically.",
  alternates: { canonical: "/blueprints/ai-proposal-follow-up-assistant" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AiProposalFollowUpAssistantDemoPage({
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
        Quiet Proposal Chase Queue
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Turn a sent-proposal export into a skip-ruled silence queue with a
        written cadence and field-limited drafts. AI prepares. You review,
        edit, and send from your own email. Nothing is sent automatically.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the proposal export.
        </li>
        <li>
          <FactLabel kind="AI INTERPRETATION" />
          An inference by the AI, never presented as a fact.
        </li>
        <li>
          <FactLabel kind="RECOMMENDED ACTION" />
          A suggestion. You decide whether it happens.
        </li>
        <li>
          <FactLabel kind="SKIPPED" />
          Set aside by skip rules before the silence queue.
        </li>
      </ul>

      <p
        role="note"
        className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200"
      >
        {FICTIONAL_DATA_NOTICE}
      </p>

      <div className="mt-6">
        <LaunchPurchasePanel slug="ai-proposal-follow-up-assistant" checkoutUnavailable={checkoutUnavailable} />
        <GuidedDemo />
      </div>
    </div>
  );
}
