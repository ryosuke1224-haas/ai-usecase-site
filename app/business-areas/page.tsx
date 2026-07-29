import type { Metadata } from "next";
import Link from "next/link";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { getBusinessAreaOverviews } from "@/src/lib/business-area-content";

const TITLE = "Business Areas";
const DESCRIPTION =
  "Explore where AI can save time in your business — sales, marketing, customer service, operations, finance, HR, and administration.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/business-areas",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/business-areas",
  },
};

export default function BusinessAreasPage() {
  const areas = getBusinessAreaOverviews();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent sm:text-xs">
          Business Areas
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Which part of your business do you want to improve?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Choose an area to explore common processes and practical AI workflows.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => (
          <li key={area.slug}>
            <BusinessAreaCard area={area} workflowCount={area.workflowCount} />
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted">
        Prefer to see everything at once?{" "}
        <Link
          href="/use-cases"
          className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Browse all AI blueprints
        </Link>
        .
      </p>
    </div>
  );
}
