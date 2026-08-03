"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { RefObject } from "react";
import type { UseCaseExperience } from "@/src/types";
import { usePrefersReducedMotion } from "./motion";

type ConceptDemo = UseCaseExperience["conceptDemo"];

/**
 * Scene boundaries in milliseconds. The whole sequence is derived from a single
 * elapsed counter, so pausing, resuming, and replaying need no extra state and
 * only one timer has to be cleaned up.
 */
const SCENES = [
  { label: "Inputs", endsAt: 4000 },
  { label: "AI processing", endsAt: 9000 },
  { label: "Summary", endsAt: 12000 },
  { label: "Completed briefing", endsAt: 20000 },
] as const;

const TOTAL_MS: number = SCENES[SCENES.length - 1].endsAt;
const TICK_MS = 100;
const PROCESSING_STEP_MS = 1150;
const EMPHASIS_AT_MS = 5000;

const priorityLabels: Record<string, string> = {
  high: "Urgent",
  normal: "Normal",
  low: "Low",
};

function sceneIndexFor(elapsed: number): number {
  const index = SCENES.findIndex((scene) => elapsed < scene.endsAt);
  return index === -1 ? SCENES.length - 1 : index;
}

/**
 * All scenes stay in the layout and are toggled with visibility, so the frame
 * is always as tall as its tallest scene and never jumps mid-sequence.
 * Hidden scenes are also skipped by assistive technology.
 */
function Scene({
  active,
  className,
  children,
}: {
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden={!active}
      className={`col-start-1 row-start-1 ${active ? "" : "invisible"} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export type ConceptDemoHandle = { replay: () => void };

export function WorkflowConceptDemo({
  demo,
  className,
  ref,
}: {
  demo: ConceptDemo;
  className?: string;
  /** Exposes replay() so a sibling control, such as the hero button, can restart it. */
  ref?: RefObject<ConceptDemoHandle | null>;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // Starts at the end so the server render and first paint show the finished
  // briefing rather than an empty frame.
  const [elapsed, setElapsed] = useState(TOTAL_MS);
  const [isPlaying, setIsPlaying] = useState(false);
  const elapsedRef = useRef(TOTAL_MS);
  const hasAutoPlayedRef = useRef(false);
  const userPausedRef = useRef(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const animationEnabled = !prefersReducedMotion;

  const restart = useCallback(() => {
    hasAutoPlayedRef.current = true;
    userPausedRef.current = false;
    elapsedRef.current = 0;
    setElapsed(0);
    setIsPlaying(true);
  }, []);

  useImperativeHandle(ref, () => ({ replay: restart }), [restart]);

  // Autoplays once on first view, pauses while off-screen, and resumes an
  // unfinished sequence on return unless the viewer paused it deliberately.
  useEffect(() => {
    if (!animationEnabled) return;

    const frame = frameRef.current;
    if (!frame) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsPlaying(false);
          return;
        }
        if (!hasAutoPlayedRef.current) {
          restart();
        } else if (!userPausedRef.current && elapsedRef.current < TOTAL_MS) {
          setIsPlaying(true);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(frame);
    return () => observer.disconnect();
  }, [animationEnabled, restart]);

  // Single interval drives the whole sequence and stops itself at the end, so
  // it never loops and is always cleared on unmount or pause.
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

  const togglePlayback = useCallback(() => {
    if (elapsedRef.current >= TOTAL_MS) {
      restart();
      return;
    }
    setIsPlaying((playing) => {
      userPausedRef.current = playing;
      return !playing;
    });
  }, [restart]);

  const isFinished = elapsed >= TOTAL_MS;
  const sceneIndex = animationEnabled ? sceneIndexFor(elapsed) : SCENES.length - 1;
  const scene = SCENES[sceneIndex];
  const emphasizeInputs = animationEnabled && elapsed >= EMPHASIS_AT_MS;
  const revealedSteps = animationEnabled
    ? Math.max(
        0,
        Math.min(
          demo.processingSteps.length,
          Math.floor((elapsed - SCENES[0].endsAt) / PROCESSING_STEP_MS) + 1,
        ),
      )
    : demo.processingSteps.length;

  return (
    <figure className={className}>
      <div
        ref={frameRef}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border/60 bg-surface px-4 py-2.5">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-muted">
            Workflow concept demo
          </p>
          <p className="text-[11px] font-medium text-muted">
            Step {sceneIndex + 1} of {SCENES.length} &middot; {scene.label}
          </p>
        </div>

        <div className="grid px-4 py-5 sm:px-5">
          <Scene active={sceneIndex <= 1}>
            <InputsScene
              demo={demo}
              emphasize={emphasizeInputs}
              revealedSteps={sceneIndex === 1 ? revealedSteps : 0}
            />
          </Scene>
          <Scene active={sceneIndex === 2} className="flex flex-col justify-center">
            <SummaryScene metrics={demo.summary} />
          </Scene>
          <Scene active={sceneIndex === 3}>
            <BriefingScene briefing={demo.briefing} />
          </Scene>
        </div>

        {animationEnabled && (
          <div className="flex items-center gap-2 border-t border-border/60 bg-surface px-4 py-2.5">
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={
                isFinished
                  ? "Replay the workflow concept demo"
                  : isPlaying
                    ? "Pause the workflow concept demo"
                    : "Play the workflow concept demo"
              }
              className="rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {isFinished ? "Replay" : isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={restart}
              aria-label="Restart the workflow concept demo from the beginning"
              className="rounded-md px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Start over
            </button>
            <span
              aria-hidden="true"
              className="ml-auto h-1 w-24 overflow-hidden rounded-full bg-border/60"
            >
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-100 ease-linear"
                style={{ width: `${(elapsed / TOTAL_MS) * 100}%` }}
              />
            </span>
          </div>
        )}
      </div>

      <figcaption className="mt-2 text-xs text-muted">
        Illustrative sample using fictional messages and meetings. Not real
        inbox or calendar data.
      </figcaption>
    </figure>
  );
}

function InputsScene({
  demo,
  emphasize,
  revealedSteps,
}: {
  demo: ConceptDemo;
  emphasize: boolean;
  revealedSteps: number;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {demo.inputs.metrics.map((metric) => (
          <p key={metric.label} className="text-sm">
            <span className="text-lg font-bold tracking-tight">
              {metric.value}
            </span>{" "}
            <span className="text-muted">{metric.label}</span>
          </p>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Inbox
          </p>
          <ul className="mt-2 space-y-1.5">
            {demo.inputs.emails.map((email) => {
              const isImportant = email.priority === "high";
              const isLow = email.priority === "low";
              return (
                <li
                  key={email.subject}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-all duration-500 ${
                    emphasize && isImportant
                      ? "border-accent/40 bg-accent/5 font-medium text-foreground"
                      : "border-border/60 bg-surface/60 text-muted"
                  } ${emphasize && isLow ? "opacity-50" : "opacity-100"}`}
                >
                  <span>{email.subject}</span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted">
                    {priorityLabels[email.priority]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Today&apos;s calendar
          </p>
          <ul className="mt-2 space-y-1.5">
            {demo.inputs.events.map((event) => (
              <li
                key={`${event.time}-${event.title}`}
                className={`rounded-lg border px-3 py-2 text-xs transition-all duration-500 ${
                  emphasize && event.conflict
                    ? "border-amber-500/40 bg-amber-500/5 text-foreground"
                    : "border-border/60 bg-surface/60 text-muted"
                }`}
              >
                <span className="font-mono text-[11px]">{event.time}</span>{" "}
                <span>{event.title}</span>
                <span
                  className={`ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 ${
                    emphasize && event.conflict ? "" : "invisible"
                  }`}
                >
                  Conflict
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Always rendered so revealing steps does not change the frame height. */}
      <ul className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
        {demo.processingSteps.map((step, index) => {
          const revealed = index < revealedSteps;
          const isCurrent = index === revealedSteps - 1;
          return (
            <li
              key={step}
              aria-hidden={!revealed}
              className={`flex items-center gap-2 text-xs text-foreground ${
                revealed ? "" : "invisible"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                  isCurrent
                    ? "animate-pulse bg-accent/20 text-accent"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {isCurrent ? "\u2022" : "\u2713"}
              </span>
              {step}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SummaryScene({ metrics }: { metrics: ConceptDemo["summary"] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
        What the briefing found
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-border/60 bg-surface/60 px-4 py-5 text-center"
          >
            <dd className="text-3xl font-bold tracking-tight text-foreground">
              {metric.value}
            </dd>
            <dt className="mt-1 text-xs text-muted">{metric.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function BriefingScene({ briefing }: { briefing: ConceptDemo["briefing"] }) {
  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-accent">
        {briefing.title}
      </p>
      <ul className="mt-3 space-y-2.5">
        {briefing.groups.map((group) => (
          <li
            key={group.label}
            className="rounded-lg border border-border/60 bg-surface/50 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {group.label}
            </p>
            {group.items.map((item) => (
              <div key={item.title} className="mt-1">
                <p className="text-xs font-medium text-foreground">
                  {item.title}
                </p>
                {item.meta && (
                  <p className="text-[11px] text-muted">{item.meta}</p>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <span aria-hidden="true">&#10003;</span>
        {briefing.status}
      </p>
    </div>
  );
}
