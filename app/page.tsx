import { Suspense } from "react";
import { DiscoveryPrompts } from "@/components/discovery/discovery-prompts";
import { HomeDiscovery } from "@/components/discovery/home-discovery";
import { LibraryIndex } from "@/components/library-index";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="border-b border-border/60 pb-6">
        <p className="font-mono text-xs text-muted">SMB AI Workflow Reference</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          AI Use Case Hub
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Look up what to connect, what data to feed the AI, and which build path
          fits your tools. Start with a question below.
        </p>
        <div className="mt-4">
          <DiscoveryPrompts />
        </div>
      </header>

      <div className="mt-8 space-y-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-surface" />}>
          <HomeDiscovery />
        </Suspense>
        <LibraryIndex />
      </div>
    </div>
  );
}
