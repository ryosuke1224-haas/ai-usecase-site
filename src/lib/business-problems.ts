export const BUSINESS_PROBLEMS = [
  "get-more-leads",
  "improve-marketing-performance",
  "increase-sales-conversion",
  "reduce-repetitive-admin-work",
  "improve-customer-retention",
  "understand-customer-feedback",
  "improve-scheduling-and-operations",
  "improve-cash-flow-and-planning",
] as const;

export type BusinessProblem = (typeof BUSINESS_PROBLEMS)[number];

export type BusinessProblemDefinition = {
  slug: BusinessProblem;
  title: string;
  description: string;
};

export const businessProblemDefinitions: BusinessProblemDefinition[] = [
  {
    slug: "get-more-leads",
    title: "Get more leads",
    description: "Find more qualified prospects and capture new opportunities.",
  },
  {
    slug: "improve-marketing-performance",
    title: "Improve marketing performance",
    description: "Create better campaigns, content, and local visibility.",
  },
  {
    slug: "increase-sales-conversion",
    title: "Increase sales conversion",
    description: "Help more leads turn into meetings, proposals, and closed deals.",
  },
  {
    slug: "reduce-repetitive-admin-work",
    title: "Reduce repetitive admin work",
    description: "Cut manual copy-paste, inbox triage, and tracker maintenance.",
  },
  {
    slug: "improve-customer-retention",
    title: "Improve customer retention",
    description: "Bring customers back, recover no-shows, and keep relationships warm.",
  },
  {
    slug: "understand-customer-feedback",
    title: "Understand customer feedback",
    description: "Learn from reviews and customer messages to improve the business.",
  },
  {
    slug: "improve-scheduling-and-operations",
    title: "Improve scheduling and operations",
    description: "Run appointments, staffing, SOPs, and team workflows more smoothly.",
  },
  {
    slug: "improve-cash-flow-and-planning",
    title: "Improve cash flow and planning",
    description: "Forecast cash, labor, pricing, and business performance earlier.",
  },
];

export const businessProblemLabels = new Map(
  businessProblemDefinitions.map((problem) => [problem.slug, problem.title] as const),
);

export function getBusinessProblemLabel(problem: BusinessProblem): string {
  return businessProblemLabels.get(problem) ?? problem;
}
