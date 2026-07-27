"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  useContentResolver,
  usePublishedContent,
} from "@/src/content/content-context";
import type { BusinessProblem } from "@/src/content/schemas";
import {
  businessProblemDefinitions,
  getBusinessProblemLabel,
} from "@/src/lib/business-problems";
import {
  discoverByIndustry,
  getApiPresets,
  groupUseCaseRecommendations,
  industryProfiles,
  recommendUseCases,
  type DiscoveryMode,
  type UseCaseRecommendation,
} from "@/src/lib/discovery";
import {
  LLM_CAPABILITY_LABEL,
  LLM_COMPATIBLE_SUMMARY,
} from "@/src/lib/llm";
import { Badge } from "@/components/ui/detail";

const POPULAR_TOOLS: { slug: string; label: string }[] = [
  { slug: "gmail-api", label: "Gmail" },
  { slug: "google-calendar-api", label: "Google Calendar" },
  { slug: "google-sheets-api", label: "Google Sheets" },
  { slug: "google-business-profile-api", label: "Google Business Profile" },
  { slug: "square-api", label: "Square" },
  { slug: "calendly-api", label: "Calendly" },
  { slug: "hubspot-api", label: "HubSpot" },
  { slug: "quickbooks-api", label: "QuickBooks" },
];

const POPULAR_DATA: { slug: string; label: string }[] = [
  { slug: "emails", label: "Emails" },
  { slug: "customer-reviews", label: "Customer reviews" },
  { slug: "booking-data", label: "Booking data" },
  { slug: "pos-transactions", label: "Transactions" },
  { slug: "crm-records", label: "CRM records" },
];

function toolLabel(name: string) {
  return name.replace(/\s+API$/i, "");
}

function toSentenceCase(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function compactAiOutput(value: string) {
  return value.split(":")[0]?.trim() ?? value;
}

function buildHowItWorks(
  match: UseCaseRecommendation,
  resolveDataSourceName: (slug: string) => string,
) {
  const source = match.useCase.requiredData[0]
    ? resolveDataSourceName(match.useCase.requiredData[0])
    : "Business data";
  const transform = match.requiresLlm ? "analyze with AI" : "process automatically";
  const output = compactAiOutput(match.useCase.aiOutputs[0] ?? "generate workflow output");
  return `${source} -> ${transform} -> ${toSentenceCase(output)}`;
}

function statusLabel(readiness: UseCaseRecommendation["readiness"]) {
  if (readiness === "ready") return "Ready to build";
  if (readiness === "almost-ready") return "Almost ready";
  return "Additional setup needed";
}

function statusVariant(readiness: UseCaseRecommendation["readiness"]) {
  if (readiness === "ready") return "success" as const;
  if (readiness === "almost-ready") return "warning" as const;
  return "default" as const;
}

function StepProgress({
  mode,
  hasProblem,
  hasBusiness,
  hasSelections,
  hasResults,
}: {
  mode: DiscoveryMode;
  hasProblem: boolean;
  hasBusiness: boolean;
  hasSelections: boolean;
  hasResults: boolean;
}) {
  const steps =
    mode === "problem"
      ? [
          "Choose a business problem",
          "Choose your business type",
          "Optionally add tools and data",
          "Review recommended workflows",
        ]
      : [
          "Choose your business type",
          "Select your tools and data",
          "Review recommended workflows",
        ];

  const activeIndex =
    mode === "problem"
      ? hasResults
        ? 3
        : hasSelections
          ? 2
          : hasBusiness
            ? 1
            : 0
      : hasResults
        ? 2
        : hasSelections || hasBusiness
          ? 1
          : 0;

  return (
    <ol className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-0">
      {steps.map((label, index) => {
        const isActive = index === activeIndex;
        const isDone =
          (mode === "problem" && index === 0 && hasProblem) ||
          ((mode === "problem" && index === 1 && hasBusiness) ||
            (mode === "tools" && index === 0 && hasBusiness)) ||
          ((mode === "problem" && index === 2 && hasSelections) ||
            (mode === "tools" && index === 1 && hasSelections)) ||
          ((mode === "problem" && index === 3 && hasResults) ||
            (mode === "tools" && index === 2 && hasResults)) ||
          index < activeIndex;

        return (
          <li key={label} className="flex items-center gap-2 lg:flex-1 lg:gap-0">
            <div className="flex items-center gap-2.5 lg:w-full">
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
                className={`text-xs lg:text-sm ${
                  isActive ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
              {index < steps.length - 1 && (
                <span className="mx-3 hidden h-px flex-1 bg-border lg:block" aria-hidden="true" />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SegmentedModeControl({
  mode,
  onChange,
}: {
  mode: DiscoveryMode;
  onChange: (mode: DiscoveryMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border/60 bg-surface p-1">
      <button
        type="button"
        onClick={() => onChange("problem")}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
          mode === "problem"
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-card"
        }`}
        aria-pressed={mode === "problem"}
      >
        Find by business problem
      </button>
      <button
        type="button"
        onClick={() => onChange("tools")}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
          mode === "tools"
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-card"
        }`}
        aria-pressed={mode === "tools"}
      >
        Find by tools I already use
      </button>
    </div>
  );
}

function ToggleChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
        selected
          ? "border-accent bg-accent/10 text-foreground"
          : "border-border/60 bg-surface hover:border-accent/40"
      }`}
    >
      {selected ? "? " : ""}
      {label}
    </button>
  );
}

export function GuidedWorkflowFinder({
  initialMode,
  initialProblem,
  initialSelected,
  initialSelectedData,
  initialIndustry,
}: {
  initialMode?: DiscoveryMode;
  initialProblem?: BusinessProblem;
  initialSelected?: string[];
  initialSelectedData?: string[];
  initialIndustry?: string;
}) {
  const content = usePublishedContent();
  const { apis, useCases, dataSources } = content;
  const { resolveApiName, resolveDataSourceName } = useContentResolver();

  const [mode, setMode] = useState<DiscoveryMode>(initialMode ?? "problem");
  const [problem, setProblem] = useState<BusinessProblem | "">(initialProblem ?? "");
  const [industry, setIndustry] = useState(initialIndustry ?? "");
  const [selectedApis, setSelectedApis] = useState<Set<string>>(
    () => new Set(initialSelected ?? []),
  );
  const [selectedData, setSelectedData] = useState<Set<string>>(
    () => new Set(initialSelectedData ?? []),
  );
  const [toolQuery, setToolQuery] = useState("");
  const [dataQuery, setDataQuery] = useState("");
  const [browseAllTools, setBrowseAllTools] = useState(false);
  const [browseAllData, setBrowseAllData] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialProblem) setProblem(initialProblem);
  }, [initialProblem]);

  useEffect(() => {
    if (initialSelected?.length) {
      setSelectedApis(new Set(initialSelected));
    }
  }, [initialSelected]);

  useEffect(() => {
    if (initialSelectedData?.length) {
      setSelectedData(new Set(initialSelectedData));
    }
  }, [initialSelectedData]);

  useEffect(() => {
    if (initialIndustry) setIndustry(initialIndustry);
  }, [initialIndustry]);

  const presets = useMemo(() => getApiPresets(), []);

  const availablePopularTools = useMemo(
    () => POPULAR_TOOLS.filter((tool) => apis.some((api) => api.slug === tool.slug)),
    [apis],
  );

  const availablePopularData = useMemo(
    () => POPULAR_DATA.filter((item) => dataSources.some((ds) => ds.slug === item.slug)),
    [dataSources],
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

  const filteredData = useMemo(() => {
    const q = dataQuery.trim().toLowerCase();
    if (!q) return dataSources;

    return dataSources.filter((dataSource) => {
      const haystack = [
        dataSource.name,
        dataSource.summary,
        ...dataSource.examples,
        ...dataSource.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [dataQuery, dataSources]);

  const industryResult = useMemo(
    () => (industry ? discoverByIndustry(industry, content) : null),
    [content, industry],
  );

  const recommendations = useMemo(
    () =>
      recommendUseCases(
        {
          mode,
          problem: problem || undefined,
          industry: industry || undefined,
          selectedApis: [...selectedApis],
          selectedData: [...selectedData],
        },
        useCases,
      ),
    [industry, mode, problem, selectedApis, selectedData, useCases],
  );

  const groups = useMemo(
    () => groupUseCaseRecommendations(recommendations),
    [recommendations],
  );

  const likelyDataSelections = useMemo(() => {
    if (!industryResult?.dataSources.length) return [];
    return industryResult.dataSources.slice(0, 6);
  }, [industryResult]);

  const toggleApi = (slug: string) => {
    setSelectedApis((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleData = (slug: string) => {
    setSelectedData((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const applyPreset = (slugs: string[]) => {
    setSelectedApis((prev) => {
      const next = new Set(prev);
      for (const slug of slugs) {
        next.add(slug);
      }
      return next;
    });
  };

  const clearOptionalSelections = () => {
    setSelectedApis(new Set());
    setSelectedData(new Set());
  };

  const hasProblem = Boolean(problem);
  const hasBusiness = Boolean(industry);
  const hasSelections = selectedApis.size > 0 || selectedData.size > 0;
  const hasResults = recommendations.length > 0;

  const showPrimaryStepTwo = mode === "tools" || hasProblem;
  const showPrimaryStepThree = mode === "tools" || hasProblem;

  const canShowResults =
    mode === "problem"
      ? hasProblem
      : hasBusiness || selectedApis.size > 0 || selectedData.size > 0;

  return (
    <section
      id="workflow-finder"
      className="scroll-mt-24 rounded-xl border border-border/60 bg-card"
    >
      <div className="border-b border-border/60 px-5 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          Discovery mode
        </p>
        <SegmentedModeControl mode={mode} onChange={setMode} />
        <div className="mt-4">
          <StepProgress
            mode={mode}
            hasProblem={hasProblem}
            hasBusiness={hasBusiness}
            hasSelections={hasSelections}
            hasResults={hasResults}
          />
        </div>
      </div>

      <div className="space-y-6 px-5 py-5">
        {mode === "problem" && (
          <div>
            <h3 className="text-sm font-semibold">1. What are you trying to improve?</h3>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Choose the business problem that is most important to you. We&apos;ll recommend
              AI workflows that address that problem and show what you need to build them.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {businessProblemDefinitions.map((item) => {
                const isSelected = problem === item.slug;
                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setProblem((prev) => (prev === item.slug ? "" : item.slug))}
                    className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border/60 bg-surface hover:border-accent/40"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">{item.title}</span>
                      {isSelected && (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showPrimaryStepTwo && (
          <div>
            <h3 className="text-sm font-semibold">
              {mode === "problem" ? "2. What type of business do you run?" : "1. What type of business do you run?"}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {industryProfiles.map((profile) => {
                const isSelected = industry === profile.slug;
                return (
                  <button
                    key={profile.slug}
                    type="button"
                    onClick={() => setIndustry((prev) => (prev === profile.slug ? "" : profile.slug))}
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
        )}

        {showPrimaryStepThree && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {mode === "problem"
                    ? "3. What tools and data do you already have?"
                    : "2. What tools and data do you already have?"}
                </h3>
                <p className="mt-2 max-w-3xl text-sm text-muted">
                  This step is optional. Selecting what you already use helps us show which
                  workflows you can build now and what is still missing.
                </p>
              </div>
              <button
                type="button"
                onClick={clearOptionalSelections}
                className="text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                Skip this step
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-border/60 bg-surface/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tool presets</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.slugs)}
                    className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tools</p>
                  {selectedApis.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedApis(new Set())}
                      className="text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      Clear tools
                    </button>
                  )}
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">Search tools</span>
                  <input
                    type="search"
                    value={toolQuery}
                    onChange={(event) => {
                      setToolQuery(event.target.value);
                      if (event.target.value.trim()) setBrowseAllTools(true);
                    }}
                    placeholder="Search tools (Gmail, Square, Slack...)"
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availablePopularTools.map((tool) => (
                    <ToggleChip
                      key={tool.slug}
                      selected={selectedApis.has(tool.slug)}
                      label={tool.label}
                      onClick={() => toggleApi(tool.slug)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setBrowseAllTools((prev) => !prev)}
                  className="mt-3 text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  aria-expanded={browseAllTools}
                >
                  {browseAllTools ? "Hide full tool list" : "Browse all tools"}
                </button>
                {browseAllTools && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {filteredApis.map((api) => (
                      <button
                        key={api.slug}
                        type="button"
                        onClick={() => toggleApi(api.slug)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                          selectedApis.has(api.slug)
                            ? "border-accent bg-accent/10"
                            : "border-border/60 bg-background hover:border-accent/30"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                            selectedApis.has(api.slug)
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border"
                          }`}
                          aria-hidden="true"
                        >
                          {selectedApis.has(api.slug) ? "?" : ""}
                        </span>
                        <span className="font-medium">{toolLabel(api.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Data</p>
                  {selectedData.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedData(new Set())}
                      className="text-xs text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      Clear data
                    </button>
                  )}
                </div>
                <label className="mt-2 block">
                  <span className="sr-only">Search data</span>
                  <input
                    type="search"
                    value={dataQuery}
                    onChange={(event) => {
                      setDataQuery(event.target.value);
                      if (event.target.value.trim()) setBrowseAllData(true);
                    }}
                    placeholder="Search data (emails, reviews, transactions...)"
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availablePopularData.map((item) => (
                    <ToggleChip
                      key={item.slug}
                      selected={selectedData.has(item.slug)}
                      label={item.label}
                      onClick={() => toggleData(item.slug)}
                    />
                  ))}
                </div>
                {likelyDataSelections.length > 0 && (
                  <div className="mt-4 rounded-xl border border-border/60 bg-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Likely data for this business type
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {likelyDataSelections.map((dataSource) => (
                        <ToggleChip
                          key={dataSource.slug}
                          selected={selectedData.has(dataSource.slug)}
                          label={dataSource.name}
                          onClick={() => toggleData(dataSource.slug)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setBrowseAllData((prev) => !prev)}
                  className="mt-3 text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  aria-expanded={browseAllData}
                >
                  {browseAllData ? "Hide full data list" : "Browse all data"}
                </button>
                {browseAllData && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {filteredData.map((dataSource) => (
                      <button
                        key={dataSource.slug}
                        type="button"
                        onClick={() => toggleData(dataSource.slug)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                          selectedData.has(dataSource.slug)
                            ? "border-accent bg-accent/10"
                            : "border-border/60 bg-background hover:border-accent/30"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs ${
                            selectedData.has(dataSource.slug)
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border"
                          }`}
                          aria-hidden="true"
                        >
                          {selectedData.has(dataSource.slug) ? "?" : ""}
                        </span>
                        <span className="font-medium">{dataSource.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {industryResult?.profile && (
          <div className="rounded-lg border border-border/60 bg-surface/60 px-4 py-3">
            <p className="text-sm text-muted">{industryResult.profile.summary}</p>
            <p className="mt-2 text-sm font-medium">
              {industryResult.dataSources.length} likely data source
              {industryResult.dataSources.length !== 1 ? "s" : ""}
              <span className="mx-2 text-muted">·</span>
              {recommendations.length} recommended workflow
              {recommendations.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold">
            {mode === "problem" ? "4. Review recommended workflows" : "3. Review recommended workflows"}
          </h3>

          {!canShowResults ? (
            <p className="mt-3 text-sm text-muted">
              {mode === "problem"
                ? "Select a business problem to see recommended workflows."
                : "Choose a business type or select some tools or data to see recommended workflows."}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No workflows match this combination yet. Try another problem, business type, or a few more tools and data signals.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              <RecommendationGroup
                title="Best matches"
                description="Top recommendations based primarily on the business problem you selected."
                matches={groups.bestMatches}
                selectedProblem={problem || undefined}
                resolveApiName={resolveApiName}
                resolveDataSourceName={resolveDataSourceName}
              />
              <RecommendationGroup
                title="Can build now"
                description="Workflows where your selected tools, data, and capabilities already cover the requirements."
                matches={groups.canBuildNow}
                selectedProblem={problem || undefined}
                resolveApiName={resolveApiName}
                resolveDataSourceName={resolveDataSourceName}
              />
              <RecommendationGroup
                title="Needs one or two additions"
                description="Close fits that need only a small number of missing pieces."
                matches={groups.needsOneOrTwoAdditions}
                selectedProblem={problem || undefined}
                resolveApiName={resolveApiName}
                resolveDataSourceName={resolveDataSourceName}
              />
              <RecommendationGroup
                title="Longer-term opportunities"
                description="Useful ideas that likely need more setup, integrations, or data readiness."
                matches={groups.longerTermOpportunities}
                selectedProblem={problem || undefined}
                resolveApiName={resolveApiName}
                resolveDataSourceName={resolveDataSourceName}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RecommendationGroup({
  title,
  description,
  matches,
  selectedProblem,
  resolveApiName,
  resolveDataSourceName,
}: {
  title: string;
  description: string;
  matches: UseCaseRecommendation[];
  selectedProblem?: BusinessProblem;
  resolveApiName: (slug: string) => string;
  resolveDataSourceName: (slug: string) => string;
}) {
  if (matches.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <ul className="space-y-3">
        {matches.map((match) => (
          <RecommendationCard
            key={match.useCase.slug}
            match={match}
            selectedProblem={selectedProblem}
            resolveApiName={resolveApiName}
            resolveDataSourceName={resolveDataSourceName}
          />
        ))}
      </ul>
    </section>
  );
}

function RecommendationCard({
  match,
  selectedProblem,
  resolveApiName,
  resolveDataSourceName,
}: {
  match: UseCaseRecommendation;
  selectedProblem?: BusinessProblem;
  resolveApiName: (slug: string) => string;
  resolveDataSourceName: (slug: string) => string;
}) {
  const selectedProblemLabel = selectedProblem
    ? getBusinessProblemLabel(selectedProblem)
    : getBusinessProblemLabel(match.useCase.businessProblems[0]);

  const matchedToolNames = match.matchedApis.map((slug) => toolLabel(resolveApiName(slug)));
  const missingToolNames = match.missingApis.map((slug) => toolLabel(resolveApiName(slug)));
  const matchedDataNames = match.matchedData.map(resolveDataSourceName);
  const missingDataNames = match.missingData.map(resolveDataSourceName);

  return (
    <li className="rounded-xl border border-border/60 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/use-cases/${match.useCase.slug}`}
            className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {match.useCase.title}
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={statusVariant(match.readiness)}>{statusLabel(match.readiness)}</Badge>
          <Badge>{match.useCase.difficulty}</Badge>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
        <div>
          <dt className="font-semibold text-muted">Problem addressed</dt>
          <dd className="mt-1 text-foreground">{selectedProblemLabel}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Expected outcome</dt>
          <dd className="mt-1 text-foreground">
            {match.useCase.expectedOutcomes[0] ?? match.useCase.outcome}
          </dd>
        </div>
        <div className="lg:col-span-2">
          <dt className="font-semibold text-muted">How it works</dt>
          <dd className="mt-1 text-foreground">
            {buildHowItWorks(match, resolveDataSourceName)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-surface/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            You already have
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted">Tools</dt>
              <dd className="mt-0.5 text-foreground">
                {matchedToolNames.length > 0 ? matchedToolNames.join(" · ") : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Data</dt>
              <dd className="mt-0.5 text-foreground">
                {matchedDataNames.length > 0 ? matchedDataNames.join(" · ") : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Capabilities</dt>
              <dd className="mt-0.5 text-foreground">
                {match.hasLlm ? LLM_CAPABILITY_LABEL : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-border/60 bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Still needed
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted">Tools still needed</dt>
              <dd className="mt-0.5 text-foreground">
                {missingToolNames.length > 0 ? missingToolNames.join(" · ") : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Choose one compatible tool</dt>
              <dd className="mt-0.5 text-foreground">
                {match.requiresLlm
                  ? match.hasLlm
                    ? "Satisfied"
                    : LLM_COMPATIBLE_SUMMARY
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">Data still needed</dt>
              <dd className="mt-0.5 text-foreground">
                {missingDataNames.length > 0 ? missingDataNames.join(" · ") : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Link
        href={`/use-cases/${match.useCase.slug}`}
        className="mt-4 inline-block text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        View blueprint &rarr;
      </Link>
    </li>
  );
}

