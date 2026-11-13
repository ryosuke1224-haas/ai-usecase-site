"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { payrollCopy } from "@/src/lib/premium/ai-payroll-forecasting/copy";
import {
  DEFAULT_RULES_INPUT,
  generateLaborCheckRules,
  type LaborRulesInput,
} from "@/src/lib/premium/ai-payroll-forecasting/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = locale === "ja" ? payrollCopy("ja") : null;
  const [values, setValues] = useState<LaborRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof LaborRulesInput>(
    field: K,
    value: LaborRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateLaborCheckRules(values, locale);
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
            <label htmlFor={`${baseId}-load`} className={FIELD_LABEL}>
              {copy?.loadFactorLabel ?? "Employer load factor"}
            </label>
            <input
              id={`${baseId}-load`}
              type="text"
              inputMode="decimal"
              value={values.loadFactor}
              onChange={(event) => update("loadFactor", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-target`} className={FIELD_LABEL}>
              {copy?.targetLaborLabel ?? "Target labor % of revenue"}
            </label>
            <input
              id={`${baseId}-target`}
              type="text"
              inputMode="decimal"
              value={values.targetLabor}
              onChange={(event) => update("targetLabor", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-ot-mult`} className={FIELD_LABEL}>
              {copy?.overtimeMultiplierLabel ?? "Overtime multiplier"}
            </label>
            <input
              id={`${baseId}-ot-mult`}
              type="text"
              inputMode="decimal"
              value={values.overtimeMultiplier}
              onChange={(event) => update("overtimeMultiplier", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-ot-rule`} className={FIELD_LABEL}>
              {copy?.overtimeFlagRuleLabel ?? "Overtime flag rule"}
            </label>
            <input
              id={`${baseId}-ot-rule`}
              type="text"
              value={values.overtimeFlagRule}
              onChange={(event) => update("overtimeFlagRule", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-coverage`} className={FIELD_LABEL}>
              {copy?.minimumCoverageLabel ?? "Minimum coverage by role (optional, one per line)"}
            </label>
            <textarea
              id={`${baseId}-coverage`}
              rows={3}
              value={values.minimumCoverage}
              onChange={(event) => update("minimumCoverage", event.target.value)}
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
            {copy?.generateRules ?? "Generate My Labor Check Rules"}
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
            {copy?.rulesTitle ?? "Your labor check rules"}
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton
            text={rules}
            label={copy?.copyRules ?? "Copy"}
            copiedLabel={copy?.copied}
            errorLabel={copy?.copyFailed}
          />
        </div>
      ) : null}
    </div>
  );
}
