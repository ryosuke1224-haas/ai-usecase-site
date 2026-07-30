import Link from "next/link";
import { Badge } from "@/components/ui/detail";
import type { UseCase } from "@/src/types";

const difficultyStyles = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "info" as const,
};

/**
 * Business-first workflow card for /business-areas browsing.
 * Deliberately shows no APIs, providers, or integration requirements —
 * those belong on the blueprint page.
 */
export function WorkflowCard({
  useCase,
  alsoRelevantTo = [],
}: {
  useCase: UseCase;
  /** Other processes in the same area this workflow supports. */
  alsoRelevantTo?: string[];
}) {
  const outcome = useCase.businessOutcomes?.[0];

  return (
    <Link
      href={`/use-cases/${useCase.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
        {useCase.title}
      </h3>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            What it does
          </p>
          <p className="mt-1 leading-relaxed text-foreground">
            {useCase.summary}
          </p>
        </div>

        {outcome && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Business outcome
            </p>
            <p className="mt-1 leading-relaxed text-muted">{outcome}</p>
          </div>
        )}
      </div>

      {alsoRelevantTo.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            Also relevant to
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {alsoRelevantTo.map((process) => (
              <span
                key={process}
                className="rounded bg-surface px-2 py-0.5 text-xs text-muted"
              >
                {process}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="inline-flex items-center gap-2 text-xs text-muted">
          Difficulty
          <Badge variant={difficultyStyles[useCase.difficulty]}>
            {useCase.difficulty}
          </Badge>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
          View blueprint
          <span className="transition-transform group-hover:translate-x-0.5">
            &rarr;
          </span>
        </span>
      </div>
    </Link>
  );
}
