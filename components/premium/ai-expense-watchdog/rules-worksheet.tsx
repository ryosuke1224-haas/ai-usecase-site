"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { expenseCopy } from "@/src/lib/premium/ai-expense-watchdog/copy";
import {
  DEFAULT_RULES_INPUT,
  generateExpenseReviewRules,
  type ExpenseRulesInput,
} from "@/src/lib/premium/ai-expense-watchdog/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = locale === "ja" ? expenseCopy("ja") : null;
  const [values, setValues] = useState<ExpenseRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof ExpenseRulesInput>(
    field: K,
    value: ExpenseRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateExpenseReviewRules(values, locale);
    if (result.ok) {
      setErrors([]);
      setInputsChanged(false);
      setRules(result.rules);
    } else {
      setErrors(result.errors);
      setInputsChanged(false);
      setRules(null);
    }
  }

  const describedBy = errors.length > 0 ? errorId : undefined;

  return (
    <div className="space-y-5">
      <HydrationStatus hydrated={hydrated} />
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
          <div>
            <label htmlFor={`${baseId}-vendors`} className={FIELD_LABEL}>
              {copy?.vendorsLabel ?? "Essential vendors to never flag for cancel (one per line)"}
            </label>
            <textarea
              id={`${baseId}-vendors`}
              rows={3}
              value={values.essentialVendors}
              onChange={(event) => update("essentialVendors", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-overlap`} className={FIELD_LABEL}>
              {copy?.overlapWatchLabel ?? "Overlap-watch categories (one per line)"}
            </label>
            <textarea
              id={`${baseId}-overlap`}
              rows={3}
              value={values.overlapWatch}
              onChange={(event) => update("overlapWatch", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-minimum`} className={FIELD_LABEL}>
              {copy?.minimumAmountLabel ?? "Minimum amount to list as a price change (USD)"}
            </label>
            <input
              id={`${baseId}-minimum`}
              type="text"
              inputMode="decimal"
              value={values.minimumAmount}
              onChange={(event) => update("minimumAmount", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          {errors.length > 0 ? (
            <div id={errorId} role="alert" className="space-y-1">
              {errors.map((error) => (
                <p key={error} className="text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </p>
              ))}
            </div>
          ) : null}
          <button type="submit" className={PRIMARY_BUTTON}>
            {copy?.generateRules ?? "Generate My Expense Review Rules"}
          </button>
        </fieldset>
      </form>

      {inputsChanged ? (
        <p className="text-sm leading-relaxed text-foreground">
          {copy?.inputsChanged ?? "Inputs changed. Generate again before you copy the rules."}
        </p>
      ) : null}
      {rules ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {copy?.rulesTitle ?? "Your expense review rules"}
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton
            text={rules}
            label={copy?.copyRules ?? "Copy rules"}
            copiedLabel={copy?.copied}
            errorLabel={copy?.copyFailed}
          />
        </div>
      ) : null}
    </div>
  );
}
