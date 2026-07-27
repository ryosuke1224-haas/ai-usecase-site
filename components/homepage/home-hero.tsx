import Link from "next/link";
import { HomeHeroVisual } from "./home-hero-visual";

export function HomeHero() {
  return (
    <header className="rounded-2xl border border-border/60 bg-card px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent sm:text-xs">
            AI Workflow Blueprints for Small Businesses
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2.15rem] lg:leading-tight">
            Turn the tools and data you already have into practical AI workflows
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
            Choose your business type and the tools you use. AI Use Case Atlas
            shows what you can build, the data and APIs required, what is still
            missing, and the simplest path to get started.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/find-workflows"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Find my workflows
            </Link>
            <Link
              href="/use-cases"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Browse all blueprints
            </Link>
          </div>

          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
            Built for small business owners, operators, and consultants looking
            for concrete AI opportunities—not generic AI inspiration.
          </p>
        </div>

        <HomeHeroVisual />
      </div>
    </header>
  );
}
