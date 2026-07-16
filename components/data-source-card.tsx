import Link from "next/link";
import type { DataSource } from "@/src/types";
import { Badge } from "./ui/detail";

const privacyVariant = {
  Public: "success" as const,
  Internal: "default" as const,
  Sensitive: "warning" as const,
  PII: "info" as const,
};

export function DataSourceCard({ dataSource }: { dataSource: DataSource }) {
  return (
    <Link
      href={`/data-sources/${dataSource.slug}`}
      className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="flex items-start justify-between gap-3">
        <Badge>{dataSource.category}</Badge>
        <Badge variant={privacyVariant[dataSource.privacyLevel]}>
          {dataSource.privacyLevel}
        </Badge>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-accent transition-colors">
        {dataSource.name}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        {dataSource.summary}
      </p>

      <div className="mt-4 border-t border-border/40 pt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          What AI can do
        </p>
        <p className="mt-1 text-xs text-foreground line-clamp-2">
          {dataSource.whatAiCanDoWithIt[0]}
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        {dataSource.relatedUseCases.length} related use cases
      </p>

      <span className="mt-5 text-sm font-medium text-accent">
        View data source →
      </span>
    </Link>
  );
}
