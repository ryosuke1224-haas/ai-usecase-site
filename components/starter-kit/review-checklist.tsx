"use client";

import { useState } from "react";

const CHECKLIST_ITEMS = [
  "Are deadlines explicitly supported by the source?",
  "Are CONFIRMED FACT labels separated from AI INTERPRETATION?",
  "Were newsletters/FYI messages incorrectly prioritized?",
  "Are calendar conflicts real?",
  "Are email/calendar connections supported by evidence?",
  "Are the Top 3 actually the most important items?",
  "Did the AI invent any missing information?",
  "Is each RECOMMENDED ACTION reasonable?",
  "Is human approval required before any external action?",
] as const;

export function ReviewChecklist() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const completed = Object.values(checked).filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;

  function toggle(index: number) {
    setChecked((current) => ({
      ...current,
      [index]: !current[index],
    }));
  }

  function reset() {
    setChecked({});
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Checked {completed} of {total}. Progress stays in this browser session
          only.
        </p>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-accent hover:underline"
        >
          Reset checklist
        </button>
      </div>

      <ul className="space-y-2">
        {CHECKLIST_ITEMS.map((item, index) => {
          const isChecked = Boolean(checked[index]);
          return (
            <li key={item}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  isChecked
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-border/60 bg-card hover:border-accent/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(index)}
                  className="mt-1 size-4 rounded border-border accent-[var(--accent)]"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {completed === total ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
          Review complete. If anything looked weak, adjust your priority rules
          or prompt and regenerate before acting.
        </p>
      ) : null}
    </div>
  );
}
