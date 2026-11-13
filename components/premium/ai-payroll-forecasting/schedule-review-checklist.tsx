"use client";

import { useState } from "react";
import { REVIEW_CHECKLIST_ITEMS } from "@/src/lib/premium/ai-payroll-forecasting/kit-content";
import { FOCUS_RING, SECONDARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

type ScheduleReviewChecklistProps = {
  items?: readonly string[];
  checkedLabel?: string;
  resetLabel?: string;
  completeLabel?: string;
};

export function ScheduleReviewChecklist({
  items = REVIEW_CHECKLIST_ITEMS,
  checkedLabel = "Checked {done} of {total}",
  resetLabel = "Reset checklist",
  completeLabel =
    "Review complete for this run. Reset the checklist before you review the next period. You still choose whether any schedule edit happens in your own tool.",
}: ScheduleReviewChecklistProps = {}) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const hydrated = useHydrated();
  const completed = checked.filter(Boolean).length;
  const total = items.length;

  function toggle(index: number) {
    setChecked((current) =>
      current.map((value, itemIndex) => (itemIndex === index ? !value : value)),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-medium text-foreground">
          {checkedLabel.replaceAll("{done}", String(completed)).replaceAll("{total}", String(total))}
        </p>
        <button
          type="button"
          onClick={() => setChecked(items.map(() => false))}
          disabled={!hydrated}
          className={SECONDARY_BUTTON}
        >
          {resetLabel}
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={item}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                checked[index]
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-border/60 bg-card hover:border-accent/30"
              }`}
            >
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() => toggle(index)}
                disabled={!hydrated}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              <span className="text-sm leading-relaxed text-foreground">{item}</span>
            </label>
          </li>
        ))}
      </ul>
      {completed === total ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          {completeLabel}
        </p>
      ) : null}
    </div>
  );
}
