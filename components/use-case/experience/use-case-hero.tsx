"use client";

import Link from "next/link";
import { type MouseEvent, useCallback, useRef } from "react";
import type { UseCaseExperience } from "@/src/types";
import { usePrefersReducedMotion, scrollToSection } from "./motion";
import {
  type ConceptDemoHandle,
  WorkflowConceptDemo,
} from "./workflow-concept-demo";

const DEMO_SECTION_ID = "concept-demo";
const WORKFLOW_SECTION_ID = "how-it-works";

/**
 * Client boundary because "Watch demo" replays the concept demo in place, which
 * needs shared state with it. Both actions remain real anchors so they still
 * navigate to their sections when JavaScript is unavailable.
 */
export function UseCaseHero({
  title,
  areaTitle,
  areaHref,
  processName,
  statusLabel,
  hero,
  demo,
}: {
  title: string;
  areaTitle?: string;
  areaHref?: string;
  processName?: string;
  statusLabel?: string;
  hero: UseCaseExperience["hero"];
  demo: UseCaseExperience["conceptDemo"];
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const demoRef = useRef<ConceptDemoHandle | null>(null);

  const smooth = !prefersReducedMotion;

  const handleWatchDemo = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      scrollToSection(DEMO_SECTION_ID, smooth);
      // Reduced motion keeps the static briefing; replaying would animate it.
      if (smooth) demoRef.current?.replay();
    },
    [smooth],
  );

  const handleSeeWorkflow = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      scrollToSection(WORKFLOW_SECTION_ID, smooth);
    },
    [smooth],
  );

  return (
    <section className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <li>
              <Link
                href="/use-cases"
                className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Use cases
              </Link>
            </li>
            {areaTitle && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  {areaHref ? (
                    <Link
                      href={areaHref}
                      className="hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      {areaTitle}
                    </Link>
                  ) : (
                    areaTitle
                  )}
                </li>
              </>
            )}
            {processName && (
              <>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground">
                  {processName}
                </li>
              </>
            )}
          </ol>
        </nav>

        {statusLabel && (
          <p className="mt-4">
            <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-medium capitalize text-accent">
              {statusLabel}
            </span>
          </p>
        )}

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-lg font-medium leading-snug text-foreground">
          {hero.headline}
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          {hero.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`#${DEMO_SECTION_ID}`}
            onClick={handleWatchDemo}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {hero.demoLabel}
          </a>
          <a
            href={`#${WORKFLOW_SECTION_ID}`}
            onClick={handleSeeWorkflow}
            className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {hero.workflowLabel}
          </a>
        </div>
      </div>

      <div id={DEMO_SECTION_ID} className="scroll-mt-24">
        <WorkflowConceptDemo demo={demo} ref={demoRef} />
      </div>
    </section>
  );
}
