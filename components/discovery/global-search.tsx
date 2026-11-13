"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePublishedContent } from "@/src/content/content-context";
import { globalSearch, type SearchResult } from "@/src/lib/discovery";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { isPublicJapaneseCatalogUseCase, japaneseCatalogHref } from "@/src/lib/i18n/japanese-catalog";

function localizeSearchHref(href: string): string {
  if (href.startsWith("/business-areas")) return href.replace("/business-areas", "/ja/business-areas");
  if (href.startsWith("/use-cases/") || href === "/use-cases") return "/ja/use-cases";
  if (href.startsWith("/apis")) return "/ja/apis";
  if (href.startsWith("/data-sources")) return "/ja/data-sources";
  if (href.startsWith("/contact")) return "/ja/contact";
  return href;
}

const typeLabels: Record<SearchResult["type"], string> = {
  "use-case": "Use case",
  api: "API",
  "data-source": "Data source",
  workflow: "Workflow",
};

export function GlobalSearch({
  className = "",
  locale = null,
}: {
  className?: string;
  locale?: "ja" | "en" | null;
}) {
  const japanese = locale === "ja";
  const labels = japanese
    ? { "use-case": "AI活用例", api: "API", "data-source": "データ", workflow: "アイデア" }
    : typeLabels;
  const content = usePublishedContent();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const matches = globalSearch(query, content);
    if (!japanese) {
      setResults(matches);
      return;
    }
    const q = query.trim().toLowerCase();
    const listed = content.useCases.filter(isPublicJapaneseCatalogUseCase);
    const listedSlugs = new Set(listed.map((useCase) => useCase.slug));
    const fromEnglish = matches.flatMap((result) => {
      if (result.type === "workflow") return [];
      if (result.type === "use-case" && !listedSlugs.has(result.slug)) return [];
      if (result.type !== "use-case") return [result];
      const useCase = listed.find((item) => item.slug === result.slug);
      const label = japaneseUseCase(result.slug);
      return [{
        ...result,
        title: label?.title ?? result.title,
        summary: label?.summary ?? result.summary,
        href: useCase ? japaneseCatalogHref(useCase) : result.href,
      }];
    });
    const seen = new Set(fromEnglish.filter((result) => result.type === "use-case").map((result) => result.slug));
    const fromJapanese = listed.flatMap((useCase) => {
      if (seen.has(useCase.slug)) return [];
      const label = japaneseUseCase(useCase.slug);
      const haystack = `${label?.title ?? ""} ${label?.summary ?? ""}`.toLowerCase();
      if (!q || !haystack.includes(q)) return [];
      return [{
        type: "use-case" as const,
        slug: useCase.slug,
        title: label?.title ?? useCase.title,
        summary: label?.summary ?? useCase.summary,
        href: japaneseCatalogHref(useCase),
      }];
    });
    setResults([...fromJapanese, ...fromEnglish]);
  }, [query, content, japanese]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="search"
        placeholder={japanese ? "AI活用例、ツール、データを探す" : "Search use cases, APIs, data sources..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            router.push(japanese ? localizeSearchHref(results[0].href) : results[0].href);
            setOpen(false);
            setQuery("");
          }
        }}
        className="w-full rounded-lg border border-border/60 bg-surface px-3 py-2 pl-9 text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
      />
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {open && query && results.length > 0 && (
        <ul className="absolute top-full z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border/60 bg-card py-1 shadow-lg">
          {results.map((r) => (
            <li key={`${r.type}-${r.slug}`}>
              <Link
                href={japanese ? localizeSearchHref(r.href) : r.href}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="block px-4 py-2.5 hover:bg-surface"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {labels[r.type]}
                </span>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted line-clamp-1">{r.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {open && query && results.length === 0 && (
        <p className="absolute top-full z-50 mt-1 w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-sm text-muted shadow-lg">
          {japanese ? `「${query}」に一致するものはありません` : `No results for “${query}”`}
        </p>
      )}
    </div>
  );
}
