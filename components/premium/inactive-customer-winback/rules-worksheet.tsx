"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_RULES_INPUT,
  generateWinbackRules,
  type WinbackRulesInput,
} from "@/src/lib/premium/inactive-customer-winback/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet() {
  const [values, setValues] = useState<WinbackRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof WinbackRulesInput>(
    field: K,
    value: WinbackRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateWinbackRules(values);
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
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
          <div>
            <label htmlFor={`${baseId}-lapse`} className={FIELD_LABEL}>
              Lapse if last visit before
            </label>
            <input
              id={`${baseId}-lapse`}
              type="text"
              value={values.lapseBefore}
              onChange={(event) => update("lapseBefore", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-vip`} className={FIELD_LABEL}>
              VIP if visits in 12 months at least
            </label>
            <input
              id={`${baseId}-vip`}
              type="text"
              inputMode="numeric"
              value={values.vipFloor}
              onChange={(event) => update("vipFloor", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label
              htmlFor={`${baseId}-skip-one-time`}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 ${FOCUS_RING}`}
            >
              <input
                id={`${baseId}-skip-one-time`}
                type="checkbox"
                checked={values.skipOneTime}
                onChange={(event) => update("skipOneTime", event.target.checked)}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              <span className="text-sm font-medium text-foreground">
                Skip one-time buyers
              </span>
            </label>
          </div>
          <div>
            <label htmlFor={`${baseId}-vip-offers`} className={FIELD_LABEL}>
              VIP offers (one per line)
            </label>
            <textarea
              id={`${baseId}-vip-offers`}
              rows={3}
              value={values.vipOffers}
              onChange={(event) => update("vipOffers", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-occasional-offers`} className={FIELD_LABEL}>
              Occasional offers (one per line)
            </label>
            <textarea
              id={`${baseId}-occasional-offers`}
              rows={3}
              value={values.occasionalOffers}
              onChange={(event) => update("occasionalOffers", event.target.value)}
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
            Generate My Winback Rules
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
            Your winback rules
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label="Copy" />
        </div>
      ) : null}
    </div>
  );
}
