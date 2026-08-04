import Link from "next/link";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { FlagshipPlaybook } from "@/components/homepage/flagship-playbook";
import { getBusinessAreaOverviews } from "@/src/lib/business-area-content";

/**
 * Temporarily hides the flagship Google Ads section below the hero.
 * Set to true to restore it — the component, blueprint page, playbook page,
 * content, and images all remain in place. With it hidden, the hero flows
 * straight into #business-areas, which supplies its own section spacing.
 */
const showFlagshipWorkflow: boolean = false;

const steps = [
  {
    number: "1",
    title: "Choose a business area",
    description: "Start with the part of your business you want to improve.",
  },
  {
    number: "2",
    title: "Explore common processes",
    description:
      "See where repetitive work, delays, or errors commonly occur.",
  },
  {
    number: "3",
    title: "Open a practical blueprint",
    description:
      "Learn what the workflow does, what you need, and how to start manually or automate it.",
  },
] as const;

export function LiveHomePage() {
  const areas = getBusinessAreaOverviews();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent sm:text-xs">
          Practical AI workflows for small businesses
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
          See where AI can save time across your business
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Explore practical ways to reduce repetitive work, improve operations,
          and make better decisions across sales, marketing, finance, HR,
          customer service, and everyday administration.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/business-areas"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Explore business areas
          </Link>
          <Link
            href="/use-cases"
            className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Browse all AI blueprints
          </Link>
        </div>
      </section>

      {showFlagshipWorkflow && <FlagshipPlaybook />}

      <section id="business-areas" className="mt-16 scroll-mt-24 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Which part of your business do you want to improve?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Choose an area to explore common processes and practical AI workflows.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <li key={area.slug}>
              <BusinessAreaCard area={area} workflowCount={area.workflowCount} />
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="mt-16 scroll-mt-24 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          From everyday work to a practical AI workflow
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-border/60 bg-surface/60 px-5 py-5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold text-accent">
                {step.number}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-muted">
          Already know which tools you use?{" "}
          <Link
            href="/find-workflows"
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Find workflows by tools
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
