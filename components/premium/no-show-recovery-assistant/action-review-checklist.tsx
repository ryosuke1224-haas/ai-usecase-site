"use client";

import { useState } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import { FOCUS_RING, SECONDARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

export function ActionReviewChecklist({ locale = "en" }: { locale?: UiLocale }) {
  const copy = noShowCopy(locale);
  const items = copy.reviewItems;
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const hydrated = useHydrated();
  const completed = checked.filter(Boolean).length;
  const total = items.length;

  function toggle(index: number) {
    setChecked((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-medium text-foreground">
          {copy.checkedLabel(completed, total)}
        </p>
        <button
          type="button"
          onClick={() => setChecked(items.map(() => false))}
          disabled={!hydrated}
          className={SECONDARY_BUTTON}
        >
          {copy.resetChecklist}
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
          {copy.reviewComplete}
        </p>
      ) : null}
    </div>
  );
}
