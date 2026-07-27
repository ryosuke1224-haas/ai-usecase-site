"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  usePublishedContent,
  useContentResolver,
} from "@/src/content/content-context";
import {
  discoverByIndustry,
  findUseCasesByApis,
  industryProfiles,
} from "@/src/lib/discovery";
import {
  isLlmSlug,
  hasAnyLlm,
  LLM_CAPABILITY_LABEL,
  LLM_COMPATIBLE_SUMMARY,
} from "@/src/lib/llm";
import type { UseCase } from "@/src/content/schemas";
import { Badge } from "@/components/ui/detail";

const POPULAR_TOOLS: { slug: string; label: string }[] = [
  { slug: "gmail-api", label: "Gmail" },
  { slug: "google-calendar-api", label: "Google Calendar" },
  { slug: "google-sheets-api", label: "Google Sheets" },
  { slug: "slack-api", label: "Slack" },
  { slug: "square-api", label: "Square" },
  { slug: "quickbooks-api", label: "QuickBooks" },
  { slug: "calendly-api", label: "Calendly" },
  { slug: "hubspot-api", label: "HubSpot" },
];

type GuidedMatch = {
  useCase: UseCase;
  matchType: "ready" | "partial" | "explore";
  hasTools: string[];
  needsTools: string[];
  hasData: string[];
  needsData: string[];
  requiresLlm: boolean;
  hasLlm: boolean;
};

function toolLabel(name: string) {
  return name.replace(/\s+API$/i, "");
}

function GuidedProgress({
  hasBusiness,
  hasTools,
  hasResults,
}: {
  hasBusiness: boolean;
  hasTools: boolean;
  hasResults: boolean;
}) {
  const steps = [
    "Choose your business",
    "Select your tools",
    "Review workflows",
  ];

  const activeIndex = hasResults ? 2 : hasTools || hasBusiness ? 1 : 0;

  return (
    <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0">
      {steps.map((label, index) => {
        const isActive = index === activeIndex;
        const isDone =
          (index === 0 && hasBusiness) ||
          (index === 1 && hasTools) ||
          (index === 2 && hasResults) ||
          index < activeIndex;
        return (
          <li
            key={label}
            className="flex items-center gap-2 sm:flex-1 sm:gap-0"
          >
            <div className="flex items-center gap-2.5 sm:w-full">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : isDone
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border bg-background text-muted"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {index + 1}
              </span>
              <span
                className={`text-xs sm:text-sm ${
                  isActive ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <span
                  className="mx-3 hidden h-px flex-1 bg-border sm:block"
                  aria-hidden="true"
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function GuidedWorkflowFinder({
  initialSelected,
  initialIndustry,
}: {
  initialSelected?: string[];
  initialIndustry?: string;
}) {
  const content = usePublishedContent();
  const { apis, useCases } = content;
  const { resolveApiName, resolveDataSourceName } = useContentResolver();

  const [industry, setIndustry] = useState(initialIndustry ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected ?? []),
  );
  const [toolQuery, setToolQuery] = useState("");
  const [browseAllTools, setBrowseAllTools] = useState(false);
  const [showAllData, setShowAllData] = useState(false);
  const [showAllWorkflows, setShowAllWorkflows] = useState(false);

  useEffect(() => {
    if (initialSelected?.length) {
      setSelected(new Set(initialSelected));
    }
  }, [initialSelected]);

  useEffect(() => {
    if (initialIndustry) setIndustry(initialIndustry);
  }, [initialIndustry]);

  const availablePopular = useMemo(
    () => POPULAR_TOOLS.filter((t) => apis.some((a) => a.slug === t.slug)),
    [apis],
  );

  const filteredApis = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return apis;
    return apis.filter((api) => {
      const haystack = [api.name, api.provider, toolLabel(api.name), ...api.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [apis, toolQuery]);

  const industryResult = useMemo(
    () => (industry ? discoverByIndustry(industry, content) : null),
    [industry, content],
  );

  const apiMatches = useMemo(
    () => findUseCasesByApis([...selected], useCases),
    [selected, useCases],
  );

  const matches = useMemo((): GuidedMatch[] => {
    const selectedSet = selected;
    const likelyData = new Set(industryResult?.profile?.dataYouLikelyHave ?? []);
    const likelyApis = new Set(industryResult?.profile?.apisYouLikelyUse ?? []);
    const userHasLlm = hasAnyLlm(selectedSet) || hasAnyLlm(likelyApis);

    const annotate = (
      useCase: UseCase,
      matchType: GuidedMatch["matchType"],
      matchedFromApis?: string[],
      missingFromApis?: string[],
    ): GuidedMatch => {
      const requiredApis = useCase.requiredApis;
      const requiredData = useCase.requiredDataSources;
      const requiresLlm = requiredApis.some(isLlmSlug);

      const nonLlmRequired = requiredApis.filter((a) => !isLlmSlug(a));

      let hasTools: string[];
      let needsTools: string[];

      if (selectedSet.size > 0) {
        const matchedNonLlm = matchedFromApis?.filter((a) => !isLlmSlug(a))
          ?? nonLlmRequired.filter((a) => selectedSet.has(a));
        const missingNonLlm = missingFromApis?.filter((a) => !isLlmSlug(a))
          ?? nonLlmRequired.filter((a) => !selectedSet.has(a));
        hasTools = matchedNonLlm;
        needsTools = missingNonLlm;
      } else {
        hasTools = nonLlmRequired.filter((a) => likelyApis.has(a));
        needsTools = nonLlmRequired.filter((a) => !likelyApis.has(a));
      }

      const hasData = requiredData.filter((d) => likelyData.has(d));
      const needsData = requiredData.filter((d) => !likelyData.has(d));

      return {
        useCase,
        matchType,
        hasTools,
        needsTools,
        hasData,
        needsData,
        requiresLlm,
        hasLlm: userHasLlm,
      };
    };

    if (selectedSet.size > 0 && industryResult) {
      const bySlug = new Map(
        apiMatches.map((m) => [m.useCase.slug, m] as const),
      );
      const industrySlugs = new Set(industryResult.useCases.map((u) => u.slug));

      const combined: GuidedMatch[] = [];

      for (const uc of industryResult.useCases) {
        const apiMatch = bySlug.get(uc.slug);
        if (apiMatch) {
          combined.push(
            annotate(
              uc,
              apiMatch.matchType,
              apiMatch.matchedApis,
              apiMatch.missingApis,
            ),
          );
        } else {
          const nonLlm = uc.requiredApis.filter((a) => !isLlmSlug(a));
          const matched = nonLlm.filter((a) => selectedSet.has(a));
          const missing = nonLlm.filter((a) => !selectedSet.has(a));
          const reqLlm = uc.requiredApis.some(isLlmSlug);
          const llmOk = !reqLlm || userHasLlm;
          const type =
            matched.length === 0 && !llmOk
              ? "explore"
              : missing.length === 0 && llmOk
                ? "ready"
                : matched.length === 0 && llmOk
                  ? "explore"
                  : "partial";
          combined.push(annotate(uc, type, matched, missing));
        }
      }

      for (const m of apiMatches) {
        if (!industrySlugs.has(m.useCase.slug)) {
          combined.push(
            annotate(
              m.useCase,
              m.matchType,
              m.matchedApis,
              m.missingApis,
            ),
          );
        }
      }

      return combined.sort((a, b) => {
        const order = { ready: 0, partial: 1, explore: 2 };
        if (order[a.matchType] !== order[b.matchType]) {
          return order[a.matchType] - order[b.matchType];
        }
        return a.useCase.title.localeCompare(b.useCase.title);
      });
    }

    if (selectedSet.size > 0) {
      return apiMatches.map((m) =>
        annotate(m.useCase, m.matchType, m.matchedApis, m.missingApis),
      );
    }

    if (industryResult) {
      return industryResult.useCases.map((uc) => annotate(uc, "explore"));
    }

    return [];
  }, [selected, industryResult, apiMatches]);

  const toggleTool = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const hasBusiness = Boolean(industry);
  const hasTools = selected.size > 0;
  const hasResults = matches.length > 0;

  const previewMatches = showAllWorkflows ? matches : matches.slice(0, 3);
  const dataSources = industryResult?.dataSources ?? [];
  const previewData = showAllData ? dataSources : dataSources.slice(0, 3);

  return (
    <section
      id="workflow-finder"
      className="scroll-mt-24 rounded-xl border border-border/60 bg-card"
    >
      <div className="border-b border-border/60 px-5 py-4">
        <GuidedProgress
          hasBusiness={hasBusiness}
          hasTools={hasTools}
          hasResults={hasResults}
        />
      </div>

      <div className="space-y-6 px-5 py-5">
        {/* Step 1 */}
        <div>
          <h3 className="text-sm font-semibold">
            <span className="mr-2 text-muted">1.</span>
            Choose your business type
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {industryProfiles.map((profile) => {
              const isSelected = industry === profile.slug;
              return (
                <button
                  key={profile.slug}
                  type="button"
                  onClick={() =>
                    setIndustry((prev) =>
                      prev === profile.slug ? "" : profile.slug,
                    )
                  }
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border/60 bg-surface text-foreground hover:border-accent/40"
                  }`}
                >
                  {profile.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 */}
        <div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h3 className="text-sm font-semibold">
              <span className="mr-2 text-muted">2.</span>
              Select tools you already use
            </h3>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Clear tools
              </button>
            )}
          </div>

          <label className="mt-3 block">
            <span className="sr-only">Search tools</span>
            <input
              type="search"
              value={toolQuery}
              onChange={(e) => {
                setToolQuery(e.target.value);
                if (e.target.value.trim()) setBrowseAllTools(true);
              }}
              placeholder="Search tools (Gmail, Square, Slack…)"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
            />
          </label>

          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">
            Popular tools
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availablePopular.map((tool) => {
              const isSelected = selected.has(tool.slug);
              return (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => toggleTool(tool.slug)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border/60 bg-surface hover:border-accent/40"
                  }`}
                >
                  {isSelected ? "✓ " : ""}
                  {tool.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setBrowseAllTools((v) => !v)}
              className="text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              aria-expanded={browseAllTools}
            >
              {browseAllTools ? "Hide full tool list" : "Browse all tools"}
            </button>
          </div>

          {browseAllTools && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredApis.map((api) => {
                const isSelected = selected.has(api.slug);
                return (
                  <button
                    key={api.slug}
                    type="button"
                    onClick={() => toggleTool(api.slug)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border/60 hover:border-accent/30"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                        isSelected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    <span className="font-medium">{toolLabel(api.name)}</span>
                  </button>
                );
              })}
              {filteredApis.length === 0 && (
                <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">
                  No tools match &quot;{toolQuery}&quot;.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Industry compact summary */}
        {industryResult?.profile && (
          <div className="rounded-lg border border-border/60 bg-surface/60 px-4 py-3">
            <p className="text-sm text-muted">{industryResult.profile.summary}</p>
            <p className="mt-2 text-sm font-medium">
              {dataSources.length} likely data source
              {dataSources.length !== 1 ? "s" : ""}
              <span className="mx-2 text-muted">·</span>
              {matches.length} matching workflow
              {matches.length !== 1 ? "s" : ""}
            </p>

            {dataSources.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Likely data sources
                </p>
                <ul className="mt-1.5 space-y-1">
                  {previewData.map((ds) => (
                    <li key={ds.slug}>
                      <Link
                        href={`/data-sources/${ds.slug}`}
                        className="text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                      >
                        {ds.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                {dataSources.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllData((v) => !v)}
                    className="mt-2 text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    aria-expanded={showAllData}
                  >
                    {showAllData
                      ? "Show fewer data sources"
                      : "View all likely data sources"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — results */}
        <div>
          <h3 className="text-sm font-semibold">
            <span className="mr-2 text-muted">3.</span>
            Matching workflows
          </h3>

          {!hasBusiness && !hasTools ? (
            <p className="mt-3 text-sm text-muted">
              Select a business type or at least one tool to see matching
              workflows.
            </p>
          ) : matches.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No matching workflows yet. Try another business type or add more
              tools.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-3">
                {previewMatches.map((match) => (
                  <MatchCard
                    key={match.useCase.slug}
                    match={match}
                    resolveApiName={resolveApiName}
                    resolveDataSourceName={resolveDataSourceName}
                  />
                ))}
              </ul>

              {matches.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllWorkflows((v) => !v)}
                  className="mt-3 text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  aria-expanded={showAllWorkflows}
                >
                  {showAllWorkflows
                    ? "Show fewer workflows"
                    : `View all matching workflows (${matches.length})`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function MatchCard({
  match,
  resolveApiName,
  resolveDataSourceName,
}: {
  match: GuidedMatch;
  resolveApiName: (slug: string) => string;
  resolveDataSourceName: (slug: string) => string;
}) {
  const hasToolsDisplay = match.hasTools
    .slice(0, 4)
    .map((s) => toolLabel(resolveApiName(s)));

  const needsToolsDisplay = match.needsTools
    .slice(0, 4)
    .map((s) => toolLabel(resolveApiName(s)));

  const hasDataDisplay = match.hasData
    .slice(0, 3)
    .map(resolveDataSourceName);

  const needsDataDisplay = match.needsData
    .slice(0, 3)
    .map(resolveDataSourceName);

  return (
    <li className="rounded-lg border border-border/60 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/use-cases/${match.useCase.slug}`}
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {match.useCase.title}
          </Link>
          <p className="mt-1 text-sm text-muted line-clamp-2">
            {match.useCase.outcome}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={
              match.matchType === "ready"
                ? "success"
                : match.matchType === "partial"
                  ? "warning"
                  : "default"
            }
          >
            {match.matchType === "ready"
              ? "Ready"
              : match.matchType === "partial"
                ? "Partial"
                : "Explore"}
          </Badge>
          <Badge>{match.useCase.difficulty}</Badge>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        {/* Tools you already have */}
        <div>
          <dt className="font-semibold text-muted">Tools you already have</dt>
          <dd className="mt-0.5 text-foreground">
            {hasToolsDisplay.length > 0
              ? hasToolsDisplay.join(" · ")
              : "—"}
          </dd>
        </div>

        {/* LLM: choose one compatible provider */}
        {match.requiresLlm && (
          <div>
            <dt className="font-semibold text-muted">
              {LLM_CAPABILITY_LABEL}
            </dt>
            <dd className="mt-0.5">
              {match.hasLlm ? (
                <span className="text-emerald-700 dark:text-emerald-400">
                  ✓ You have a compatible model
                </span>
              ) : (
                <span className="text-foreground">
                  {LLM_COMPATIBLE_SUMMARY}
                </span>
              )}
            </dd>
          </div>
        )}

        {/* Other tools still needed */}
        {needsToolsDisplay.length > 0 && (
          <div>
            <dt className="font-semibold text-muted">Other tools still needed</dt>
            <dd className="mt-0.5 text-amber-700 dark:text-amber-400">
              {needsToolsDisplay.join(" · ")}
            </dd>
          </div>
        )}

        {/* Data required */}
        {(hasDataDisplay.length > 0 || needsDataDisplay.length > 0) && (
          <div>
            <dt className="font-semibold text-muted">Data required</dt>
            <dd className="mt-0.5 text-foreground">
              {[...hasDataDisplay, ...needsDataDisplay].join(" · ")}
            </dd>
          </div>
        )}
      </dl>

      <Link
        href={`/use-cases/${match.useCase.slug}`}
        className="mt-3 inline-block text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        View blueprint →
      </Link>
    </li>
  );
}
