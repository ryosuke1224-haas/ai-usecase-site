"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { noShowCopy } from "@/src/lib/premium/no-show-recovery-assistant/copy";
import {
  DEFAULT_RULES_INPUT,
  generateRecoveryRules,
  type RecoveryRulesInput,
} from "@/src/lib/premium/no-show-recovery-assistant/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = noShowCopy(locale);
  const [values, setValues] = useState<RecoveryRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof RecoveryRulesInput>(field: K, value: RecoveryRulesInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateRecoveryRules(values, locale);
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
      <p className="text-sm leading-relaxed text-foreground">{copy.consentHelper}</p>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset disabled={!hydrated} className="min-w-0 space-y-4">
          <div>
            <label htmlFor={`${baseId}-threshold`} className={FIELD_LABEL}>
              {copy.thresholdLabel}
            </label>
            <input
              id={`${baseId}-threshold`}
              type="text"
              inputMode="numeric"
              value={values.threshold}
              onChange={(event) => update("threshold", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-never-statuses`} className={FIELD_LABEL}>
              {copy.neverStatusesLabel}
            </label>
            <textarea
              id={`${baseId}-never-statuses`}
              rows={3}
              value={values.neverStatuses}
              onChange={(event) => update("neverStatuses", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-always-skip`} className={FIELD_LABEL}>
              {copy.alwaysSkipLabel}
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
            {copy.generateRules}
          </button>
        </fieldset>
      </form>

      {inputsChanged ? <p className="text-sm leading-relaxed text-foreground">{copy.inputsChanged}</p> : null}
      {rules ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{copy.rulesHeading}</h3>
          <pre className={PRE_BLOCK}>{rules}</pre>
          <CopyButton text={rules} label={copy.copyRules} copiedLabel={copy.copied} errorLabel={copy.copyFailed} />
        </div>
      ) : null}
    </div>
  );
}
