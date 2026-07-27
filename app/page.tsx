import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoveryPrompts } from "@/components/discovery/discovery-prompts";
import { HomeDiscovery } from "@/components/discovery/home-discovery";
import { HomeHero } from "@/components/homepage/home-hero";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { HomeSection } from "@/components/homepage/home-section";
import { WhatYouCanBuild } from "@/components/homepage/what-you-can-build";
import { LibraryIndex } from "@/components/library-index";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
};

function DiscoveryFallback() {
  return <div className="h-64 animate-pulse rounded-xl bg-surface" />;
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      <HomeHero />

      <HomeSection
        id="workflow-finder"
        title="Find workflows that fit your business"
        description="Select the tools you already use and your type of business. We’ll show you relevant workflows, the data you likely already have, and anything else you may need."
      >
        <Suspense fallback={<DiscoveryFallback />}>
          <HomeDiscovery />
        </Suspense>
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Not sure where to start?</h3>
          <p className="mt-1 text-sm text-muted">
            Try one of these examples to see how the workflow finder works.
          </p>
          <div className="mt-3">
            <DiscoveryPrompts />
          </div>
        </div>
      </HomeSection>

      <HowItWorks />
      <WhatYouCanBuild />

      <HomeSection
        title="Explore the building blocks"
        description="Browse use cases, APIs, data sources, and workflow stacks individually."
      >
        <LibraryIndex />
      </HomeSection>
    </div>
  );
}
