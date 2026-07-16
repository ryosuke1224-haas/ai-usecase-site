"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePublishedContent, useContentResolver } from "@/src/content/content-context";
import {
  findUseCasesByApis,
  findWorkflowsByApis,
  getApiPresets,
} from "@/src/lib/discovery";
import { Badge } from "@/components/ui/detail";

export function WorkflowFinder({
  initialSelected,
}: {
  initialSelected?: string[];
}) {
  const { apis, useCases, workflowIdeas } = usePublishedContent();
  const { resolveApiName } = useContentResolver();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected ?? []),
  );
  const presets = getApiPresets();

  useEffect(() => {
    if (initialSelected?.length) {
      setSelected(new Set(initialSelected));
    }
  }, [initialSelected]);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectedList = useMemo(() => [...selected], [selected]);
  const useCaseMatches = useMemo(
    () => findUseCasesByApis(selectedList, useCases),
    [selectedList, useCases],
  );
  const workflowMatches = useMemo(
    () => findWorkflowsByApis(selectedList, workflowIdeas),
    [selectedList, workflowIdeas],
  );

  const readyCount = useCaseMatches.filter((m) => m.matchType === "ready").length;

  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="font-semibold">I have these tools — what can I build?</h2>
        <p className="mt-1 text-sm text-muted">
          Select the APIs and tools you already use. We&apos;ll show matching
          workflows and what you&apos;d still need to add.
        </p>
      </div>

      <div className="border-b border-border/60 px-5 py-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
          Quick presets
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setSelected(new Set(preset.slugs))}
              className="rounded-md border border-border/60 bg-surface px-3 py-1.5 text-xs font-medium hover:border-accent/40 hover:text-accent"
            >
              {preset.label}
            </button>
          ))}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto border-b border-border/60 px-5 py-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {apis.map((api) => {
            const isSelected = selected.has(api.slug);
            return (
              <button
                key={api.slug}
                type="button"
                onClick={() => toggle(api.slug)}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border/60 hover:border-accent/30"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                    isSelected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
                <span>
                  <span className="font-medium">{api.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{api.provider}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4">
        {selected.size === 0 ? (
          <p className="text-sm text-muted">
            Select at least one API above — try the Gmail + Google Calendar preset.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {readyCount} workflow{readyCount !== 1 ? "s" : ""} ready with your
              selection · {useCaseMatches.length} total matches
            </p>

            {useCaseMatches.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Use cases
                </h3>
                <ul className="mt-2 divide-y divide-border/40 rounded-lg border border-border/60">
                  {useCaseMatches.map(({ useCase, matchType, missingApis }) => (
                    <li key={useCase.slug} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div>
                        <Link
                          href={`/use-cases/${useCase.slug}`}
                          className="font-medium text-accent hover:underline"
                        >
                          {useCase.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted line-clamp-1">
                          {useCase.summary}
                        </p>
                        {matchType === "partial" && missingApis.length > 0 && (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            Also need:{" "}
                            {missingApis.map(resolveApiName).join(", ")}
                          </p>
                        )}
                      </div>
                      <Badge variant={matchType === "ready" ? "success" : "warning"}>
                        {matchType === "ready" ? "Ready" : "Partial"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {workflowMatches.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Workflow stacks
                </h3>
                <ul className="mt-2 space-y-2">
                  {workflowMatches.map(({ workflow, matchType, missingApis }) => (
                    <li
                      key={workflow.slug}
                      className="rounded-lg border border-border/60 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href="/workflow-ideas"
                          className="text-sm font-medium hover:text-accent"
                        >
                          {workflow.title}
                        </Link>
                        <Badge variant={matchType === "ready" ? "success" : "warning"}>
                          {matchType === "ready" ? "Ready" : "Partial"}
                        </Badge>
                      </div>
                      {matchType === "partial" && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          Add: {missingApis.map(resolveApiName).join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
