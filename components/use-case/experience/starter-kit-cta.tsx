import Link from "next/link";
import type { UseCaseExperience } from "@/src/types";
import { getStarterKitHref } from "@/src/lib/offers";

type StarterCta = NonNullable<UseCaseExperience["starterCta"]>;

/**
 * Mid-page Free Starter Kit conversion CTA.
 * Links to the protected Starter Kit route; that page handles auth redirect.
 */
export function StarterKitCta({ starterCta }: { starterCta: StarterCta }) {
  return (
    <section
      id="starter-kit"
      className="scroll-mt-24 rounded-2xl border border-accent/40 bg-card p-6 sm:p-8"
    >
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
        Next step
      </p>
      <h2 className="mt-2 max-w-2xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {starterCta.heading}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        {starterCta.description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={getStarterKitHref()}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {starterCta.ctaLabel}
        </Link>
        <p className="text-xs font-medium text-muted">
          {starterCta.supporting}
        </p>
      </div>
    </section>
  );
}
