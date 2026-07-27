import fs from "fs";
import path from "path";
import { BUSINESS_PROBLEMS, type BusinessProblem } from "../src/lib/business-problems";
import { isLlmSlug } from "../src/lib/llm";

type UseCaseRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  tagline?: string;
  industries: string[];
  businessFunctions: string[];
  summary: string;
  businessProblem: string;
  businessProblems?: string[];
  outcome: string;
  expectedOutcomes?: string[];
  whoItsFor: string;
  requiredDataSources: string[];
  requiredData?: string[];
  aiInputs: string[];
  aiOutputs: string[];
  requiredApis: string[];
  requiredCapabilities?: string[];
  noCodeTools: string[];
  lowCodeTools: string[];
  customBuildStack: string[];
  implementationSteps: string[];
  systemBehavior: string[];
  risks: string[];
  difficulty: string;
  automationLevel: string;
  valuePotential: string;
  relatedUseCases: string[];
  tags: string[];
  featured: boolean;
};

const VALID_PROBLEMS = new Set<string>(BUSINESS_PROBLEMS);

const problemMap: Record<string, BusinessProblem[]> = {
  "ai-account-research-assistant": [
    "get-more-leads",
    "increase-sales-conversion",
  ],
  "ai-admin-organizer": [
    "reduce-repetitive-admin-work",
    "improve-scheduling-and-operations",
  ],
  "ai-booking-optimizer": [
    "improve-scheduling-and-operations",
    "improve-customer-retention",
  ],
  "ai-break-even-dashboard": ["improve-cash-flow-and-planning"],
  "ai-budget-variance-explainer": ["improve-cash-flow-and-planning"],
  "ai-cash-flow-forecaster": ["improve-cash-flow-and-planning"],
  "ai-collections-assistant": ["improve-cash-flow-and-planning"],
  "ai-content-calendar": ["improve-marketing-performance"],
  "ai-crm-deduplication-enrichment": [
    "get-more-leads",
    "increase-sales-conversion",
  ],
  "ai-crm-hygiene-monitor": [
    "increase-sales-conversion",
    "reduce-repetitive-admin-work",
  ],
  "ai-customer-response-assistant": [
    "improve-customer-retention",
    "reduce-repetitive-admin-work",
  ],
  "ai-daily-inbox-briefing": [
    "reduce-repetitive-admin-work",
    "improve-scheduling-and-operations",
  ],
  "ai-expense-watchdog": ["improve-cash-flow-and-planning"],
  "ai-follow-up-engine": [
    "increase-sales-conversion",
    "improve-customer-retention",
  ],
  "ai-hiring-affordability-planner": ["improve-cash-flow-and-planning"],
  "ai-lead-scoring-engine": [
    "get-more-leads",
    "increase-sales-conversion",
  ],
  "ai-local-lead-finder": [
    "get-more-leads",
    "improve-marketing-performance",
  ],
  "ai-meeting-prep-assistant": [
    "increase-sales-conversion",
    "improve-scheduling-and-operations",
  ],
  "ai-nurture-sequence-builder": [
    "improve-marketing-performance",
    "increase-sales-conversion",
  ],
  "ai-payroll-forecasting": ["improve-cash-flow-and-planning"],
  "ai-personalized-outreach-writer": [
    "get-more-leads",
    "increase-sales-conversion",
  ],
  "ai-pipeline-risk-detector": ["increase-sales-conversion"],
  "ai-pricing-impact-simulator": ["improve-cash-flow-and-planning"],
  "ai-proposal-follow-up-assistant": ["increase-sales-conversion"],
  "ai-revenue-scenario-planner": ["improve-cash-flow-and-planning"],
  "ai-review-intelligence": [
    "understand-customer-feedback",
    "improve-marketing-performance",
  ],
  "ai-review-response-assistant": [
    "understand-customer-feedback",
    "improve-customer-retention",
  ],
  "ai-sales-briefing": ["increase-sales-conversion"],
  "ai-sop-builder": [
    "reduce-repetitive-admin-work",
    "improve-scheduling-and-operations",
  ],
  "ai-staffing-optimizer": [
    "improve-scheduling-and-operations",
    "improve-cash-flow-and-planning",
  ],
  "inactive-customer-winback": ["improve-customer-retention"],
  "local-seo-content-assistant": [
    "improve-marketing-performance",
    "get-more-leads",
  ],
  "no-show-recovery-assistant": [
    "improve-customer-retention",
    "improve-scheduling-and-operations",
  ],
  "quote-request-assistant": [
    "increase-sales-conversion",
    "reduce-repetitive-admin-work",
  ],
  "staff-training-assistant": [
    "improve-scheduling-and-operations",
    "reduce-repetitive-admin-work",
  ],
  "weekly-owner-briefing": [
    "improve-cash-flow-and-planning",
    "reduce-repetitive-admin-work",
  ],
};

const USE_CASE_DIR = path.join(process.cwd(), "content", "published", "use-cases");

function assertProblemCoverage(slug: string, problems: BusinessProblem[] | undefined) {
  if (!problems || problems.length === 0) {
    throw new Error(`Missing businessProblems mapping for ${slug}`);
  }

  for (const problem of problems) {
    if (!VALID_PROBLEMS.has(problem)) {
      throw new Error(`Invalid problem "${problem}" for ${slug}`);
    }
  }
}

function buildUpdatedUseCase(useCase: UseCaseRecord): UseCaseRecord {
  const businessProblems = problemMap[useCase.slug];
  assertProblemCoverage(useCase.slug, businessProblems);

  const requiredCapabilities = useCase.requiredApis.some(isLlmSlug) ? ["llm"] : [];

  return {
    id: useCase.id,
    slug: useCase.slug,
    title: useCase.title,
    category: useCase.category,
    ...(useCase.tagline ? { tagline: useCase.tagline } : {}),
    industries: useCase.industries,
    businessFunctions: useCase.businessFunctions,
    summary: useCase.summary,
    businessProblem: useCase.businessProblem,
    businessProblems,
    outcome: useCase.outcome,
    expectedOutcomes: [useCase.outcome],
    whoItsFor: useCase.whoItsFor,
    requiredDataSources: useCase.requiredDataSources,
    requiredData: useCase.requiredDataSources,
    aiInputs: useCase.aiInputs,
    aiOutputs: useCase.aiOutputs,
    requiredApis: useCase.requiredApis,
    requiredCapabilities,
    noCodeTools: useCase.noCodeTools,
    lowCodeTools: useCase.lowCodeTools,
    customBuildStack: useCase.customBuildStack,
    implementationSteps: useCase.implementationSteps,
    systemBehavior: useCase.systemBehavior,
    risks: useCase.risks,
    difficulty: useCase.difficulty,
    automationLevel: useCase.automationLevel,
    valuePotential: useCase.valuePotential,
    relatedUseCases: useCase.relatedUseCases,
    tags: useCase.tags,
    featured: useCase.featured,
  };
}

function main() {
  const files = fs
    .readdirSync(USE_CASE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();

  for (const file of files) {
    const fullPath = path.join(USE_CASE_DIR, file);
    const useCase = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as UseCaseRecord;
    const updated = buildUpdatedUseCase(useCase);
    fs.writeFileSync(fullPath, `${JSON.stringify(updated, null, 2)}\n`);
  }

  console.log(`Updated ${files.length} use cases.`);
}

main();
