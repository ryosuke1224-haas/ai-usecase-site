"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePublishedContent, useContentResolver } from "@/src/content/content-context";
import { discoverByIndustry, industryProfiles } from "@/src/lib/discovery";
import { Badge } from "@/components/ui/detail";

export function IndustryExplorer({
  initialIndustry = "fitness-studio",
}: {
  initialIndustry?: string;
}) {
  const content = usePublishedContent();
  const { resolveDataSourceName } = useContentResolver();
  const [selected, setSelected] = useState(initialIndustry);
  const result = useMemo(
    () => discoverByIndustry(selected, content),
    [selected, content],
  );

  useEffect(() => {
    if (initialIndustry) setSelected(initialIndustry);
  }, [initialIndustry]);

  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="font-semibold">I run this type of business — what data do I have?</h2>
        <p className="mt-1 text-sm text-muted">
          Pick your business type to see data you likely already collect and
          workflows that use it.
        </p>
      </div>

      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {industryProfiles.map((profile) => (
            <button
              key={profile.slug}
              type="button"
              onClick={() => setSelected(profile.slug)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selected === profile.slug
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {profile.name}
            </button>
          ))}
        </div>
      </div>

      {result?.profile && (
        <div className="px-5 py-4">
          <p className="text-sm text-muted">{result.profile.summary}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Data you likely already have
              </h3>
              <ul className="mt-2 space-y-1.5">
                {result.dataSources.map((ds) => (
                  <li key={ds.slug}>
                    <Link
                      href={`/data-sources/${ds.slug}`}
                      className="group flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="font-medium group-hover:text-accent">
                        {ds.name}
                      </span>
                      <Badge>{ds.privacyLevel}</Badge>
                    </Link>
                    <p className="text-xs text-muted line-clamp-1">
                      {ds.whatAiCanDoWithIt[0]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Starter workflows for your business
              </h3>
              <ul className="mt-2 divide-y divide-border/40 rounded-lg border border-border/60">
                {result.useCases.slice(0, 6).map((uc) => (
                  <li key={uc.slug} className="px-3 py-2.5">
                    <Link
                      href={`/use-cases/${uc.slug}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {uc.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      Uses:{" "}
                      {uc.requiredDataSources
                        .slice(0, 2)
                        .map(resolveDataSourceName)
                        .join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href="/use-cases"
                className="mt-3 inline-block text-xs font-medium text-muted hover:text-accent"
              >
                Browse all {result.useCases.length} matching blueprints →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
