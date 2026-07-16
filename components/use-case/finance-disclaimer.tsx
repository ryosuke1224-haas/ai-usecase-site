import { FINANCE_PLANNING_DISCLAIMER } from "@/src/content/finance";

export function FinancePlanningDisclaimer() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
        Planning disclaimer
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {FINANCE_PLANNING_DISCLAIMER}
      </p>
    </div>
  );
}
