import Link from "next/link";
import { Fragment } from "react";
import { BulletList, DetailSection, NumberedList } from "@/components/ui/detail";
import type { UseCase } from "@/src/types";

export const BLUEPRINT_GUIDE_SECTIONS = [
  { id: "problem", label: "The business problem" },
  { id: "what-it-does", label: "What it does" },
  { id: "how-it-works", label: "How it works" },
  { id: "what-you-need", label: "What you need" },
  { id: "example", label: "Example output" },
  { id: "manual", label: "Try it manually" },
  { id: "automate", label: "Automate it" },
  { id: "get-started", label: "Get started" },
  { id: "technical", label: "Technical details" },
] as const;

/**
 * Plain-language walkthrough of a blueprint, written for a non-technical
 * owner. Technical requirements stay in the separate technical section.
 */
export function BlueprintGuide({ useCase }: { useCase: UseCase }) {
  const guide = useCase.blueprintGuide;
  if (!guide) return null;

  return (
    <div className="space-y-10">
      <DetailSection id="problem" title="The business problem">
        <p className="text-sm leading-relaxed text-muted">
          {guide.businessProblem.summary}
        </p>
        <p className="mt-5 text-sm font-medium text-foreground">
          {guide.businessProblem.goodFitHeading}
        </p>
        <div className="mt-3">
          <BulletList items={guide.businessProblem.goodFitIf} />
        </div>
        <div className="mt-5 rounded-lg bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Expected outcome
          </p>
          <p className="mt-1 text-sm">{useCase.outcome}</p>
        </div>
        <p className="mt-4 text-sm text-muted">
          <span className="font-medium text-foreground">Who it&apos;s for: </span>
          {useCase.whoItsFor}
        </p>
      </DetailSection>

      <DetailSection id="what-it-does" title="What the workflow does">
        <p className="text-sm leading-relaxed text-muted">
          {guide.whatItDoes.summary}
        </p>
        <div className="mt-4">
          <BulletList items={guide.whatItDoes.capabilities} />
        </div>

        <div className="mt-6 rounded-xl border border-border/60 bg-surface/60 p-5">
          <p className="text-sm leading-relaxed text-muted">
            {guide.whatItDoes.confidenceNote}
          </p>
          <dl className="mt-4 space-y-3">
            {guide.whatItDoes.confidenceLevels.map((level) => (
              <div key={level.label}>
                <dt className="text-sm font-semibold text-foreground">
                  {level.label}
                </dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-muted">
                  {level.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DetailSection>

      <DetailSection id="how-it-works" title="How it works">
        <FlowDiagram
          inputs={guide.howItWorks.inputs}
          stages={guide.howItWorks.stages}
        />
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {guide.howItWorks.note}
        </p>
      </DetailSection>

      <DetailSection id="what-you-need" title="What you need">
        <BulletList items={guide.whatYouNeed.items} />
        {guide.whatYouNeed.note && (
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {guide.whatYouNeed.note}
          </p>
        )}
      </DetailSection>

      <DetailSection id="example" title="Example output">
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-muted">
          {guide.exampleOutput.disclaimer}
        </p>
        <div className="mt-4 space-y-4">
          {guide.exampleOutput.findings.map((finding) => (
            <article
              key={finding.finding}
              className="rounded-xl border border-border/60 bg-card p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {finding.label}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {finding.finding}
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Why it matters
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {finding.whyItMatters}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    Recommended next action
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {finding.nextAction}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </DetailSection>

      <DetailSection id="manual" title="Try it manually">
        <p className="text-sm font-medium text-accent">
          {guide.manualApproach.effort}
        </p>
        <div className="mt-4">
          <NumberedList items={guide.manualApproach.steps} />
        </div>
        <p className="mt-5 rounded-lg border border-dashed border-border/60 px-4 py-3 text-sm text-muted">
          {guide.manualApproach.note}
        </p>
      </DetailSection>

      <DetailSection id="automate" title="Automate the workflow">
        <p className="text-sm font-medium text-accent">
          {guide.automatedApproach.effort}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {guide.automatedApproach.summary}
        </p>
        <div className="mt-4">
          <BulletList items={guide.automatedApproach.capabilities} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {guide.automatedApproach.note}
        </p>
      </DetailSection>

      <DetailSection id="get-started" title="Choose how you want to get started">
        <div className="grid gap-4 sm:grid-cols-3">
          {guide.gettingStarted.map((option) => (
            <div
              key={option.title}
              className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5"
            >
              <h3 className="text-base font-semibold">{option.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {option.description}
              </p>
              {option.href ? (
                <Link
                  href={option.href}
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {option.ctaLabel}
                </Link>
              ) : (
                <span className="mt-5 inline-flex items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-2 text-sm font-medium text-muted">
                  {option.ctaLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </DetailSection>
    </div>
  );
}

function FlowDiagram({
  inputs,
  stages,
}: {
  inputs: readonly string[];
  stages: readonly string[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-4 sm:p-5">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {inputs.map((input, index) => (
            <Fragment key={input}>
              {index > 0 && (
                <span
                  className="text-center text-sm font-medium text-muted"
                  aria-hidden="true"
                >
                  +
                </span>
              )}
              <span className="rounded-lg border border-border/60 bg-card px-3 py-2 text-center text-xs font-medium sm:text-left">
                {input}
              </span>
            </Fragment>
          ))}
        </div>

        {stages.map((stage, index) => (
          <Fragment key={stage}>
            <FlowArrow />
            <span
              className={`rounded-lg px-3 py-2 text-center text-xs font-medium sm:text-left ${
                index === stages.length - 1
                  ? "border border-accent/35 bg-accent/10 text-accent"
                  : "border border-border/60 bg-card"
              }`}
            >
              {stage}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <span
      className="flex shrink-0 items-center justify-center text-muted"
      aria-hidden="true"
    >
      <span className="sm:hidden">&darr;</span>
      <span className="hidden sm:inline">&rarr;</span>
    </span>
  );
}
