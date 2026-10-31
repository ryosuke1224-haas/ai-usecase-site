"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DEFAULT_RULES_INPUT,
  generateReadinessRules,
  type ReadinessRulesInput,
} from "@/src/lib/premium/security-readiness-action-pack/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";
const CHECK_LABEL =
  `flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground ${FOCUS_RING}`;

export function RulesWorksheet() {
  const [values, setValues] = useState<ReadinessRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof ReadinessRulesInput>(
    field: K,
    value: ReadinessRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateReadinessRules(values);
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
            <label htmlFor={`${baseId}-skip`} className={FIELD_LABEL}>
              Accounts to mark out of scope (one per line)
            </label>
            <textarea
              id={`${baseId}-skip`}
              rows={3}
              value={values.outOfScope}
              onChange={(event) => update("outOfScope", event.target.value)}
              className={FIELD}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Severity ladder
            </legend>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.formerStaff}
                onChange={(event) => update("formerStaff", event.target.checked)}
                aria-describedby={describedBy}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              HIGH: former staff still listed
            </label>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.mfaOff}
                onChange={(event) => update("mfaOff", event.target.checked)}
                aria-describedby={describedBy}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              HIGH: MFA off on customer-or-money data
            </label>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.restoreNever}
                onChange={(event) => update("restoreNever", event.target.checked)}
                aria-describedby={describedBy}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              HIGH: restore never tested on customer-or-money data
            </label>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.sharedLogin}
                onChange={(event) => update("sharedLogin", event.target.checked)}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              MEDIUM: shared login on an admin account
            </label>
          </fieldset>
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
            Generate My Readiness Rules
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
            Your readiness rules
          </h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label="Copy rules" />
        </div>
      ) : null}
    </div>
  );
}
