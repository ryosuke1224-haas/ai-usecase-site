"use client";

import { useId, useState, type FormEvent } from "react";
import type { UiLocale } from "@/src/lib/i18n/locale";
import { quoteCopy } from "@/src/lib/premium/quote-request-assistant/copy";
import {
  DEFAULT_RULES_INPUT,
  generateQualificationRules,
  type QualificationRulesInput,
} from "@/src/lib/premium/quote-request-assistant/kit-content";
import { CopyButton } from "./copy-button";
import { FOCUS_RING, PRE_BLOCK, PRIMARY_BUTTON } from "./styles";
import { HydrationStatus } from "../shared/hydration-status";
import { useHydrated } from "./use-hydrated";

const FIELD =
  `mt-1 block w-full max-w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ${FOCUS_RING}`;
const FIELD_LABEL = "block text-sm font-medium text-foreground";

export function RulesWorksheet({ locale = "en" }: { locale?: UiLocale }) {
  const copy = locale === "ja" ? quoteCopy("ja") : null;
  const [values, setValues] = useState<QualificationRulesInput>(DEFAULT_RULES_INPUT);
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState<string | null>(null);
  const [inputsChanged, setInputsChanged] = useState(false);
  const baseId = useId();
  const errorId = `${baseId}-errors`;
  const hydrated = useHydrated();

  function update<K extends keyof QualificationRulesInput>(
    field: K,
    value: QualificationRulesInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    if (rules !== null) setInputsChanged(true);
    setRules(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = generateQualificationRules(values, locale);
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
            <label htmlFor={`${baseId}-service-area`} className={FIELD_LABEL}>
              {copy?.serviceAreaLabel ?? "Service area"}
            </label>
            <input
              id={`${baseId}-service-area`}
              type="text"
              value={values.serviceArea}
              onChange={(event) => update("serviceArea", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-minimum-size`} className={FIELD_LABEL}>
              {copy?.minimumSizeLabel ?? "Minimum project size (sq ft)"}
            </label>
            <input
              id={`${baseId}-minimum-size`}
              type="text"
              inputMode="numeric"
              value={values.minimumSize}
              onChange={(event) => update("minimumSize", event.target.value)}
              aria-describedby={describedBy}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-offered`} className={FIELD_LABEL}>
              {copy?.servicesOfferedLabel ?? "Services offered"}
            </label>
            <input
              id={`${baseId}-offered`}
              type="text"
              value={values.servicesOffered}
              onChange={(event) => update("servicesOffered", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-out-of-scope`} className={FIELD_LABEL}>
              {copy?.outOfScopeLabel ?? "Work that is out of scope (one per line)"}
            </label>
            <textarea
              id={`${baseId}-out-of-scope`}
              rows={3}
              value={values.outOfScope}
              onChange={(event) => update("outOfScope", event.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-never`} className={FIELD_LABEL}>
              {copy?.neverInDraftLabel ?? "Internal notes that must never appear in a draft"}
            </label>
            <textarea
              id={`${baseId}-never`}
              rows={3}
              value={values.neverInDraft}
              onChange={(event) => update("neverInDraft", event.target.value)}
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
            {copy?.generateRules ?? "Generate My Qualification Rules"}
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
            {copy?.rulesTitle ?? "Your qualification rules"}
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
