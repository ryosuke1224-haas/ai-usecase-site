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
  getAllDataSourceSlugs,
  getDataSourceBySlug,
  loadPublishedContent,
} from "@/src/content/load-published";
import { createContentResolver } from "@/src/lib/resolve";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllDataSourceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ds = getDataSourceBySlug(slug);
  if (!ds) return { title: "Not Found", robots: { index: false, follow: false } };
  return {
    title: ds.name,
    description: ds.summary,
    alternates: {
      canonical: `/data-sources/${slug}`,
    },
    openGraph: {
      title: ds.name,
      description: ds.summary,
      url: `/data-sources/${slug}`,
      type: "article",
    },
  };
}

const privacyVariant = {
  Public: "success" as const,
  Internal: "default" as const,
  Sensitive: "warning" as const,
  PII: "info" as const,
};

export default async function DataSourceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ds = getDataSourceBySlug(slug);
  if (!ds) notFound();

  const { resolveApiName, resolveUseCaseTitle } =
    createContentResolver(loadPublishedContent());

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/data-sources" className="text-sm font-medium text-muted hover:text-accent">
        ← Back to data sources
      </Link>

      <header className="mt-6 border-b border-border/60 pb-8">
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{ds.category}</Badge>
          <Badge variant={privacyVariant[ds.privacyLevel]}>{ds.privacyLevel}</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{ds.name}</h1>
        <p className="mt-4 text-lg text-muted">{ds.summary}</p>
        <TagList items={ds.tags} />
      </header>

      <div className="mt-10 space-y-12">
        <DetailSection title="What it contains">
          <p className="text-sm leading-relaxed text-muted">{ds.whatItContains}</p>
        </DetailSection>

        <DetailSection title="Common examples">
          <BulletList items={ds.examples} />
        </DetailSection>

        <DetailSection title="What AI can do with this data">
          <BulletList items={ds.whatAiCanDoWithIt} />
        </DetailSection>

        <DetailSection title="Related APIs">
          <ul className="space-y-2">
            {ds.relatedApis.map((api) => (
              <li key={api}>
                <Link href={`/apis/${api}`} className="text-sm font-medium text-accent hover:underline">
                  {resolveApiName(api)}
                </Link>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Related use cases">
          <ul className="space-y-2">
            {ds.relatedUseCases.map((uc) => (
              <li key={uc}>
                <Link href={`/use-cases/${uc}`} className="text-sm font-medium text-accent hover:underline">
                  {resolveUseCaseTitle(uc)}
                </Link>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Access method">
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm text-muted">{ds.accessMethod}</p>
          </div>
        </DetailSection>

        <DetailSection title="Privacy level">
          <Badge variant={privacyVariant[ds.privacyLevel]}>{ds.privacyLevel}</Badge>
          <p className="mt-3 text-sm text-muted">
            {ds.privacyLevel === "PII" &&
              "Contains personally identifiable information. Requires consent, retention policies, and secure handling in AI prompts."}
            {ds.privacyLevel === "Sensitive" &&
              "Financial or business-sensitive data. Limit API scopes and avoid logging in plain text."}
            {ds.privacyLevel === "Internal" &&
              "Internal business data. Scope access to authorized team members and integrations."}
            {ds.privacyLevel === "Public" &&
              "Publicly available data. Still subject to platform terms of service for storage and republication."}
          </p>
        </DetailSection>
      </div>
    </article>
  );
}
