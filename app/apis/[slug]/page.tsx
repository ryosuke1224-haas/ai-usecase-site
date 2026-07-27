import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Badge,
  BulletList,
  DetailSection,
  TagList,
} from "@/components/ui/detail";
import {
  getAllApiSlugs,
  getApiBySlug,
  loadPublishedContent,
} from "@/src/content/load-published";
import { createContentResolver } from "@/src/lib/resolve";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllApiSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const api = getApiBySlug(slug);
  if (!api) return { title: "Not Found", robots: { index: false, follow: false } };
  return {
    title: api.name,
    description: api.summary,
    alternates: {
      canonical: `/apis/${slug}`,
    },
    openGraph: {
      title: api.name,
      description: api.summary,
      url: `/apis/${slug}`,
      type: "article",
    },
  };
}

export default async function ApiDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const api = getApiBySlug(slug);
  if (!api) notFound();

  const { resolveDataSourceName, resolveUseCaseTitle } =
    createContentResolver(loadPublishedContent());

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/apis" className="text-sm font-medium text-muted hover:text-accent">
        ← Back to API library
      </Link>

      <header className="mt-6 border-b border-border/60 pb-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{api.category}</Badge>
          <Badge>{api.provider}</Badge>
          <Badge>{api.difficulty}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{api.name}</h1>
        <p className="mt-2 text-muted">{api.summary}</p>
        <TagList items={api.tags} />
        <Link
          href={`/find-workflows?apis=${api.slug}`}
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Find all workflows I can build with {api.name} →
        </Link>
      </header>

      <div className="mt-10 space-y-12">
        <DetailSection title="What it does">
          <p className="text-sm leading-relaxed text-muted">{api.whatItDoes}</p>
        </DetailSection>

        <DetailSection title="What data it can access">
          <BulletList items={api.dataAvailable} />
        </DetailSection>

        <DetailSection title="What actions it can perform">
          <BulletList items={api.actionsSupported} />
        </DetailSection>

        <DetailSection title="Common AI use cases">
          <ul className="space-y-2">
            {api.commonUseCases.map((uc) => (
              <li key={uc}>
                <Link href={`/use-cases/${uc}`} className="text-sm font-medium text-accent hover:underline">
                  {resolveUseCaseTitle(uc)}
                </Link>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Related data sources">
          <ul className="space-y-2">
            {api.relatedDataSources.map((ds) => (
              <li key={ds}>
                <Link href={`/data-sources/${ds}`} className="text-sm font-medium text-accent hover:underline">
                  {resolveDataSourceName(ds)}
                </Link>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Authentication / permission notes">
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm text-muted">{api.authenticationType}</p>
          </div>
        </DetailSection>

        <DetailSection title="Privacy considerations">
          <p className="text-sm leading-relaxed text-muted">{api.privacyNotes}</p>
        </DetailSection>

        <DetailSection title="Implementation difficulty">
          <Badge variant={api.difficulty === "Beginner" ? "success" : api.difficulty === "Intermediate" ? "warning" : "info"}>
            {api.difficulty}
          </Badge>
        </DetailSection>

        <DetailSection title="Documentation">
          <p className="text-sm text-muted">
            Reference:{" "}
            <span className="font-mono text-xs text-foreground">
              {api.documentationUrlPlaceholder}
            </span>
          </p>
        </DetailSection>
      </div>
    </article>
  );
}
