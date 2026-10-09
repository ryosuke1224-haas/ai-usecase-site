import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/ai-collections-assistant/fact-label";
import { GuidedDemo } from "@/components/premium/ai-collections-assistant/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/ai-collections-assistant/demo-data";

export const metadata: Metadata = {
  title: "AI Collections Assistant guided demo",
  description:
    "A fictional walkthrough of a weekly collections queue that you review yourself. Nothing is sent automatically.",
  alternates: { canonical: "/blueprints/ai-collections-assistant" },
  robots: { index: false, follow: false },
};

export default function AiCollectionsAssistantDemoPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        AI Collections Assistant
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        A weekly collections queue that you review yourself. AI sets aside
        disputed, promised, and below-minimum invoices with a visible reason,
        matches each draft&apos;s tone to how overdue the invoice is, and reads
        your outcome log so the same invoice is not chased twice by mistake. You
        decide what is sent, and you send it.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the export or your outcome log.
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
