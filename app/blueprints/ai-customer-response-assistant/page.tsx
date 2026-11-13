import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-customer-response-assistant/fact-label";
import { LaunchPurchasePanel } from "@/components/premium/shared/launch-purchase-panel";
import { GuidedDemo } from "@/components/premium/ai-customer-response-assistant/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-customer-response-assistant/demo-data";

export const metadata: Metadata = {
  title: "On-brand Reply Review Queue guided demo",
  description:
    "A fictional walkthrough that stops drafts on the owner's escalate list and answers only from pasted FAQ facts. You send it. Nothing is sent automatically.",
  alternates: { canonical: "/blueprints/ai-customer-response-assistant" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnBrandReplyReviewQueueDemoPage({
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
        On-brand Reply Review Queue
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Paste one inbound message, stop drafts on the owner&apos;s escalate
        list, and answer only from pasted FAQ facts. AI prepares. You review
        and send. Confirmed facts, AI interpretation, and recommended actions
        are labelled separately. Nothing is sent automatically. Every name,
        time, and message on this walkthrough is invented.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the message or in the pasted FAQ.
        </li>
        <li>
          <FactLabel kind="NEEDS YOUR CHECK" />
          Missing from the FAQ. Do not invent an answer.
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
        <LaunchPurchasePanel slug="ai-customer-response-assistant" checkoutUnavailable={checkoutUnavailable} />
        <GuidedDemo />
      </div>
    </div>
  );
}
