"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import type { Difficulty } from "@/src/types";
import { usePublishedContent } from "@/src/content/content-context";
import { ApiCard } from "./api-card";
import { FilterChip } from "./ui/detail";

const difficulties: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

export function ApiCatalog() {
  const { apis } = usePublishedContent();
  const categories = [...new Set(apis.map((a) => a.category))];
  const providers = [...new Set(apis.map((a) => a.provider))];

  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const provider = searchParams.get("provider") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      startTransition(() => {
        router.push(`/apis?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const filtered = apis.filter((api) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      api.name.toLowerCase().includes(q) ||
      api.summary.toLowerCase().includes(q) ||
      api.provider.toLowerCase().includes(q);
    return (
      matchesQuery &&
      (!category || api.category === category) &&
      (!provider || api.provider === provider) &&
      (!difficulty || api.difficulty === difficulty)
    );
  });

  return (
    <div className={isPending ? "opacity-70 transition-opacity" : ""}>
      <input
        type="search"
        placeholder="Search APIs..."
        defaultValue={query}
        onChange={(e) => updateParams({ q: e.target.value || null })}
        className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip label="All categories" active={!category} onClick={() => updateParams({ category: null })} />
        {categories.map((c) => (
          <FilterChip key={c} label={c} active={category === c} onClick={() => updateParams({ category: category === c ? null : c })} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip label="All providers" active={!provider} onClick={() => updateParams({ provider: null })} />
        {providers.map((p) => (
          <FilterChip key={p} label={p} active={provider === p} onClick={() => updateParams({ provider: provider === p ? null : p })} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip label="All difficulties" active={!difficulty} onClick={() => updateParams({ difficulty: null })} />
        {difficulties.map((d) => (
          <FilterChip key={d} label={d} active={difficulty === d} onClick={() => updateParams({ difficulty: difficulty === d ? null : d })} />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">Showing {filtered.length} of {apis.length} APIs</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((api) => (
          <ApiCard key={api.slug} api={api} />
        ))}
      </div>
    </div>
  );
}
