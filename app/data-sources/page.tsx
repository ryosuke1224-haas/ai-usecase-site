import Link from "next/link";
import { Suspense } from "react";
import { DataSourceCatalog } from "@/components/data-source-catalog";
import { loadPublishedContent } from "@/src/content/load-published";

export const metadata = {
  title: "Data Source Library",
  description: "Data sources for SMB AI workflows.",
};

export default function DataSourcesPage() {
  const { dataSources } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">Reference · {dataSources.length} entries</p>
        <h1 className="mt-1 text-2xl font-bold">Data Source Library</h1>
        <p className="mt-1 text-sm text-muted">
          What each data type contains, privacy level, and what AI can do with it.
        </p>
        <p className="mt-2 text-xs text-muted">
          <Link href="/?industry=fitness-studio" className="text-accent hover:underline">
            Pick your business type
          </Link>{" "}
          to see which of these you likely already have.
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
          <DataSourceCatalog />
        </Suspense>
      </div>
    </div>
  );
}
