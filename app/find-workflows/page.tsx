import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DiscoveryPrompts } from "@/components/discovery/discovery-prompts";
import { HomeDiscovery } from "@/components/discovery/home-discovery";

const TITLE = "Find Workflows by Tools";
const DESCRIPTION =
  "Already know which tools and data you use? Match them against the AI workflow library to see what you can build now and what is still missing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/find-workflows",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/find-workflows",
  },
};

function DiscoveryFallback() {
  return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
}

export default function FindWorkflowsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <header className="mb-6 border-b border-border/60 pb-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted sm:text-xs">
          Resource
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Find workflows by tools
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          For people who already know which tools and data they use. Pick the
          problem you want to improve, add your tools, and see which workflows
          you can build now and what is still missing.
        </p>
        <p className="mt-3 text-sm text-muted">
          Not sure where to start?{" "}
          <Link
            href="/business-areas"
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Browse by business area
          </Link>{" "}
          instead.
        </p>
      </header>

      <div className="mb-6">
        <h2 className="text-sm font-semibold">Quick ways to start</h2>
        <div className="mt-3">
          <DiscoveryPrompts />
        </div>
      </div>

      <Suspense fallback={<DiscoveryFallback />}>
        <HomeDiscovery />
      </Suspense>
    </div>
  );
}
