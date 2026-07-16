import Link from "next/link";
import type { Api } from "@/src/types";
import { Badge } from "./ui/detail";

const difficultyVariant = {
  Beginner: "success" as const,
  Intermediate: "warning" as const,
  Advanced: "info" as const,
};

export function ApiCard({ api }: { api: Api }) {
  return (
    <Link
      href={`/apis/${api.slug}`}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge>{api.category}</Badge>
        <Badge variant={difficultyVariant[api.difficulty]}>{api.difficulty}</Badge>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">
        {api.name}
      </h3>
      <p className="text-xs text-muted">{api.provider}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{api.summary}</p>

      <div className="mt-4 border-t border-border/40 pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Auth</p>
        <p className="mt-1 text-xs text-foreground">{api.authenticationType}</p>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">Common use cases</p>
        <p className="mt-1 text-xs text-foreground">
          {api.commonUseCases.length} linked workflows
        </p>
      </div>

      <span className="mt-5 text-sm font-medium text-accent">
        View API details →
      </span>
    </Link>
  );
}
