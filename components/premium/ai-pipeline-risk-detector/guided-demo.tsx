"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { pipelineCopy } from "@/src/lib/premium/ai-pipeline-risk-detector/copy";
import {
  CheckNumbersStep,
  ExportStep,
  NextWeekLogStep,
  RankedQueueStep,
  SkipRulesStep,
  YouSendItStep,
} from "./demo-steps";
import {
  JaCheckNumbersStep,
  JaExportStep,
  JaNextWeekLogStep,
  JaRankedQueueStep,
  JaSkipRulesStep,
  JaYouSendItStep,
} from "./ja-demo-steps";
import { FOCUS_RING, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const ENGLISH_STEPS: ComponentType[] = [
  ExportStep,
  SkipRulesStep,
  RankedQueueStep,
  CheckNumbersStep,
  NextWeekLogStep,
  YouSendItStep,
];

export function GuidedDemo({
  locale = "en",
  pathLocale = null,
}: {
  locale?: UiLocale;
  pathLocale?: UiLocale | null;
}) {
  const copy = pipelineCopy(locale);
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const movedByUser = useRef(false);
  const hydrated = useHydrated();
  const total = ENGLISH_STEPS.length;
  const title = copy.stepTitles[index] ?? "";
  const EnglishStep = ENGLISH_STEPS[index] ?? ExportStep;

  useEffect(() => {
    if (movedByUser.current) headingRef.current?.focus();
  }, [index]);

  function goTo(next: number) {
    movedByUser.current = true;
    setIndex(Math.min(Math.max(next, 0), total - 1));
  }

  return (
    <section
      aria-label={copy.demoAria}
      className="min-w-0 overflow-x-clip rounded-2xl border border-border/60 bg-surface/50 p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-semibold text-foreground">
          {copy.stepLabel(index + 1, total)}
        </p>
        <HydrationStatus hydrated={hydrated} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={SECONDARY_BUTTON}
            onClick={() => goTo(index - 1)}
            disabled={!hydrated || index === 0}
          >
            {copy.previousStep}
          </button>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={() => goTo(index + 1)}
            disabled={!hydrated || index === total - 1}
          >
            {copy.nextStep}
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 grid grid-cols-6 gap-1">
        {copy.stepTitles.map((stepTitle, stepIndex) => (
          <span
            key={stepTitle}
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
          {locale === "ja" ? (
            <JapaneseStep index={index} pathLocale={pathLocale ?? "ja"} />
          ) : (
            <EnglishStep />
          )}
        </div>
      </div>
    </section>
  );
}

function JapaneseStep({ index, pathLocale }: { index: number; pathLocale: UiLocale | null }) {
  if (index === 1) return <JaSkipRulesStep />;
  if (index === 2) return <JaRankedQueueStep />;
  if (index === 3) return <JaCheckNumbersStep />;
  if (index === 4) return <JaNextWeekLogStep />;
  if (index === 5) return <JaYouSendItStep pathLocale={pathLocale} />;
  return <JaExportStep />;
}
