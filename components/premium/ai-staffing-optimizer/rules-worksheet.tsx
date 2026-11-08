"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_RULES_INPUT,
  generateStaffingRules,
  type StaffingRulesInput,
} from "@/src/lib/premium/ai-staffing-optimizer/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet() {
  const [values, setValues] = useState<StaffingRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof StaffingRulesInput>(
    field: K,
    value: StaffingRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateStaffingRules(values);
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
            <label htmlFor={`${baseId}-minimum`} className={FIELD_LABEL}>
              Minimum staff on floor
            </label>
            <input
              id={`${baseId}-minimum`}
              type="text"
              inputMode="numeric"
              value={values.minimumStaff}
              onChange={(event) => update("minimumStaff", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-low`} className={FIELD_LABEL}>
              Target transactions per staff-hour (low)
            </label>
            <input
              id={`${baseId}-low`}
              type="text"
              inputMode="decimal"
              value={values.targetLow}
              onChange={(event) => update("targetLow", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-high`} className={FIELD_LABEL}>
              Target transactions per staff-hour (high)
            </label>
            <input
              id={`${baseId}-high`}
              type="text"
              inputMode="decimal"
              value={values.targetHigh}
              onChange={(event) => update("targetHigh", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <fieldset className="min-w-0 space-y-2">
            <legend className={FIELD_LABEL}>
              Flag when outside target in at least N of M weeks
            </legend>
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor={`${baseId}-n`} className="sr-only">
                  N
                </label>
                <span className="mr-2 text-sm text-muted" aria-hidden="true">
                  N
                </span>
                <input
                  id={`${baseId}-n`}
                  type="text"
                  inputMode="numeric"
                  value={values.flagN}
                  onChange={(event) => update("flagN", event.target.value)}
                  aria-label="Pattern weeks numerator (N)"
                  className={`${FIELD} mt-0 inline-block w-20`}
                />
              </div>
              <div>
                <label htmlFor={`${baseId}-m`} className="sr-only">
                  M
                </label>
                <span className="mr-2 text-sm text-muted" aria-hidden="true">
                  M
                </span>
                <input
                  id={`${baseId}-m`}
                  type="text"
                  inputMode="numeric"
                  value={values.flagM}
                  onChange={(event) => update("flagM", event.target.value)}
                  aria-label="Pattern weeks denominator (M)"
                  className={`${FIELD} mt-0 inline-block w-20`}
                />
              </div>
            </div>
          </fieldset>
          <div>
            <label htmlFor={`${baseId}-roles`} className={FIELD_LABEL}>
              Roles that cannot be cut (one per line)
            </label>
            <textarea
              id={`${baseId}-roles`}
              rows={3}
              value={values.protectedRoles}
              onChange={(event) => update("protectedRoles", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-nonsales`} className={FIELD_LABEL}>
              Non-sales day-parts (optional, one per line)
            </label>
            <textarea
              id={`${baseId}-nonsales`}
              rows={3}
              value={values.nonSalesDayParts}
              onChange={(event) =>
                update("nonSalesDayParts", event.target.value)
              }
              className={FIELD}
            />
          </div>
          {errors.length > 0 ? (
            <div id={errorId} role="alert" className="space-y-1">
              {errors.map((error) => (
                <p
                  key={error}
                  className="text-sm font-medium text-red-700 dark:text-red-300"
                >
                  {error}
                </p>
              ))}
            </div>
          ) : null}
          <button type="submit" className={PRIMARY_BUTTON}>
            Generate My Staffing Rules
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
            Your staffing rules
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label="Copy" />
        </div>
      ) : null}
    </div>
  );
}
