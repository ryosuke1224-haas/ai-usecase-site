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
      <HowItWorks />
      <WhatYouCanBuild />

      <HomeSection
        id="workflow-finder"
        title="Start with what you already have"
        description="Choose your tools, business type, or goal. We’ll show you matching AI workflows and what you may still need to add."
      >
        <Suspense fallback={<DiscoveryFallback />}>
          <HomeDiscovery />
        </Suspense>
      </HomeSection>

      <HomeSection
        title="Not sure where to start?"
        description="Try one of these examples to see how the workflow finder works."
      >
        <DiscoveryPrompts />
      </HomeSection>

      <HomeSection
        title="Explore the building blocks"
        description="Browse use cases, APIs, data sources, and workflow stacks individually."
      >
        <LibraryIndex />
      </HomeSection>
    </div>
  );
}
