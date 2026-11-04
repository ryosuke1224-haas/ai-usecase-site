"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  CheckFactsStep,
  EscalateFirstStep,
  FaqOnlyTimingStep,
  FaqToneAndMessageStep,
  MissingAnswersStep,
  YouSendItStep,
} from "./demo-steps";
import { FOCUS_RING, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const STEPS: { title: string; Content: ComponentType }[] = [
  { title: "The FAQ, tone sheet, and message", Content: FaqToneAndMessageStep },
  { title: "ESCALATE RULES FIRST", Content: EscalateFirstStep },
  { title: "FAQ-only timing", Content: FaqOnlyTimingStep },
  { title: "Check the facts", Content: CheckFactsStep },
  { title: "Missing answers stay labelled", Content: MissingAnswersStep },
  { title: "You send it", Content: YouSendItStep },
];

export function GuidedDemo() {
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedByUser = useRef(false);
  const hydrated = useHydrated();
  const total = STEPS.length;
  const { title, Content } = STEPS[index];

  useEffect(() => {
    if (movedByUser.current) headingRef.current?.focus();
  }, [index]);

  function goTo(next: number) {
    movedByUser.current = true;
    setIndex(Math.min(Math.max(next, 0), total - 1));
  }

  return (
    <section
      aria-label="Guided demo"
      className="min-w-0 overflow-x-clip rounded-2xl border border-border/60 bg-surface/50 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold text-foreground">
          Step {index + 1} of {total}
        </p>
        <HydrationStatus hydrated={hydrated} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => goTo(index - 1)}
            disabled={!hydrated || index === 0}
          >
            Previous step
          </button>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={() => goTo(index + 1)}
            disabled={!hydrated || index === total - 1}
          >
            Next step
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 grid grid-cols-6 gap-1">
        {STEPS.map((step, stepIndex) => (
          <span
            key={step.title}
            className={`h-1.5 rounded-full ${stepIndex <= index ? "bg-accent" : "bg-border"}`}
          />
        ))}
      </div>

      <div className="mt-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={`text-xl font-bold tracking-tight text-foreground sm:text-2xl ${FOCUS_RING}`}
        >
          {title}
        </h2>
        <div className="mt-4">
          <Content />
        </div>
      </div>
    </section>
  );
}
