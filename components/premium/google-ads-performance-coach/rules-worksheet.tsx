"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { adsCopy } from "@/src/lib/premium/google-ads-performance-coach/copy";
import {
  DEFAULT_RULES_INPUT,
  generateMeasurementRules,
  type MeasurementRulesInput,
} from "@/src/lib/premium/google-ads-performance-coach/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";
const CHECK_LABEL =
  `flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed text-foreground ${FOCUS_RING}`;

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = locale === "ja" ? adsCopy("ja") : null;
  const [values, setValues] = useState<MeasurementRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof MeasurementRulesInput>(
    field: K,
    value: MeasurementRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateMeasurementRules(values, locale);
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
            <label htmlFor={`${baseId}-outcome`} className={FIELD_LABEL}>
              {copy?.qualifiedOutcomeLabel ??
                "Qualified outcome (what must happen before a conversion counts)"}
            </label>
            <input
              id={`${baseId}-outcome`}
              type="text"
              value={values.qualifiedOutcome}
              onChange={(event) => update("qualifiedOutcome", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {copy?.eventsDoNotCountLabel ?? "Events that do not count"}
            </legend>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.pageViewDoesNotCount}
                onChange={(event) => update("pageViewDoesNotCount", event.target.checked)}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              {copy?.pageViewCheckbox ?? "page_view does not count as a qualified outcome"}
            </label>
            <label className={CHECK_LABEL}>
              <input
                type="checkbox"
                checked={values.addToCartDoesNotCount}
                onChange={(event) => update("addToCartDoesNotCount", event.target.checked)}
                className={`mt-1 size-4 shrink-0 rounded border-border accent-[var(--accent)] ${FOCUS_RING}`}
              />
              {copy?.addToCartCheckbox ?? "add_to_cart does not count as a qualified outcome"}
            </label>
          </fieldset>
          <div>
            <label htmlFor={`${baseId}-skip`} className={FIELD_LABEL}>
              {copy?.outOfScopeLabel ?? "Campaigns to mark out of scope (one per line)"}
            </label>
            <textarea
              id={`${baseId}-skip`}
              rows={3}
              value={values.outOfScope}
              onChange={(event) => update("outOfScope", event.target.value)}
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
            {copy?.generateRules ?? "Generate My Measurement Rules"}
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
            {copy?.rulesTitle ?? "Your measurement rules"}
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
