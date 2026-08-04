import type { ReactNode } from "react";
import type { UseCaseExperience } from "@/src/types";
import { getSetupPreviewUrl } from "@/src/lib/offers";

/**
 * Shared section shell for the experience-led template. Keeps heading level,
 * scroll offset, and vertical rhythm consistent across every section.
 */
export function ExperienceSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="max-w-3xl text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {heading}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function OutcomeStrip({
  outcomes,
}: {
  outcomes: UseCaseExperience["outcomes"];
}) {
  return (
    <section
      aria-label="Typical briefing outcome"
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
    >
      <dl className="grid gap-4 sm:grid-cols-3">
        {outcomes.metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl bg-surface/70 px-5 py-5 text-center"
          >
            <dd className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {metric.value}
            </dd>
            <dt className="mt-1 text-sm text-muted">{metric.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-sm leading-relaxed text-muted">
        {outcomes.supporting}
      </p>
    </section>
  );
}

export function WorkflowSteps({
  workflow,
}: {
  workflow: UseCaseExperience["workflow"];
}) {
  return (
    <ExperienceSection id="how-it-works" heading={workflow.heading}>
      <ol className="grid gap-4 sm:grid-cols-3">
        {workflow.steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {index + 1}
            </span>
            <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl border border-border/60 bg-surface/60 px-5 py-4 text-sm leading-relaxed text-muted">
        <span className="font-medium text-foreground">Read-only by default: </span>
        {workflow.note}
      </p>
    </ExperienceSection>
  );
}

export function AiHumanSplit({
  responsibilities,
}: {
  responsibilities: UseCaseExperience["responsibilities"];
}) {
  const columns = [responsibilities.ai, responsibilities.human];

  return (
    <ExperienceSection id="responsibilities" heading={responsibilities.heading}>
      <div className="grid gap-4 md:grid-cols-2">
        {columns.map((column) => (
          <div
            key={column.heading}
            className="rounded-2xl border border-border/60 bg-card p-6"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {column.heading}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {column.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ExperienceSection>
  );
}

export function LearningObjectives({
  learning,
}: {
  learning: UseCaseExperience["learning"];
}) {
  return (
    <ExperienceSection id="what-you-learn" heading={learning.heading}>
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {learning.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-foreground"
            >
              <span aria-hidden="true" className="mt-0.5 text-accent">
                &#10003;
              </span>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-border/40 pt-5 text-sm leading-relaxed text-muted">
          {learning.supporting}
        </p>
      </div>
    </ExperienceSection>
  );
}

export function SetupPreview({
  setup,
}: {
  setup: UseCaseExperience["setup"];
}) {
  const previewUrl = getSetupPreviewUrl();

  return (
    <ExperienceSection id="setup" heading={setup.heading}>
      {/* Interactive walkthrough embed replaces the CTA row below when ready. */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <ol className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {setup.steps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-2.5 rounded-xl bg-surface/60 px-3 py-3 text-sm text-foreground lg:flex-col lg:gap-2"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card text-xs font-bold text-muted">
                {index + 1}
              </span>
              <span className="leading-snug lg:text-xs">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/40 pt-4">
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {setup.ctaLabel}
            </a>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-semibold text-muted opacity-70"
              >
                {setup.ctaLabel}
              </button>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Coming soon
              </span>
            </>
          )}
        </div>
      </div>
    </ExperienceSection>
  );
}

export function SafetySection({
  safety,
}: {
  safety: UseCaseExperience["safety"];
}) {
  return (
    <ExperienceSection id="safety" heading={safety.heading}>
      <ul className="grid gap-2.5 rounded-2xl border border-border/60 bg-surface/50 p-6 sm:grid-cols-2 sm:p-8">
        {safety.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-foreground"
          >
            <span aria-hidden="true" className="mt-0.5 text-accent">
              &#10003;
            </span>
            {item}
          </li>
        ))}
      </ul>
    </ExperienceSection>
  );
}
