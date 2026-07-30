import fs from "fs";
import path from "path";
import {
  businessAreaDefinitions,
  type BusinessArea,
} from "../src/lib/business-areas";

/**
 * Business-first classification for published use cases.
 *
 * Each entry is derived from the existing title, summary, businessProblem and
 * outcome content of the use case. `outcome` is a short plain-language
 * restatement of the published `outcome` field — no new claims are introduced.
 *
 * `primary` decides where the full workflow card is rendered on a business-area
 * page; `related` processes are shown as labels only, so a workflow never
 * appears twice on the same page.
 */
type Classification = {
  area: BusinessArea;
  primary: string;
  related?: string[];
  outcome: string;
};

const classifications: Record<string, Classification> = {
  // ---------------------------------------------------------------- Sales
  "ai-local-lead-finder": {
    area: "sales",
    primary: "Lead Capture & Qualification",
    outcome: "A steady list of new local prospects without manual searching.",
  },
  "ai-account-research-assistant": {
    area: "sales",
    primary: "Lead Capture & Qualification",
    related: ["Follow-Up & Outreach"],
    outcome: "Less time researching accounts before you reach out.",
  },
  "ai-lead-scoring-engine": {
    area: "sales",
    primary: "Lead Capture & Qualification",
    related: ["CRM & Pipeline Management"],
    outcome: "Your team works the most promising leads first.",
  },
  "ai-crm-deduplication-enrichment": {
    area: "sales",
    primary: "CRM & Pipeline Management",
    related: ["Lead Capture & Qualification"],
    outcome: "Cleaner customer records and fewer duplicate contacts.",
  },
  "ai-crm-hygiene-monitor": {
    area: "sales",
    primary: "CRM & Pipeline Management",
    outcome: "More reliable pipeline information to make decisions from.",
  },
  "ai-pipeline-risk-detector": {
    area: "sales",
    primary: "CRM & Pipeline Management",
    related: ["Sales Forecasting"],
    outcome: "Stalled deals get attention before they go cold.",
  },
  "ai-follow-up-engine": {
    area: "sales",
    primary: "Follow-Up & Outreach",
    outcome: "Fewer leads forgotten because nobody followed up.",
  },
  "ai-personalized-outreach-writer": {
    area: "sales",
    primary: "Follow-Up & Outreach",
    outcome: "Outreach that feels specific without hours of writing.",
  },
  "ai-nurture-sequence-builder": {
    area: "sales",
    primary: "Follow-Up & Outreach",
    outcome: "Ready-to-use follow-up sequences for different customer types.",
  },
  "ai-sales-briefing": {
    area: "sales",
    primary: "Follow-Up & Outreach",
    outcome: "You walk into calls prepared instead of scrambling beforehand.",
  },
  "ai-meeting-prep-assistant": {
    area: "sales",
    primary: "Follow-Up & Outreach",
    outcome: "Fewer repeated questions and missed commitments in meetings.",
  },
  "quote-request-assistant": {
    area: "sales",
    primary: "Quotes & Proposals",
    outcome: "Quote requests are answered faster and nothing gets lost.",
  },
  "ai-proposal-follow-up-assistant": {
    area: "sales",
    primary: "Quotes & Proposals",
    related: ["Follow-Up & Outreach"],
    outcome: "More sent proposals get a reply instead of going quiet.",
  },

  // ------------------------------------------------------------ Marketing
  "ai-content-calendar": {
    area: "marketing",
    primary: "Content Planning & Creation",
    outcome: "Consistent posting without running out of ideas.",
  },
  "local-seo-content-assistant": {
    area: "marketing",
    primary: "SEO & Local Search",
    related: ["Content Planning & Creation"],
    outcome: "Better chances of being found in local searches.",
  },
  "ai-review-intelligence": {
    area: "marketing",
    primary: "Reviews & Reputation",
    related: ["Customer Insights"],
    outcome: "You see recurring complaints and praise instead of guessing.",
  },
  "ai-review-response-assistant": {
    area: "marketing",
    primary: "Reviews & Reputation",
    outcome: "Reviews get timely replies without daily monitoring.",
  },
  "inactive-customer-winback": {
    area: "marketing",
    primary: "Customer Insights",
    outcome: "Some lapsed customers return without new ad spend.",
  },

  // ----------------------------------------------------- Customer Service
  "ai-customer-response-assistant": {
    area: "customer-service",
    primary: "Response Drafting",
    related: ["Inbox & Ticket Triage", "Escalation Management"],
    outcome: "Faster, more consistent replies to customer questions.",
  },

  // ----------------------------------------------------------- Operations
  "ai-booking-optimizer": {
    area: "operations",
    primary: "Scheduling",
    outcome: "Fewer empty slots and better-prepared staff.",
  },
  "no-show-recovery-assistant": {
    area: "operations",
    primary: "Scheduling",
    outcome: "More missed appointments get rebooked.",
  },
  "ai-staffing-optimizer": {
    area: "operations",
    primary: "Staffing & Capacity",
    outcome: "Staffing matches demand more closely week to week.",
  },
  "weekly-owner-briefing": {
    area: "operations",
    primary: "Operational Reporting",
    outcome: "A clear weekly picture of the business without building reports.",
  },

  // -------------------------------------------------- Finance & Accounting
  "ai-collections-assistant": {
    area: "finance-accounting",
    primary: "Invoicing & Accounts Receivable",
    outcome: "Overdue invoices get chased consistently.",
  },
  "ai-expense-watchdog": {
    area: "finance-accounting",
    primary: "Expense Management",
    outcome: "Unnecessary recurring costs get noticed and cut.",
  },
  "ai-cash-flow-forecaster": {
    area: "finance-accounting",
    primary: "Cash-Flow Planning",
    outcome: "You see cash shortfalls weeks earlier.",
  },
  "ai-hiring-affordability-planner": {
    area: "finance-accounting",
    primary: "Cash-Flow Planning",
    related: ["Budgeting"],
    outcome: "Hiring decisions are based on numbers, not guesswork.",
  },
  "ai-budget-variance-explainer": {
    area: "finance-accounting",
    primary: "Budgeting",
    related: ["Financial Reporting"],
    outcome: "You understand why the numbers missed, in plain English.",
  },
  "ai-revenue-scenario-planner": {
    area: "finance-accounting",
    primary: "Budgeting",
    outcome: "You can compare plans before committing to one.",
  },
  "ai-pricing-impact-simulator": {
    area: "finance-accounting",
    primary: "Budgeting",
    outcome: "Price changes can be tested before you announce them.",
  },
  "ai-break-even-dashboard": {
    area: "finance-accounting",
    primary: "Financial Reporting",
    related: ["Budgeting"],
    outcome: "You know what you need to earn to cover costs.",
  },

  // ----------------------------------------------------------- People & HR
  "ai-payroll-forecasting": {
    area: "people-hr",
    primary: "Payroll Preparation",
    outcome: "Payroll costs are known before the pay run, not after.",
  },
  "ai-sop-builder": {
    area: "people-hr",
    primary: "Employee Onboarding",
    related: ["Training & Performance"],
    outcome: "Written procedures new hires can actually follow.",
  },
  "staff-training-assistant": {
    area: "people-hr",
    primary: "Training & Performance",
    related: ["Employee Support"],
    outcome: "New staff get answers without interrupting the owner.",
  },

  // -------------------------------------------------------- Administration
  "ai-daily-inbox-briefing": {
    area: "administration",
    primary: "Email & Inbox Management",
    outcome: "You start the day knowing what actually needs attention.",
  },
  "ai-admin-organizer": {
    area: "administration",
    primary: "Spreadsheet Maintenance",
    related: ["Data Entry", "Email & Inbox Management"],
    outcome: "Trackers stay current without manual retyping.",
  },
};

const USE_CASE_DIR = path.join(process.cwd(), "content", "published", "use-cases");

const validProcessesByArea = new Map(
  businessAreaDefinitions.map(
    (area) => [area.slug, new Set(area.processes)] as const,
  ),
);

function assertValidClassification(slug: string, entry: Classification) {
  const validProcesses = validProcessesByArea.get(entry.area);
  if (!validProcesses) {
    throw new Error(`Unknown business area "${entry.area}" for ${slug}`);
  }

  for (const process of [entry.primary, ...(entry.related ?? [])]) {
    if (!validProcesses.has(process)) {
      throw new Error(
        `Process "${process}" is not part of area "${entry.area}" (${slug})`,
      );
    }
  }

  if (entry.related?.includes(entry.primary)) {
    throw new Error(`Primary process repeated in related list for ${slug}`);
  }
}

function main() {
  const files = fs
    .readdirSync(USE_CASE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();

  const unclassified: string[] = [];
  let updated = 0;

  for (const file of files) {
    const fullPath = path.join(USE_CASE_DIR, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as Record<
      string,
      unknown
    > & { slug: string };

    const entry = classifications[raw.slug];
    if (!entry) {
      unclassified.push(raw.slug);
      continue;
    }

    assertValidClassification(raw.slug, entry);
    const related = entry.related ?? [];

    // Rebuild the object so the new business fields sit next to businessFunctions.
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (
        key === "businessArea" ||
        key === "businessProcesses" ||
        key === "primaryBusinessProcess" ||
        key === "relatedBusinessProcesses" ||
        key === "businessOutcomes"
      ) {
        continue;
      }

      next[key] = value;
      if (key === "businessFunctions") {
        next.businessArea = entry.area;
        next.primaryBusinessProcess = entry.primary;
        if (related.length > 0) next.relatedBusinessProcesses = related;
        next.businessProcesses = [entry.primary, ...related];
        next.businessOutcomes = [entry.outcome];
      }
    }

    fs.writeFileSync(fullPath, `${JSON.stringify(next, null, 2)}\n`);
    updated += 1;
  }

  console.log(`Classified ${updated} use cases.`);
  if (unclassified.length > 0) {
    console.log(`Left unclassified (${unclassified.length}):`);
    for (const slug of unclassified) console.log(`  ${slug}`);
  } else {
    console.log("No unclassified use cases.");
  }

  // Report process coverage so empty processes are visible at a glance.
  console.log("\nProcess coverage:");
  for (const area of businessAreaDefinitions) {
    const primaries = new Set(
      Object.values(classifications)
        .filter((entry) => entry.area === area.slug)
        .map((entry) => entry.primary),
    );
    const empty = area.processes.filter((process) => !primaries.has(process));
    console.log(
      `  ${area.title}: ${area.processes.length - empty.length}/${area.processes.length} covered${
        empty.length > 0 ? ` — empty: ${empty.join(", ")}` : ""
      }`,
    );
  }
}

main();
