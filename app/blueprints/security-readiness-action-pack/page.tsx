import type { Metadata } from "next";
import { FactLabel } from "@/components/premium/security-readiness-action-pack/fact-label";
import { GuidedDemo } from "@/components/premium/security-readiness-action-pack/guided-demo";
import { FICTIONAL_DATA_NOTICE } from "@/src/lib/premium/security-readiness-action-pack/demo-data";

export const metadata: Metadata = {
  title: "Security Readiness Action Pack guided demo",
  description:
    "A fictional walkthrough of a quarterly account-inventory queue that you review yourself. Nothing is scanned, connected, or certified.",
  alternates: { canonical: "/blueprints/security-readiness-action-pack" },
  robots: { index: false, follow: false },
};

export default function SecurityReadinessActionPackDemoPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl overflow-x-auto px-4 py-10 sm:px-6 sm:py-12">
      <p className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Private preview
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Security Readiness Action Pack
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        Each quarter, rank your own written account inventory with skip reasons,
        an owner-approved severity ladder, and a closure log. AI prepares the
        queue. You decide which gaps to act on, and you make every change in the
        real product. Nothing is scanned, connected, or certified.
      </p>

      <ul
        aria-label="How labels are used in this demo"
        className="mt-5 space-y-1.5 text-sm leading-relaxed text-foreground"
      >
        <li>
          <FactLabel kind="CONFIRMED" />
          Stated in the inventory or your closure log.
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
