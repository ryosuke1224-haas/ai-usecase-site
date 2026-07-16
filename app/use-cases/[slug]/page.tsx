import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UseCaseCard } from "@/components/use-case-card";
import { ImplementationCompare } from "@/components/use-case/implementation-compare";
import { RequirementsPanel } from "@/components/use-case/requirements-panel";
import { UseCaseDetailNav } from "@/components/use-case/detail-nav";
import {
  Badge,
  BulletList,
  DetailSection,
  NumberedList,
  TagList,
} from "@/components/ui/detail";
import {
  getAllUseCaseSlugs,
  getUseCaseBySlug,
  loadPublishedContent,
} from "@/src/content/load-published";
import { FINANCE_PLANNING_CATEGORY } from "@/src/content/finance";
import { createContentResolver } from "@/src/lib/resolve";
import { FinancePlanningDisclaimer } from "@/components/use-case/finance-disclaimer";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCaseBySlug(slug);
  if (!uc) return { title: "Not Found" };
  return { title: uc.title, description: uc.summary };
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCaseBySlug(slug);
  if (!uc) notFound();

  const { useCases } = loadPublishedContent();
  const { resolveApiName, resolveDataSourceName } =
    createContentResolver(loadPublishedContent());
  const related = useCases.filter((u) => uc.relatedUseCases.includes(u.slug));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/use-cases" className="text-xs font-medium text-muted hover:text-accent">
        ← Use case library
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[180px_1fr]">
        <UseCaseDetailNav />

        <article>
          <header className="border-b border-border/60 pb-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">{uc.category}</Badge>
              {uc.industries.slice(0, 2).map((i) => (
                <Badge key={i}>{i}</Badge>
              ))}
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {uc.title}
            </h1>
            {uc.tagline && (
              <p className="mt-1 text-sm font-medium text-accent">{uc.tagline}</p>
            )}
            <p className="mt-2 text-muted">{uc.summary}</p>
            <TagList items={uc.tags} />
          </header>

          {uc.category === FINANCE_PLANNING_CATEGORY && (
            <div className="mt-6">
              <FinancePlanningDisclaimer />
            </div>
          )}

          <div id="requirements" className="mt-8 scroll-mt-24">
            <RequirementsPanel useCase={uc} />
          </div>

          <div className="mt-10 space-y-10">
            <DetailSection id="problem" title="Business problem">
              <p className="text-sm leading-relaxed text-muted">{uc.businessProblem}</p>
              <div className="mt-4 rounded-lg bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Expected outcome
                </p>
                <p className="mt-1 text-sm">{uc.outcome}</p>
              </div>
              <p className="mt-4 text-sm text-muted">
                <span className="font-medium text-foreground">Who it&apos;s for: </span>
                {uc.whoItsFor}
              </p>
            </DetailSection>

            <DetailSection id="data-sources" title="Required data sources">
              <ul className="space-y-3">
                {uc.requiredDataSources.map((ds) => (
                  <li
                    key={ds}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                  >
                    <Link href={`/data-sources/${ds}`} className="text-sm font-medium text-accent hover:underline">
                      {resolveDataSourceName(ds)}
                    </Link>
                    <span className="text-xs text-muted">View access method →</span>
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="ai-inputs" title="What data goes into the AI">
              <BulletList items={uc.aiInputs} />
            </DetailSection>

            <DetailSection id="ai-outputs" title="What the AI should output">
              <BulletList items={uc.aiOutputs} />
            </DetailSection>

            <DetailSection id="apis" title="APIs needed to automate this">
              <ul className="space-y-3">
                {uc.requiredApis.map((api) => (
                  <li
                    key={api}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3"
                  >
                    <Link href={`/apis/${api}`} className="text-sm font-medium text-accent hover:underline">
                      {resolveApiName(api)}
                    </Link>
                    <span className="text-xs text-muted">Auth & setup →</span>
                  </li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="behavior" title="System behavior">
              <BulletList items={uc.systemBehavior} />
            </DetailSection>

            <DetailSection id="paths" title="No-code vs low-code vs custom">
              <ImplementationCompare useCase={uc} />
            </DetailSection>

            <DetailSection id="steps" title="Step-by-step implementation">
              <NumberedList items={uc.implementationSteps} />
            </DetailSection>

            <DetailSection id="risks" title="Risks and limitations">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <BulletList items={uc.risks} />
              </div>
            </DetailSection>

            {related.length > 0 && (
              <DetailSection title="Related use cases">
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <UseCaseCard key={r.slug} useCase={r} />
                  ))}
                </div>
              </DetailSection>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
