import Link from "next/link";

const benefits = [
  "Relevant AI workflow ideas",
  "Required tools, APIs, and data",
  "Manual and automated build options",
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
        Select the tools you already use and your type of business. AI Use Case
        Atlas shows relevant use cases, the APIs and data required, and practical
        ways to test or build each workflow.
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

      <div className="mt-8 border-t border-border/60 pt-6">
        <h2 className="text-sm font-semibold text-foreground">What you’ll get</h2>
        <ul className="mt-3 space-y-2">
          {benefits.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
