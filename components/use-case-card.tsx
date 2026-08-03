"use client";

import Link from "next/link";
import type { UseCase } from "@/src/types";
import { ExperienceTile } from "./use-case/experience/experience-tile";
import { Badge } from "./ui/detail";

const valueStyles = {
  High: "success" as const,
  Medium: "warning" as const,
  Emerging: "info" as const,
};

const difficultyStyles = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "info" as const,
};

export function UseCaseCard({ useCase }: { useCase: UseCase }) {
  const outcome = useCase.businessOutcomes?.[0];

  // Opt-in animated tile; all other cards keep the existing layout.
  if (useCase.templateVersion === "experience-v2" && useCase.experience) {
    return (
      <ExperienceTile useCase={useCase} tile={useCase.experience.tile} />
    );
  }

  return (
    <Link
      href={`/use-cases/${useCase.slug}`}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge>{useCase.category}</Badge>
        <div className="flex gap-1.5">
          <Badge variant={difficultyStyles[useCase.difficulty]}>
            {useCase.difficulty}
          </Badge>
          <Badge variant={valueStyles[useCase.valuePotential]}>
            {useCase.valuePotential} value
          </Badge>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors">
        {useCase.title}
      </h3>
      {useCase.tagline && (
        <p className="mt-1 text-xs font-medium text-accent">{useCase.tagline}</p>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {useCase.summary}
      </p>

      {outcome && (
        <div className="mt-4 border-t border-border/40 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Business outcome
          </p>
          <p className="mt-1 text-xs text-foreground">{outcome}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {useCase.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded bg-surface px-2 py-0.5 text-xs text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-accent">
        View blueprint
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}
