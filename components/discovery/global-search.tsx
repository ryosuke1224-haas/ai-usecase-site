"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePublishedContent } from "@/src/content/content-context";
import { globalSearch, type SearchResult } from "@/src/lib/discovery";

const typeLabels: Record<SearchResult["type"], string> = {
  "use-case": "Use case",
  api: "API",
  "data-source": "Data source",
  workflow: "Workflow",
};

export function GlobalSearch({ className = "" }: { className?: string }) {
  const content = usePublishedContent();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setResults(globalSearch(query, content));
  }, [query, content]);

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
        placeholder="Search use cases, APIs, data sources..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            router.push(results[0].href);
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
                href={r.href}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="block px-4 py-2.5 hover:bg-surface"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {typeLabels[r.type]}
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
          No results for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
