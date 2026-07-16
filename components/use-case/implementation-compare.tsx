import type { UseCase } from "@/src/types";
import { DataTable } from "@/components/ui/detail";

export function ImplementationCompare({ useCase }: { useCase: UseCase }) {
  const maxRows = Math.max(
    useCase.noCodeTools.length,
    useCase.lowCodeTools.length,
    useCase.customBuildStack.length,
  );

  const rows: string[][] = [];
  for (let i = 0; i < maxRows; i++) {
    rows.push([
      useCase.noCodeTools[i] ?? "—",
      useCase.lowCodeTools[i] ?? "—",
      useCase.customBuildStack[i] ?? "—",
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <PathSummary
          title="No-code"
          effort="Lowest effort"
          bestFor="Non-technical owners, quick validation, under 50 runs/day"
          count={useCase.noCodeTools.length}
        />
        <PathSummary
          title="Low-code"
          effort="Medium effort"
          bestFor="Operators comfortable with Zapier/n8n, need more control"
          count={useCase.lowCodeTools.length}
        />
        <PathSummary
          title="Custom build"
          effort="Highest effort"
          bestFor="High volume, custom logic, or strict data privacy requirements"
          count={useCase.customBuildStack.length}
        />
      </div>

      {rows.length > 0 && (
        <DataTable
          headers={["No-code options", "Low-code options", "Custom build stack"]}
          rows={rows}
        />
      )}

      <p className="text-xs text-muted">
        Start with no-code to validate the workflow. Move to low-code when you
        hit rate limits or need branching logic. Custom build when volume,
        privacy, or integration depth requires it.
      </p>
    </div>
  );
}

function PathSummary({
  title,
  effort,
  bestFor,
  count,
}: {
  title: string;
  effort: string;
  bestFor: string;
  count: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-xs font-medium text-accent">{effort}</p>
      <p className="mt-2 text-xs text-muted">{bestFor}</p>
      <p className="mt-2 text-xs text-muted">{count} option{count !== 1 ? "s" : ""} listed</p>
    </div>
  );
}
