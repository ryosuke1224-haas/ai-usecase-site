"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { AutomationLevel, Difficulty } from "@/src/types";
import { usePublishedContent } from "@/src/content/content-context";
import {
  getUseCaseBusinessFunctions,
  getUseCaseCategories,
  getUseCaseIndustries,
} from "@/src/lib/discovery";
import { UseCaseCard } from "./use-case-card";
import { FilterChip } from "./ui/detail";

const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const automationLevels: AutomationLevel[] = [
  "Manual trigger",
  "Semi-automated",
  "Fully automated",
];

export function UseCaseCatalog() {
  const { useCases, apis, dataSources } = usePublishedContent();
  const categories = getUseCaseCategories(useCases);
  const industries = getUseCaseIndustries(useCases);
  const businessFunctions = getUseCaseBusinessFunctions(useCases);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const industry = searchParams.get("industry") ?? "";
  const businessFunction = searchParams.get("function") ?? "";
  const dataSource = searchParams.get("dataSource") ?? "";
  const api = searchParams.get("api") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const automation = searchParams.get("automation") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/use-cases?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const filtered = useCases.filter((uc) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      uc.title.toLowerCase().includes(q) ||
      uc.summary.toLowerCase().includes(q) ||
      uc.tags.some((t) => t.includes(q));
    return (
      matchesQuery &&
      (!category || uc.category === category) &&
      (!industry || uc.industries.includes(industry)) &&
      (!businessFunction || uc.businessFunctions.includes(businessFunction)) &&
      (!dataSource || uc.requiredDataSources.includes(dataSource)) &&
      (!api || uc.requiredApis.includes(api)) &&
      (!difficulty || uc.difficulty === difficulty) &&
      (!automation || uc.automationLevel === automation)
    );
  });

  const clearAll = () =>
    updateParams({
      q: null,
      category: null,
      industry: null,
      function: null,
      dataSource: null,
      api: null,
      difficulty: null,
      automation: null,
    });

  return (
    <div className={isPending ? "opacity-70 transition-opacity" : ""}>
      <input
        type="search"
        placeholder="Search use cases..."
        defaultValue={query}
        onChange={(e) => updateParams({ q: e.target.value || null })}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />

      <FilterRow label="Category">
        <FilterChip label="All" active={!category} onClick={() => updateParams({ category: null })} />
        {categories.map((c) => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => updateParams({ category: category === c ? null : c })} />
        ))}
      </FilterRow>

      <FilterRow label="Industry">
        <FilterChip label="All" active={!industry} onClick={() => updateParams({ industry: null })} />
        {industries.map((i) => (
          <FilterChip key={i} label={i} active={industry === i} onClick={() => updateParams({ industry: industry === i ? null : i })} />
        ))}
      </FilterRow>

      <FilterRow label="Function">
        <FilterChip label="All" active={!businessFunction} onClick={() => updateParams({ function: null })} />
        {businessFunctions.map((f) => (
          <FilterChip key={f} label={f} active={businessFunction === f} onClick={() => updateParams({ function: businessFunction === f ? null : f })} />
        ))}
      </FilterRow>

      <FilterRow label="Data source">
        <FilterChip label="All" active={!dataSource} onClick={() => updateParams({ dataSource: null })} />
        {dataSources.map((ds) => (
          <FilterChip key={ds.slug} label={ds.name} active={dataSource === ds.slug} onClick={() => updateParams({ dataSource: dataSource === ds.slug ? null : ds.slug })} />
        ))}
      </FilterRow>

      <FilterRow label="API">
        <FilterChip label="All" active={!api} onClick={() => updateParams({ api: null })} />
        {apis.map((a) => (
          <FilterChip key={a.slug} label={a.name} active={api === a.slug} onClick={() => updateParams({ api: api === a.slug ? null : a.slug })} />
        ))}
      </FilterRow>

      <FilterRow label="Difficulty">
        <FilterChip label="All" active={!difficulty} onClick={() => updateParams({ difficulty: null })} />
        {difficulties.map((d) => (
          <FilterChip key={d} label={d} active={difficulty === d} onClick={() => updateParams({ difficulty: difficulty === d ? null : d })} />
        ))}
      </FilterRow>

      <FilterRow label="Automation">
        <FilterChip label="All" active={!automation} onClick={() => updateParams({ automation: null })} />
        {automationLevels.map((a) => (
          <FilterChip key={a} label={a} active={automation === a} onClick={() => updateParams({ automation: automation === a ? null : a })} />
        ))}
      </FilterRow>

      <p className="mt-6 text-sm text-muted">
        Showing {filtered.length} of {useCases.length} blueprints
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((uc) => (
            <UseCaseCard key={uc.slug} useCase={uc} />
          ))}
        </div>
      ) : (
        <EmptyState onClear={clearAll} />
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
      <p className="text-lg font-medium">No blueprints match your filters</p>
      <button type="button" onClick={onClear} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        Clear all filters
      </button>
    </div>
  );
}
