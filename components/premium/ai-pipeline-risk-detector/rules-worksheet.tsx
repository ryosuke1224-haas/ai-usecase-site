"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_RULES_INPUT,
  generateStallRules,
  type StallRulesInput,
} from "@/src/lib/premium/ai-pipeline-risk-detector/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet() {
  const [values, setValues] = useState<StallRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof StallRulesInput>(
    field: K,
    value: StallRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateStallRules(values);
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
            <label htmlFor={`${baseId}-stage`} className={FIELD_LABEL}>
              Days in stage limit
            </label>
            <input
              id={`${baseId}-stage`}
              type="text"
              inputMode="numeric"
              value={values.daysInStageLimit}
              onChange={(event) => update("daysInStageLimit", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-activity`} className={FIELD_LABEL}>
              Days since activity limit
            </label>
            <input
              id={`${baseId}-activity`}
              type="text"
              inputMode="numeric"
              value={values.daysSinceActivityLimit}
              onChange={(event) =>
                update("daysSinceActivityLimit", event.target.value)
              }
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-minimum`} className={FIELD_LABEL}>
              Owner minimum amount (USD)
            </label>
            <input
              id={`${baseId}-minimum`}
              type="text"
              inputMode="decimal"
              value={values.ownerMinimum}
              onChange={(event) => update("ownerMinimum", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-never-chase`} className={FIELD_LABEL}>
              Statuses that are never chased (one per line)
            </label>
            <textarea
              id={`${baseId}-never-chase`}
              rows={3}
              value={values.neverChaseStatuses}
              onChange={(event) => update("neverChaseStatuses", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-always-skip`} className={FIELD_LABEL}>
              Deals to always skip (one per line)
            </label>
            <textarea
              id={`${baseId}-always-skip`}
              rows={3}
              value={values.alwaysSkip}
              onChange={(event) => update("alwaysSkip", event.target.value)}
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
            Generate My Stall Rules
          </button>
        </fieldset>
      </form>

      {inputsChanged ? (
        <p className="text-sm leading-relaxed text-foreground">
          Inputs changed. Generate again before you copy the rules.
        </p>
      ) : null}
      {rules ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Your stall rules
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label="Copy rules" />
        </div>
      ) : null}
    </div>
  );
}
