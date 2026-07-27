import type {
  ApiTool,
  BusinessProblem,
  DataSource,
  UseCase,
  WorkflowIdea,
} from "@/src/content/schemas";
import type { PublishedContent } from "@/src/content/load-published";
import {
  getIndustryProfile,
  industryProfiles,
} from "@/src/data/industryProfiles";
import { isLlmSlug, hasAnyLlm } from "@/src/lib/llm";

export type ApiMatchResult = {
  useCase: UseCase;
  matchType: "ready" | "partial";
  matchedApis: string[];
  missingApis: string[];
  /** Whether this use case requires an LLM capability (any provider). */
  requiresLlm: boolean;
  /** Whether the user has selected at least one LLM provider. */
  hasLlm: boolean;
};

export type WorkflowMatchResult = {
  workflow: WorkflowIdea;
  matchType: "ready" | "partial";
  matchedApis: string[];
  missingApis: string[];
};

export type IndustryDiscoveryResult = {
  profile: ReturnType<typeof getIndustryProfile>;
  useCases: UseCase[];
  dataSources: DataSource[];
  workflows: WorkflowIdea[];
};

export type SearchResult = {
  type: "use-case" | "api" | "data-source" | "workflow";
  slug: string;
  title: string;
  summary: string;
  href: string;
};

export type DiscoveryMode = "problem" | "tools";

export type UseCaseRecommendation = {
  useCase: UseCase;
  score: number;
  matchedApis: string[];
  missingApis: string[];
  matchedData: string[];
  missingData: string[];
  inferredApis: string[];
  inferredData: string[];
  requiresLlm: boolean;
  hasLlm: boolean;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  industryMatched: boolean;
  problemMatched: boolean;
  readiness: "ready" | "almost-ready" | "needs-setup";
  totalMissingCount: number;
};

export type UseCaseRecommendationGroups = {
  bestMatches: UseCaseRecommendation[];
  canBuildNow: UseCaseRecommendation[];
  needsOneOrTwoAdditions: UseCaseRecommendation[];
  longerTermOpportunities: UseCaseRecommendation[];
};

export type RecommendationParams = {
  mode: DiscoveryMode;
  problem?: BusinessProblem;
  industry?: string;
  selectedApis: string[];
  selectedData: string[];
};

function difficultyWeight(difficulty: UseCase["difficulty"]) {
  if (difficulty === "Beginner") return 6;
  if (difficulty === "Intermediate") return 3;
  return 0;
}

function useCaseMatchesIndustry(useCase: UseCase, industrySlug: string) {
  const profile = getIndustryProfile(industrySlug);
  if (!profile) return false;

  return (
    profile.starterWorkflows.includes(useCase.slug) ||
    useCase.industries.some(
      (industry) =>
        industry.toLowerCase().includes(profile.name.split(" ")[0].toLowerCase()) ||
        industry === profile.name ||
        (profile.slug === "fitness-studio" && industry === "Fitness") ||
        (profile.slug === "restaurant" && industry === "Restaurants") ||
        (profile.slug === "home-services" && industry === "Home Services") ||
        (profile.slug === "salon-spa" && industry === "Salons") ||
        (profile.slug === "consulting-agency" &&
          ["Consulting", "Agencies", "Professional Services"].includes(industry)) ||
        (profile.slug === "retail-shop" && industry === "Retail"),
    )
  );
}

function getRequiredCapabilities(useCase: UseCase) {
  const capabilities = new Set(useCase.requiredCapabilities);
  if (useCase.requiredApis.some(isLlmSlug)) {
    capabilities.add("llm");
  }
  return [...capabilities];
}

function buildRecommendation(
  useCase: UseCase,
  params: RecommendationParams,
): UseCaseRecommendation {
  const selectedApis = new Set(params.selectedApis);
  const selectedData = new Set(params.selectedData);
  const profile = params.industry ? getIndustryProfile(params.industry) : undefined;
  const likelyApis = new Set(profile?.apisYouLikelyUse ?? []);
  const likelyData = new Set(profile?.dataYouLikelyHave ?? []);

  const requiredCapabilities = getRequiredCapabilities(useCase);
  const requiredNonLlmApis = useCase.requiredApis.filter((slug) => !isLlmSlug(slug));
  const matchedApis = requiredNonLlmApis.filter((slug) => selectedApis.has(slug));
  const missingApis = requiredNonLlmApis.filter((slug) => !selectedApis.has(slug));
  const inferredApis = missingApis.filter((slug) => likelyApis.has(slug));

  const matchedData = useCase.requiredData.filter((slug) => selectedData.has(slug));
  const missingData = useCase.requiredData.filter((slug) => !selectedData.has(slug));
  const inferredData = missingData.filter((slug) => likelyData.has(slug));

  const requiresLlm = requiredCapabilities.includes("llm");
  const hasLlm = hasAnyLlm(selectedApis);
  const matchedCapabilities = requiresLlm && hasLlm ? ["llm"] : [];
  const missingCapabilities = requiresLlm && !hasLlm ? ["llm"] : [];

  const problemMatched = params.problem
    ? useCase.businessProblems.includes(params.problem)
    : false;
  const industryMatched = params.industry
    ? useCaseMatchesIndustry(useCase, params.industry)
    : false;

  const totalMissingCount =
    missingApis.length + missingData.length + missingCapabilities.length;

  const readiness =
    totalMissingCount === 0
      ? ("ready" as const)
      : totalMissingCount <= 2
        ? ("almost-ready" as const)
        : ("needs-setup" as const);

  let score = 0;
  if (params.mode === "problem") {
    score += problemMatched ? 1000 : 0;
    score += industryMatched ? 180 : 0;
  } else {
    score += matchedApis.length * 40;
    score += matchedData.length * 24;
    score += matchedCapabilities.length * 45;
    score += industryMatched ? 90 : 0;
  }

  score += matchedApis.length * 18;
  score += matchedData.length * 10;
  score += matchedCapabilities.length * 25;
  score += inferredApis.length * 4;
  score += inferredData.length * 3;
  score += difficultyWeight(useCase.difficulty);
  score -= totalMissingCount * 7;

  return {
    useCase,
    score,
    matchedApis,
    missingApis,
    matchedData,
    missingData,
    inferredApis,
    inferredData,
    requiresLlm,
    hasLlm,
    matchedCapabilities,
    missingCapabilities,
    industryMatched,
    problemMatched,
    readiness,
    totalMissingCount,
  };
}

export function recommendUseCases(
  params: RecommendationParams,
  useCases: UseCase[],
): UseCaseRecommendation[] {
  const hasSignals =
    Boolean(params.problem) ||
    Boolean(params.industry) ||
    params.selectedApis.length > 0 ||
    params.selectedData.length > 0;

  if (!hasSignals) return [];

  return useCases
    .filter((useCase) => {
      if (params.mode === "problem") {
        return params.problem
          ? useCase.businessProblems.includes(params.problem)
          : true;
      }

      const selected = new Set(params.selectedApis);
      const selectedData = new Set(params.selectedData);
      const hasToolMatch = useCase.requiredApis.some(
        (slug) => !isLlmSlug(slug) && selected.has(slug),
      );
      const hasDataMatch = useCase.requiredData.some((slug) =>
        selectedData.has(slug),
      );
      const hasIndustryMatch = params.industry
        ? useCaseMatchesIndustry(useCase, params.industry)
        : false;

      return (
        hasToolMatch ||
        hasDataMatch ||
        hasIndustryMatch ||
        (useCase.requiredApis.some(isLlmSlug) && hasAnyLlm(selected))
      );
    })
    .map((useCase) => buildRecommendation(useCase, params))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.totalMissingCount !== b.totalMissingCount) {
        return a.totalMissingCount - b.totalMissingCount;
      }
      return a.useCase.title.localeCompare(b.useCase.title);
    });
}

export function groupUseCaseRecommendations(
  matches: UseCaseRecommendation[],
): UseCaseRecommendationGroups {
  const bestMatches = matches.slice(0, 3);
  const bestSlugs = new Set(bestMatches.map((match) => match.useCase.slug));

  const remaining = matches.filter((match) => !bestSlugs.has(match.useCase.slug));

  const canBuildNow = remaining.filter((match) => match.readiness === "ready");
  const canBuildSlugs = new Set(canBuildNow.map((match) => match.useCase.slug));

  const additions = remaining.filter(
    (match) =>
      !canBuildSlugs.has(match.useCase.slug) &&
      match.readiness === "almost-ready",
  );
  const additionSlugs = new Set(additions.map((match) => match.useCase.slug));

  const longerTermOpportunities = remaining.filter(
    (match) =>
      !canBuildSlugs.has(match.useCase.slug) &&
      !additionSlugs.has(match.useCase.slug),
  );

  return {
    bestMatches,
    canBuildNow,
    needsOneOrTwoAdditions: additions,
    longerTermOpportunities,
  };
}

export function findUseCasesByApis(
  selectedSlugs: string[],
  useCases: UseCase[],
): ApiMatchResult[] {
  if (selectedSlugs.length === 0) return [];

  const selected = new Set(selectedSlugs);
  const userHasLlm = hasAnyLlm(selected);

  return useCases
    .map((useCase) => {
      const required = useCase.requiredApis;

      const nonLlmRequired = required.filter((a) => !isLlmSlug(a));
      const requiresLlm = required.some(isLlmSlug);

      // Non-LLM matches
      const matchedNonLlm = nonLlmRequired.filter((a) => selected.has(a));
      const missingNonLlm = nonLlmRequired.filter((a) => !selected.has(a));

      // LLM match: user has any LLM provider → LLM requirement is satisfied
      const llmSatisfied = !requiresLlm || userHasLlm;

      const ready =
        missingNonLlm.length === 0 && llmSatisfied && matchedNonLlm.length > 0;
      const partial =
        !ready &&
        (matchedNonLlm.length > 0 || (requiresLlm && userHasLlm));

      if (!ready && !partial) return null;

      // For missingApis, only include non-LLM tools.
      // LLM requirement is shown separately in the UI.
      return {
        useCase,
        matchType: ready ? ("ready" as const) : ("partial" as const),
        matchedApis: matchedNonLlm,
        missingApis: missingNonLlm,
        requiresLlm,
        hasLlm: userHasLlm,
      };
    })
    .filter((r): r is ApiMatchResult => r !== null)
    .sort((a, b) => {
      if (a.matchType !== b.matchType) return a.matchType === "ready" ? -1 : 1;
      return b.matchedApis.length - a.matchedApis.length;
    });
}

export function findWorkflowsByApis(
  selectedSlugs: string[],
  workflowIdeas: WorkflowIdea[],
): WorkflowMatchResult[] {
  if (selectedSlugs.length === 0) return [];

  const selected = new Set(selectedSlugs);
  const userHasLlm = hasAnyLlm(selected);

  return workflowIdeas
    .map((workflow) => {
      const required = workflow.apiCombination;
      const requiresLlm = required.some(isLlmSlug);
      const nonLlm = required.filter((a) => !isLlmSlug(a));

      const missingNonLlm = nonLlm.filter((a) => !selected.has(a));
      const matchedNonLlm = nonLlm.filter((a) => selected.has(a));
      const llmSatisfied = !requiresLlm || userHasLlm;

      const ready = missingNonLlm.length === 0 && llmSatisfied;
      const partial = !ready && (matchedNonLlm.length >= 2 || (matchedNonLlm.length >= 1 && llmSatisfied));

      if (!ready && !partial) return null;

      return {
        workflow,
        matchType: ready ? ("ready" as const) : ("partial" as const),
        matchedApis: matchedNonLlm,
        missingApis: missingNonLlm,
      };
    })
    .filter((r): r is WorkflowMatchResult => r !== null)
    .sort((a, b) => {
      if (a.matchType !== b.matchType) return a.matchType === "ready" ? -1 : 1;
      return b.matchedApis.length - a.matchedApis.length;
    });
}

export function discoverByIndustry(
  slug: string,
  content: Pick<PublishedContent, "useCases" | "dataSources" | "workflowIdeas">,
): IndustryDiscoveryResult | null {
  const profile = getIndustryProfile(slug);
  if (!profile) return null;

  const { useCases, dataSources, workflowIdeas } = content;
  const nameMatch = profile.name;

  const matchedUseCases = useCases.filter(
    (uc) =>
      profile.starterWorkflows.includes(uc.slug) ||
      uc.industries.some(
        (i) =>
          i.toLowerCase().includes(profile.name.split(" ")[0].toLowerCase()) ||
          i === nameMatch ||
          (profile.slug === "fitness-studio" && i === "Fitness") ||
          (profile.slug === "restaurant" && i === "Restaurants") ||
          (profile.slug === "home-services" && i === "Home Services") ||
          (profile.slug === "salon-spa" && i === "Salons") ||
          (profile.slug === "consulting-agency" &&
            ["Consulting", "Agencies", "Professional Services"].includes(i)) ||
          (profile.slug === "retail-shop" && i === "Retail"),
      ),
  );

  const dataSlugs = new Set([
    ...profile.dataYouLikelyHave,
    ...matchedUseCases.flatMap((uc) => uc.requiredDataSources),
  ]);

  const matchedDataSources = dataSources.filter((ds) => dataSlugs.has(ds.slug));

  const matchedWorkflows = workflowIdeas.filter((wf) =>
    wf.possibleUseCases.some((uc) =>
      matchedUseCases.some((m) => m.slug === uc),
    ),
  );

  return {
    profile,
    useCases: matchedUseCases,
    dataSources: matchedDataSources,
    workflows: matchedWorkflows,
  };
}

export function globalSearch(
  query: string,
  content: PublishedContent,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const uc of content.useCases) {
    const haystack = [uc.title, uc.summary, ...uc.tags, ...uc.industries]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "use-case",
        slug: uc.slug,
        title: uc.title,
        summary: uc.summary,
        href: `/use-cases/${uc.slug}`,
      });
    }
  }

  for (const api of content.apis) {
    const haystack = [api.name, api.summary, api.provider, ...api.tags]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "api",
        slug: api.slug,
        title: api.name,
        summary: api.summary,
        href: `/apis/${api.slug}`,
      });
    }
  }

  for (const ds of content.dataSources) {
    const haystack = [ds.name, ds.summary, ...ds.tags].join(" ").toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "data-source",
        slug: ds.slug,
        title: ds.name,
        summary: ds.summary,
        href: `/data-sources/${ds.slug}`,
      });
    }
  }

  for (const wf of content.workflowIdeas) {
    const haystack = [wf.title, wf.summary, ...wf.recommendedFor]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(q)) {
      results.push({
        type: "workflow",
        slug: wf.slug,
        title: wf.title,
        summary: wf.summary,
        href: "/workflow-ideas",
      });
    }
  }

  return results.slice(0, 12);
}

export function getApiPresets() {
  return [
    {
      label: "Gmail + Google Calendar",
      slugs: ["gmail-api", "google-calendar-api"],
    },
    {
      label: "Gmail + Sheets + AI model",
      slugs: ["gmail-api", "google-sheets-api", "openai-api"],
    },
    {
      label: "Square + Gmail + Twilio",
      slugs: ["square-api", "gmail-api", "twilio-api"],
    },
    {
      label: "Calendly + Slack + AI model",
      slugs: ["calendly-api", "slack-api", "openai-api"],
    },
    {
      label: "Google Reviews + AI model",
      slugs: ["google-business-profile-api", "openai-api"],
    },
  ];
}

export { industryProfiles };

export function getUseCaseCategories(useCases: UseCase[]) {
  return [...new Set(useCases.map((uc) => uc.category))];
}

export function getUseCaseIndustries(useCases: UseCase[]) {
  return [...new Set(useCases.flatMap((uc) => uc.industries))];
}

export function getUseCaseBusinessFunctions(useCases: UseCase[]) {
  return [...new Set(useCases.flatMap((uc) => uc.businessFunctions))];
}
