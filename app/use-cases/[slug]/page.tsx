import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UseCaseCard } from "@/components/use-case-card";
import {
  BLUEPRINT_GUIDE_SECTIONS,
  BlueprintGuide,
} from "@/components/use-case/blueprint-guide";
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
import { getBusinessArea } from "@/src/lib/business-areas";
import { createContentResolver } from "@/src/lib/resolve";
import type { UseCase } from "@/src/types";
import { FinancePlanningDisclaimer } from "@/components/use-case/finance-disclaimer";
import { GoogleAdsPlaybookSection } from "@/components/use-case/google-ads-playbook";
import { ExperienceUseCasePage } from "@/components/use-case/experience/experience-use-case-page";

const PLAYBOOK_SLUGS = new Set(["google-ads-performance-coach"]);

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCaseBySlug(slug);
  if (!uc) return { title: "Not Found", robots: { index: false, follow: false } };
  return {
    title: uc.title,
    description: uc.summary,
    alternates: {
      canonical: `/use-cases/${slug}`,
    },
    openGraph: {
      title: uc.title,
      description: uc.summary,
      url: `/use-cases/${slug}`,
      type: "article",
    },
  };
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const uc = getUseCaseBySlug(slug);
  if (!uc) notFound();

  // Opt-in experience-led template. Every other use case falls through to the
  // existing blueprint template below, unchanged.
  if (uc.templateVersion === "experience-v2" && uc.experience) {
    return <ExperienceUseCasePage useCase={uc} experience={uc.experience} />;
  }

  const { useCases } = loadPublishedContent();
  const businessArea = uc.businessArea
    ? getBusinessArea(uc.businessArea)
    : undefined;
  const related = useCases.filter((u) => uc.relatedUseCases.includes(u.slug));
  const hasGuide = Boolean(uc.blueprintGuide);
  const hasPlaybook = PLAYBOOK_SLUGS.has(uc.slug);
  const guideSections = hasPlaybook
    ? BLUEPRINT_GUIDE_SECTIONS.flatMap((section) =>
        section.id === "technical"
          ? [{ id: "playbook", label: "Playbook" }, section]
          : [section],
      )
    : [...BLUEPRINT_GUIDE_SECTIONS];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link href="/use-cases" className="text-xs font-medium text-muted hover:text-accent">
        ← Use case library
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[180px_1fr]">
        <UseCaseDetailNav sections={hasGuide ? guideSections : undefined} />

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
            {businessArea && (
              <p className="mt-3 text-sm text-muted">
                Business area:{" "}
                <Link
                  href={`/business-areas/${businessArea.slug}`}
                  className="font-medium text-accent hover:underline"
                >
                  {businessArea.title}
                </Link>
                {uc.businessProcesses && uc.businessProcesses.length > 0 && (
                  <> &middot; {uc.businessProcesses.join(", ")}</>
                )}
              </p>
            )}
            <TagList items={uc.tags} />
          </header>

          {uc.category === FINANCE_PLANNING_CATEGORY && (
            <div className="mt-6">
              <FinancePlanningDisclaimer />
            </div>
          )}

          {hasGuide ? (
            <>
              <div className="mt-8">
                <BlueprintGuide useCase={uc} />
              </div>

              {hasPlaybook && (
                <div className="mt-12">
                  <GoogleAdsPlaybookSection />
                </div>
              )}

              <section id="technical" className="mt-12 scroll-mt-24">
                <details className="group rounded-xl border border-border/60 bg-surface/40">
                  <summary className="cursor-pointer list-none px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                    <span className="flex items-center justify-between gap-3">
                      <span>
                        <span className="text-lg font-semibold tracking-tight">
                          Technical details
                        </span>
                        <span className="mt-0.5 block text-sm text-muted">
                          Tools, data, and build options. Not needed to try the
                          manual version.
                        </span>
                      </span>
                      <span
                        className="text-muted transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      >
                        &#9662;
                      </span>
                    </span>
                  </summary>

                  <div className="space-y-10 border-t border-border/60 px-5 py-6">
                    <RequirementsPanel useCase={uc} />
                    <TechnicalSections useCase={uc} />
                  </div>
                </details>
              </section>
            </>
          ) : (
            <>
              <div id="requirements" className="mt-8 scroll-mt-24">
                <RequirementsPanel useCase={uc} />
              </div>

              <div className="mt-10 space-y-10">
                <DetailSection id="problem" title="Business problem">
                  <p className="text-sm leading-relaxed text-muted">
                    {uc.businessProblem}
                  </p>
                  <div className="mt-4 rounded-lg bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Expected outcome
                    </p>
                    <p className="mt-1 text-sm">{uc.outcome}</p>
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    <span className="font-medium text-foreground">
                      Who it&apos;s for:{" "}
                    </span>
                    {uc.whoItsFor}
                  </p>
                </DetailSection>

                <TechnicalSections useCase={uc} />
              </div>
            </>
          )}

          {related.length > 0 && (
            <div className="mt-12">
              <DetailSection title="Related use cases">
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map((r) => (
                    <UseCaseCard key={r.slug} useCase={r} />
                  ))}
                </div>
              </DetailSection>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

function TechnicalSections({ useCase: uc }: { useCase: UseCase }) {
  const { resolveApiName, resolveDataSourceName } =
    createContentResolver(loadPublishedContent());

  return (
    <>
      {uc.requiredDataSources.length > 0 && (
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
      )}

      <DetailSection id="ai-inputs" title="What data goes into the AI">
        <BulletList items={uc.aiInputs} />
      </DetailSection>

      <DetailSection id="ai-outputs" title="What the AI should output">
        <BulletList items={uc.aiOutputs} />
      </DetailSection>

      {uc.requiredApis.length > 0 && (
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
      )}

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
    </>
  );
}
