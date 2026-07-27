import Link from "next/link";

const valuePoints = [
  "Discover relevant AI use cases",
  "Understand required APIs and data",
  "Start manually or build an automated tool",
];

export function HomeHero() {
  return (
    <header className="rounded-2xl border border-border/60 bg-card px-6 py-8 sm:px-8 sm:py-10">
      <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
        Practical AI Blueprints for SMBs
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
        Find AI workflows you can actually build
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
        Tell us what business you run, which tools and data you already have, or
        what problem you want to solve. AI Use Case Atlas will show you relevant
        use cases, the APIs and data required, and practical ways to test or build
        each workflow.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="#workflow-finder"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Find a workflow
        </a>
        <Link
          href="/use-cases"
          className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Browse all use cases
        </Link>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-3">
        {valuePoints.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface px-4 py-3 text-sm"
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent"
              aria-hidden="true"
            >
              ✓
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </header>
  );
}
