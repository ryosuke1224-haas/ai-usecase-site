import Link from "next/link";
import { Suspense } from "react";
import { UseCaseCatalog } from "@/components/use-case-catalog";
import { loadPublishedContent } from "@/src/content/load-published";

export const metadata = {
  title: "Use Case Library",
  description:
    "Filterable library of SMB AI workflow blueprints with data sources, APIs, and implementation paths.",
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
