import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { UseCaseCatalog } from "@/components/use-case-catalog";
import { loadPublishedContent } from "@/src/content/load-published";

export const metadata: Metadata = {
  title: "Use Case Library",
  description:
    "Browse a filterable library of practical AI use cases for business, mapped to data sources, APIs, tools, and implementation paths.",
  alternates: {
    canonical: "/use-cases",
  },
  openGraph: {
    title: "Use Case Library",
    description:
      "Browse practical AI use cases for business with data sources, APIs, and implementation workflows.",
    url: "/use-cases",
  },
};

function CatalogFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-xl bg-surface" />
      ))}
    </div>
  );
}

export default function UseCasesPage() {
  const { useCases } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">Reference · {useCases.length} entries</p>
        <h1 className="mt-1 text-2xl font-bold">Use Case Library</h1>
        <p className="mt-1 text-sm text-muted">
          Filter by tools you have, data you collect, or business type. Each entry
          includes a requirements checklist and build path comparison.
        </p>
        <p className="mt-2 text-xs text-muted">
          Not sure where to start?{" "}
          <Link href="/?apis=gmail-api,google-calendar-api" className="text-accent hover:underline">
            Try the tool matcher
          </Link>{" "}
          or{" "}
          <Link href="/?industry=fitness-studio" className="text-accent hover:underline">
            pick your business type
          </Link>
          .
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<CatalogFallback />}>
          <UseCaseCatalog />
        </Suspense>
      </div>
    </div>
  );
}
