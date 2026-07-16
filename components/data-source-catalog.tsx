"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { usePublishedContent } from "@/src/content/content-context";
import { DataSourceCard } from "./data-source-card";
import { FilterChip } from "./ui/detail";

export function DataSourceCatalog() {
  const { dataSources } = usePublishedContent();
  const categories = [...new Set(dataSources.map((ds) => ds.category))];

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/data-sources?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const filtered = dataSources.filter((ds) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      ds.name.toLowerCase().includes(q) ||
      ds.summary.toLowerCase().includes(q);
    return matchesQuery && (!category || ds.category === category);
  });

  return (
    <div className={isPending ? "opacity-70 transition-opacity" : ""}>
      <input
        type="search"
        placeholder="Search data sources..."
        defaultValue={query}
        onChange={(e) => updateParams({ q: e.target.value || null })}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip label="All" active={!category} onClick={() => updateParams({ category: null })} />
        {categories.map((c) => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => updateParams({ category: category === c ? null : c })} />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        Showing {filtered.length} of {dataSources.length} data sources
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ds) => (
          <DataSourceCard key={ds.slug} dataSource={ds} />
        ))}
      </div>
    </div>
  );
}
