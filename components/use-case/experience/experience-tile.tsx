"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { UseCase, UseCaseExperience } from "@/src/types";
import { usePrefersReducedMotion } from "./motion";

type Tile = UseCaseExperience["tile"];

/** Roughly six seconds total, ending on the result rather than looping. */
const SCENE_DURATIONS_MS = [2000, 1800, 2200] as const;
const TOTAL_MS = SCENE_DURATIONS_MS.reduce((sum, ms) => sum + ms, 0);
const TICK_MS = 100;

function sceneIndexFor(elapsed: number): number {
  let boundary = 0;
  for (let index = 0; index < SCENE_DURATIONS_MS.length; index += 1) {
    boundary += SCENE_DURATIONS_MS[index];
    if (elapsed < boundary) return index;
  }
  return SCENE_DURATIONS_MS.length - 1;
}

/**
 * Animated card for experience-led use cases. The entire card navigates to the
 * detail page through a single stretched link, so the two action links can sit
 * beside it without nesting anchors.
 */
export function ExperienceTile({
  useCase,
  tile,
}: {
  useCase: UseCase;
  tile: Tile;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(TOTAL_MS);
  const [isPlaying, setIsPlaying] = useState(false);
  const elapsedRef = useRef(TOTAL_MS);
  const hasPlayedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const animationEnabled = !prefersReducedMotion;
  const lastSceneIndex = tile.scenes.length - 1;

  // Plays a single pass the first time the card scrolls into view. It never
  // loops, so a grid of cards stays calm to read.
  useEffect(() => {
    if (!animationEnabled) return;

    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasPlayedRef.current) return;
        hasPlayedRef.current = true;
        elapsedRef.current = 0;
        setElapsed(0);
        setIsPlaying(true);
      },
      { threshold: 0.5 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [animationEnabled]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      const next = Math.min(elapsedRef.current + TICK_MS, TOTAL_MS);
      elapsedRef.current = next;
      setElapsed(next);

      if (next >= TOTAL_MS) {
        window.clearInterval(timer);
        setIsPlaying(false);
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const sceneIndex = animationEnabled ? sceneIndexFor(elapsed) : lastSceneIndex;
  const finalScene = tile.scenes[lastSceneIndex];
  const href = `/use-cases/${useCase.slug}`;

  return (
    <div
      ref={cardRef}
      className="group relative flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      <Link
        href={href}
        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        <span className="sr-only">{useCase.title}</span>
      </Link>

      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-md bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
          Interactive preview
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
        {useCase.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{tile.headline}</p>

      {/*
        Decorative for assistive tech; the sr-only summary below carries the
        result. Every scene stays in the layout and is toggled with visibility,
        so the card keeps a stable height inside a grid of cards.
      */}
      <div
        aria-hidden="true"
        className="mt-4 grid rounded-xl border border-border/60 bg-surface/60 px-4 py-4"
      >
        {tile.scenes.map((sceneItem, index) => (
          <div
            key={sceneItem.caption}
            className={`col-start-1 row-start-1 ${
              index === sceneIndex ? "" : "invisible"
            }`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
              {sceneItem.caption}
            </p>
            {sceneItem.metrics.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                {sceneItem.metrics.map((metric) => (
                  <p key={metric.label} className="text-sm">
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {metric.value}
                    </span>{" "}
                    <span className="text-muted">{metric.label}</span>
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                    style={{ animationDelay: `${dot * 160}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="sr-only">
        {finalScene.caption}:{" "}
        {finalScene.metrics
          .map((metric) => `${metric.value} ${metric.label}`)
          .join(", ")}
        .
      </p>

      <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-5">
        <Link
          href={`${href}#concept-demo`}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {tile.demoLabel}
        </Link>
        <Link
          href={`${href}#how-it-works`}
          className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {tile.workflowLabel}
        </Link>
      </div>
    </div>
  );
}
