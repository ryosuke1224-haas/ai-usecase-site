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
import { japaneseCatalogLabel, japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import type { CatalogLabels } from "@/src/lib/i18n/copy";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { englishSiteCopy, siteCopy } from "@/src/lib/i18n/copy";
import { FilterChip } from "./ui/detail";

const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
const automationLevels: AutomationLevel[] = [
  "Manual trigger",
  "Semi-automated",
  "Fully automated",
];

export function UseCaseCatalog({
  catalogPath = "/use-cases",
  labels = englishSiteCopy.catalog.labels,
  chipLabel = (value: string) => value,
  locale = null,
}: {
  catalogPath?: string;
  labels?: CatalogLabels;
  chipLabel?: (value: string) => string;
  locale?: UiLocale | null;
} = {}) {
  const resolvedLabels = locale ? siteCopy(locale).catalog.labels : labels;
  const { useCases, apis, dataSources } = usePublishedContent();
  const categories = getUseCaseCategories(useCases);
  const industries = getUseCaseIndustries(useCases);
  const businessFunctions = getUseCaseBusinessFunctions(useCases);

  const labelFor = (value: string) =>
    locale === "ja" ? japaneseCatalogLabel(value) : (chipLabel ?? ((item: string) => item))(value);
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
        const queryString = params.toString();
        router.push(queryString ? `${catalogPath}?${queryString}` : catalogPath, { scroll: false });
      });
    },
    [catalogPath, router, searchParams],
  );

  const filtered = useCases.filter((uc) => {
    const q = query.toLowerCase();
    const localized = locale === "ja" ? japaneseUseCase(uc.slug) : undefined;
    const matchesQuery =
      !q ||
      uc.title.toLowerCase().includes(q) ||
      uc.summary.toLowerCase().includes(q) ||
      uc.tags.some((t) => t.includes(q)) ||
      Boolean(localized && (localized.title.toLowerCase().includes(q) || localized.summary.toLowerCase().includes(q)));
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
        placeholder={resolvedLabels.search}
        defaultValue={query}
        onChange={(e) => updateParams({ q: e.target.value || null })}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />

      <FilterRow label={resolvedLabels.category}>
        <FilterChip label={resolvedLabels.all} active={!category} onClick={() => updateParams({ category: null })} />
        {categories.map((c) => (
          <FilterChip key={c} label={labelFor(c)} active={category === c} onClick={() => updateParams({ category: category === c ? null : c })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.industry}>
        <FilterChip label={resolvedLabels.all} active={!industry} onClick={() => updateParams({ industry: null })} />
        {industries.map((i) => (
          <FilterChip key={i} label={labelFor(i)} active={industry === i} onClick={() => updateParams({ industry: industry === i ? null : i })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.functionLabel}>
        <FilterChip label={resolvedLabels.all} active={!businessFunction} onClick={() => updateParams({ function: null })} />
        {businessFunctions.map((f) => (
          <FilterChip key={f} label={labelFor(f)} active={businessFunction === f} onClick={() => updateParams({ function: businessFunction === f ? null : f })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.dataSource}>
        <FilterChip label={resolvedLabels.all} active={!dataSource} onClick={() => updateParams({ dataSource: null })} />
        {dataSources.map((ds) => (
          <FilterChip key={ds.slug} label={labelFor(ds.name)} active={dataSource === ds.slug} onClick={() => updateParams({ dataSource: dataSource === ds.slug ? null : ds.slug })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.api}>
        <FilterChip label={resolvedLabels.all} active={!api} onClick={() => updateParams({ api: null })} />
        {apis.map((a) => (
          <FilterChip key={a.slug} label={a.name} active={api === a.slug} onClick={() => updateParams({ api: api === a.slug ? null : a.slug })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.difficulty}>
        <FilterChip label={resolvedLabels.all} active={!difficulty} onClick={() => updateParams({ difficulty: null })} />
        {difficulties.map((d) => (
          <FilterChip key={d} label={labelFor(d)} active={difficulty === d} onClick={() => updateParams({ difficulty: difficulty === d ? null : d })} />
        ))}
      </FilterRow>

      <FilterRow label={resolvedLabels.automation}>
        <FilterChip label={resolvedLabels.all} active={!automation} onClick={() => updateParams({ automation: null })} />
        {automationLevels.map((a) => (
          <FilterChip key={a} label={labelFor(a)} active={automation === a} onClick={() => updateParams({ automation: automation === a ? null : a })} />
        ))}
      </FilterRow>

      <p className="mt-6 text-sm text-muted">
        {resolvedLabels.showing(filtered.length, useCases.length)}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((uc) => (
            <UseCaseCard key={uc.slug} useCase={uc} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState title={resolvedLabels.emptyTitle} clearLabel={resolvedLabels.clear} onClear={clearAll} />
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

function EmptyState({
  title,
  clearLabel,
  onClear,
}: {
  title: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <div className="mt-12 rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
      <p className="text-lg font-medium">{title}</p>
      <button type="button" onClick={onClear} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        {clearLabel}
      </button>
    </div>
  );
}
