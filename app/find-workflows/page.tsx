import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryPrompts } from "@/components/discovery/discovery-prompts";
import { HomeDiscovery } from "@/components/discovery/home-discovery";

export const metadata: Metadata = {
  title: "Find AI Workflows",
  description:
    "Start with the business problem you want to solve, then optionally add your business type, tools, and data to discover matching AI workflows.",
  alternates: {
    canonical: "/find-workflows",
  },
  openGraph: {
    title: "Find AI Workflows",
    description:
      "Start with the business problem you want to solve, then optionally add your business type, tools, and data to discover matching AI workflows.",
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Find workflows that fit your business
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          Start with the business problem you want to improve. Then choose your
          business type and optionally add the tools and data you already have.
          We&apos;ll recommend practical AI workflows, show what you can build
          now, and explain what is still missing.
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
