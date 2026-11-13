"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { proposalCopy } from "@/src/lib/premium/ai-proposal-follow-up-assistant/copy";
import {
  DEFAULT_RULES_INPUT,
  generateSilenceRules,
  type SilenceRulesInput,
} from "@/src/lib/premium/ai-proposal-follow-up-assistant/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = locale === "ja" ? proposalCopy("ja") : null;
  const [values, setValues] = useState<SilenceRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof SilenceRulesInput>(
    field: K,
    value: SilenceRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateSilenceRules(values, locale);
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
            <label htmlFor={`${baseId}-silence`} className={FIELD_LABEL}>
              {copy?.silenceDateLabel ?? "Silence if sent before (YYYY-MM-DD)"}
            </label>
            <input
              id={`${baseId}-silence`}
              type="text"
              value={values.silenceIfSentBefore}
              onChange={(event) =>
                update("silenceIfSentBefore", event.target.value)
              }
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-minimum`} className={FIELD_LABEL}>
              {copy?.minimumAmountLabel ?? "Owner minimum amount (USD)"}
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
              {copy?.neverChaseLabel ?? "Statuses that are never chased (one per line)"}
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
            <label htmlFor={`${baseId}-cadence`} className={FIELD_LABEL}>
              {copy?.cadenceLabel ?? "Cadence ladder"}
            </label>
            <textarea
              id={`${baseId}-cadence`}
              rows={3}
              value={values.cadenceLadder}
              onChange={(event) => update("cadenceLadder", event.target.value)}
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
            {copy?.generateRules ?? "Generate My Silence Rules"}
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
            {copy?.rulesTitle ?? "Your silence rules"}
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
