"use client";

import type { WorkflowIdea } from "@/src/types";
import { Badge, BulletList } from "./ui/detail";
import { useContentResolver } from "@/src/content/content-context";

const difficultyVariant = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "info" as const,
};

export function WorkflowIdeaCard({ idea }: { idea: WorkflowIdea }) {
  const { resolveApiName, resolveDataSourceName, resolveUseCaseTitle } =
    useContentResolver();

  return (
    <article className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 lg:p-8">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="accent">API Combination</Badge>
        <Badge variant={difficultyVariant[idea.implementationDifficulty]}>
          {idea.implementationDifficulty}
        </Badge>
      </div>

      <h3 className="mt-4 text-xl font-semibold tracking-tight">{idea.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{idea.summary}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            API stack
          </p>
          <ul className="mt-2 space-y-1">
            {idea.apiCombination.map((slug) => (
              <li key={slug}>
                <a href={`/apis/${slug}`} className="text-sm font-medium text-accent hover:underline">
                  {resolveApiName(slug)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Data sources
          </p>
          <ul className="mt-2 space-y-1">
            {idea.dataSources.map((slug) => (
              <li key={slug}>
                <a href={`/data-sources/${slug}`} className="text-sm text-muted hover:text-accent">
                  {resolveDataSourceName(slug)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Unlocks these use cases
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {idea.possibleUseCases.map((slug) => (
            <a
              key={slug}
              href={`/use-cases/${slug}`}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent"
            >
              {resolveUseCaseTitle(slug)}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Example workflow
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{idea.exampleWorkflow}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Business value
          </p>
          <p className="mt-2 text-sm text-muted">{idea.businessValue}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Recommended for
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {idea.recommendedFor.map((r) => (
              <Badge key={r}>{r}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border/40 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Risks</p>
        <div className="mt-2">
          <BulletList items={idea.risks} />
        </div>
      </div>
    </article>
  );
}
