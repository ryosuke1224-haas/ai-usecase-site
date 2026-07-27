import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApiCatalog } from "@/components/api-catalog";
import { loadPublishedContent } from "@/src/content/load-published";

export const metadata: Metadata = {
  title: "API & Tools Library",
  description:
    "Explore APIs and tools used in AI workflows — what each connects to, how authentication works, and which business use cases rely on them.",
  alternates: {
    canonical: "/apis",
  },
  openGraph: {
    title: "API & Tools Library",
    description:
      "APIs and tools for building practical AI workflows, with auth notes and related use cases.",
    url: "/apis",
  },
};

export default function ApisPage() {
  const { apis } = loadPublishedContent();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-4">
        <p className="font-mono text-xs text-muted">Reference · {apis.length} entries</p>
        <h1 className="mt-1 text-2xl font-bold">API Library</h1>
        <p className="mt-1 text-sm text-muted">
          What each API accesses, how to authenticate, and which workflows use it.
        </p>
        <p className="mt-2 text-xs text-muted">
          <Link href="/find-workflows" className="text-accent hover:underline">
            Use the tool matcher
          </Link>{" "}
          to select APIs you have and see matching workflows.
        </p>
      </header>
      <div className="mt-6">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
          <ApiCatalog />
        </Suspense>
      </div>
    </div>
  );
}
