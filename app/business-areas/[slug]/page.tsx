import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessAreaIcon } from "@/components/business-areas/business-area-icon";
import { WorkflowCard } from "@/components/business-areas/workflow-card";
import {
  getBusinessProcessGroups,
  getUnmappedAreaUseCases,
  getUseCasesForBusinessArea,
} from "@/src/lib/business-area-content";
import {
  BUSINESS_AREAS,
  getBusinessArea,
} from "@/src/lib/business-areas";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BUSINESS_AREAS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const area = getBusinessArea(slug);
  if (!area) {
    return { title: "Not Found", robots: { index: false, follow: false } };
  }

  const title = `AI Workflows for ${area.title}`;
  const description = `Practical AI workflows for ${area.title.toLowerCase()} in small businesses: ${area.description.toLowerCase()}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/business-areas/${area.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/business-areas/${area.slug}`,
    },
  };
}

export default async function BusinessAreaPage({ params }: PageProps) {
  const { slug } = await params;
  const area = getBusinessArea(slug);
  if (!area) notFound();

  const processGroups = getBusinessProcessGroups(area);
  const unmapped = getUnmappedAreaUseCases(area);
  const workflowCount = getUseCasesForBusinessArea(area.slug).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <Link
        href="/business-areas"
        className="text-xs font-medium text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        &larr; All business areas
      </Link>

      <header className="mt-5 border-b border-border/60 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <BusinessAreaIcon area={area.slug} className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
          {area.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {area.description}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {area.intro}
        </p>
        <p className="mt-4 text-xs text-muted">
          {workflowCount > 0
            ? `${workflowCount} published ${workflowCount === 1 ? "blueprint" : "blueprints"} across ${area.processes.length} common processes`
            : `${area.processes.length} common processes`}
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {processGroups.map((group) => (
          <section key={group.name} className="scroll-mt-24">
            <h2 className="text-lg font-semibold tracking-tight">
              {group.name}
            </h2>

            {group.useCases.length > 0 ? (
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.useCases.map((useCase) => (
                  <WorkflowCard key={useCase.slug} useCase={useCase} />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/60 px-5 py-5">
                <p className="text-sm text-muted">Blueprints coming soon</p>
                <Link
                  href="/contact"
                  className="mt-2 inline-flex text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Share a workflow you want us to explore
                </Link>
              </div>
            )}
          </section>
        ))}

        {unmapped.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold tracking-tight">
              More workflows in this area
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {unmapped.map((useCase) => (
                <WorkflowCard key={useCase.slug} useCase={useCase} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-sm">
        <Link
          href="/business-areas"
          className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          &larr; All business areas
        </Link>
        <Link
          href="/use-cases"
          className="text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Browse all AI blueprints
        </Link>
      </div>
    </div>
  );
}
