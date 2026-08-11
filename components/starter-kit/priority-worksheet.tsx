"use client";

import { useState } from "react";
import { CopyPromptButton } from "@/components/starter-kit/copy-prompt-button";
import {
  buildPriorityRulesPromptFromWorksheet,
  type PriorityWorksheetValues,
} from "@/src/lib/starter-kit/prompts";

const FIELDS: {
  key: keyof PriorityWorksheetValues;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "highPrioritySenders",
    label: "High-priority customers / senders",
    placeholder:
      "Example: Acme Corp, legal@client.com, anyone with “Board” in the subject",
  },
  {
    key: "highPriorityRequestTypes",
    label: "High-priority request types",
    placeholder:
      "Example: contract approvals, proposal revisions, invoice disputes",
  },
  {
    key: "urgentCriteria",
    label: "What makes something urgent?",
    placeholder:
      "Example: deadline today, blocks a meeting today, may delay payment or shipment",
  },
  {
    key: "neverUrgent",
    label: "What should never be marked urgent?",
    placeholder: "Example: newsletters, product updates, FYI-only threads",
  },
  {
    key: "waitingOrFyi",
    label: "Items that should be Waiting / FYI",
    placeholder:
      "Example: “no action needed yet,” waiting on vendor reply, informational CC",
  },
  {
    key: "meetingRules",
    label: "Meeting-related rules",
    placeholder:
      "Example: connect emails to today’s meetings; flag overlaps; prepare agenda items",
  },
  {
    key: "neverAutomaticActions",
    label: "Actions AI must never take automatically",
    placeholder:
      "Example: never send email, never edit/delete calendar events, never share files",
  },
];

const EMPTY: PriorityWorksheetValues = {
  highPrioritySenders: "",
  highPriorityRequestTypes: "",
  urgentCriteria: "",
  neverUrgent: "",
  waitingOrFyi: "",
  meetingRules: "",
  neverAutomaticActions: "",
};

export function PriorityWorksheet() {
  const [values, setValues] = useState<PriorityWorksheetValues>(EMPTY);
  const [generated, setGenerated] = useState<string | null>(null);
  const [emptyError, setEmptyError] = useState(false);

  function updateField(key: keyof PriorityWorksheetValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    if (emptyError) setEmptyError(false);
  }

  function handleGenerate() {
    const prompt = buildPriorityRulesPromptFromWorksheet(values);
    if (!prompt) {
      setGenerated(null);
      setEmptyError(true);
      return;
    }
    setEmptyError(false);
    setGenerated(prompt);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-muted">
        Fill in the sections that matter for your business. Responses stay in
        this browser session only—nothing is saved to Atlas yet.
      </p>

      <div className="space-y-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="text-sm font-semibold text-foreground">
              {field.label}
            </span>
            <textarea
              value={values[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              rows={3}
              placeholder={field.placeholder}
              className="mt-2 w-full rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Generate My Priority Rules Prompt
      </button>

      {emptyError ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
        >
          Enter at least one rule before generating a prompt.
        </p>
      ) : null}

      {generated ? (
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Your generated prompt
            </h2>
            <CopyPromptButton text={generated} />
          </div>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground sm:text-sm">
            {generated}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
