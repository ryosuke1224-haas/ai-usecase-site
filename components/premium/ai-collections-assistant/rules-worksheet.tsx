"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_RULES_INPUT,
  generateCollectionsRules,
  type RulesInput,
} from "@/src/lib/premium/ai-collections-assistant/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet() {
  const [values, setValues] = useState<RulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update(field: keyof RulesInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateCollectionsRules(values);
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor={`${baseId}-minimum`} className={FIELD_LABEL}>
                Minimum amount to chase (USD)
              </label>
              <input
                id={`${baseId}-minimum`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={values.minimum}
                onChange={(event) => update("minimum", event.target.value)}
                aria-describedby={describedBy}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={`${baseId}-friendly`} className={FIELD_LABEL}>
                Friendly tone up to (days overdue)
              </label>
              <input
                id={`${baseId}-friendly`}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={values.friendlyLimit}
                onChange={(event) => update("friendlyLimit", event.target.value)}
                aria-describedby={describedBy}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={`${baseId}-firm`} className={FIELD_LABEL}>
                Firm tone up to (days overdue)
              </label>
              <input
                id={`${baseId}-firm`}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={values.firmLimit}
                onChange={(event) => update("firmLimit", event.target.value)}
                aria-describedby={describedBy}
                className={FIELD}
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            Invoices past the firm limit get a phone call recommendation instead
            of an email draft.
          </p>
          <div>
            <label htmlFor={`${baseId}-skip`} className={FIELD_LABEL}>
              Customers to always skip (one per line)
            </label>
            <textarea
              id={`${baseId}-skip`}
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
            Generate My Collections Rules
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
            Your collections rules
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label="Copy rules" />
        </div>
      ) : null}
    </div>
  );
}
