import Link from "next/link";
import { HomeSection } from "./home-section";
import { loadPublishedContent } from "@/src/content/load-published";

const EXAMPLE_SLUGS = [
  "ai-review-intelligence",
  "ai-meeting-prep-assistant",
  "ai-follow-up-engine",
] as const;

export function WhatYouCanBuild() {
  const { useCases } = loadPublishedContent();
  const examples = EXAMPLE_SLUGS.map((slug) =>
    useCases.find((uc) => uc.slug === slug),
  ).filter((uc): uc is NonNullable<typeof uc> => Boolean(uc));

  if (examples.length === 0) return null;

  return (
    <HomeSection
      title="Real example blueprints"
      description="Each blueprint starts with a real business problem and shows the data, tools, and implementation path needed to solve it."
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {examples.map((example) => (
          <li key={example.slug}>
            <Link
              href={`/use-cases/${example.slug}`}
              className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
                {example.category}
              </span>
              <h3 className="mt-2 font-semibold">{example.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
                {example.outcome}
              </p>
              <span className="mt-4 text-sm font-medium text-accent">
                View blueprint →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
