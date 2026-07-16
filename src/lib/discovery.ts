import type {
  ApiTool,
  DataSource,
  UseCase,
  WorkflowIdea,
} from "@/src/content/schemas";
import type { PublishedContent } from "@/src/content/load-published";
import {
  getIndustryProfile,
  industryProfiles,
} from "@/src/data/industryProfiles";

export type ApiMatchResult = {
  useCase: UseCase;
  matchType: "ready" | "partial";
  matchedApis: string[];
  missingApis: string[];
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

const LLM_SLUGS = ["openai-api", "anthropic-claude-api", "google-gemini-api"];

export function findUseCasesByApis(
  selectedSlugs: string[],
  useCases: UseCase[],
): ApiMatchResult[] {
  if (selectedSlugs.length === 0) return [];

  const selected = new Set(selectedSlugs);

  return useCases
    .map((useCase) => {
      const required = useCase.requiredApis;
      const nonLlmRequired = required.filter((a) => !LLM_SLUGS.includes(a));
      const missingAll = required.filter((a) => !selected.has(a));
      const matched = required.filter((a) => selected.has(a));
      const hasLlm = required.some((a) => LLM_SLUGS.includes(a));
      const hasSelectedLlm = LLM_SLUGS.some((a) => selected.has(a));

      const ready =
        nonLlmRequired.every((a) => selected.has(a)) &&
        (!hasLlm || hasSelectedLlm) &&
        matched.length > 0;
      const partial = !ready && matched.length > 0;

      if (!ready && !partial) return null;

      return {
        useCase,
        matchType: ready ? ("ready" as const) : ("partial" as const),
        matchedApis: matched,
        missingApis: missingAll,
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

  return workflowIdeas
    .map((workflow) => {
      const required = workflow.apiCombination;
      const missing = required.filter((a) => !selected.has(a));
      const matched = required.filter((a) => selected.has(a));
      const ready = missing.length === 0;
      const partial = !ready && matched.length >= 2;

      if (!ready && !partial) return null;

      return {
        workflow,
        matchType: ready ? ("ready" as const) : ("partial" as const),
        matchedApis: matched,
        missingApis: missing,
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
      label: "Gmail + Sheets + OpenAI",
      slugs: ["gmail-api", "google-sheets-api", "openai-api"],
    },
    {
      label: "Square + Gmail + Twilio",
      slugs: ["square-api", "gmail-api", "twilio-api"],
    },
    {
      label: "Calendly + Slack + OpenAI",
      slugs: ["calendly-api", "slack-api", "openai-api"],
    },
    {
      label: "Google Reviews + OpenAI",
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
