export const BUSINESS_AREAS = [
  "sales",
  "marketing",
  "customer-service",
  "operations",
  "finance-accounting",
  "people-hr",
  "administration",
] as const;

export type BusinessArea = (typeof BUSINESS_AREAS)[number];

export type BusinessAreaDefinition = {
  slug: BusinessArea;
  title: string;
  /** Short summary used on cards and index listings. */
  description: string;
  /** Longer framing shown on the area detail page. */
  intro: string;
  processes: string[];
};

export const businessAreaDefinitions: BusinessAreaDefinition[] = [
  {
    slug: "sales",
    title: "Sales",
    description:
      "Lead management, follow-up, proposals, pipeline updates, and forecasting",
    intro:
      "Sales work slows down when leads sit unanswered, follow-ups depend on memory, and pipeline records fall out of date. These workflows help you keep track of opportunities and respond faster.",
    processes: [
      "Lead Capture & Qualification",
      "Follow-Up & Outreach",
      "CRM & Pipeline Management",
      "Quotes & Proposals",
      "Sales Forecasting",
    ],
  },
  {
    slug: "marketing",
    title: "Marketing",
    description:
      "Advertising, content, local search, reviews, customer insights, and reporting",
    intro:
      "Marketing often stalls because content planning, review management, and reporting all compete for the same limited time. These workflows help you stay visible and learn from what customers say.",
    processes: [
      "Advertising",
      "Content Planning & Creation",
      "SEO & Local Search",
      "Reviews & Reputation",
      "Campaign Reporting",
      "Customer Insights",
    ],
  },
  {
    slug: "customer-service",
    title: "Customer Service",
    description:
      "Inbox triage, response drafting, FAQs, escalations, and feedback analysis",
    intro:
      "Customer messages pile up during busy periods, and replies become inconsistent. These workflows help you answer sooner and spot the issues that need an owner's attention.",
    processes: [
      "Inbox & Ticket Triage",
      "Response Drafting",
      "FAQ & Self-Service",
      "Escalation Management",
      "Feedback Analysis",
    ],
  },
  {
    slug: "operations",
    title: "Operations",
    description:
      "Scheduling, inventory, orders, staffing, vendors, and recurring reports",
    intro:
      "Day-to-day operations depend on schedules, staffing, and recurring checks that are easy to postpone. These workflows help you keep the calendar full and the weekly routine consistent.",
    processes: [
      "Scheduling",
      "Inventory",
      "Order Management",
      "Staffing & Capacity",
      "Vendor Management",
      "Operational Reporting",
    ],
  },
  {
    slug: "finance-accounting",
    title: "Finance & Accounting",
    description:
      "Invoices, expenses, accounts payable, cash flow, budgeting, and reporting",
    intro:
      "Financial problems are usually visible in the data before they are visible in the bank account. These workflows help you see cash, cost, and margin changes earlier.",
    processes: [
      "Invoicing & Accounts Receivable",
      "Accounts Payable",
      "Expense Management",
      "Cash-Flow Planning",
      "Budgeting",
      "Financial Reporting",
    ],
  },
  {
    slug: "people-hr",
    title: "People & HR",
    description:
      "Hiring, onboarding, time and attendance, payroll preparation, training, and employee support",
    intro:
      "People processes rely on knowledge that often lives in one person's head. These workflows help you document how work gets done and prepare for payroll with fewer surprises.",
    processes: [
      "Recruiting",
      "Employee Onboarding",
      "Time & Attendance",
      "Payroll Preparation",
      "Employee Support",
      "Training & Performance",
    ],
  },
  {
    slug: "administration",
    title: "Administration",
    description:
      "Email handling, data entry, document processing, meeting follow-ups, approvals, and spreadsheet maintenance",
    intro:
      "Administrative work is rarely urgent but constantly expensive. These workflows help you cut manual reading, retyping, and tracker upkeep.",
    processes: [
      "Email & Inbox Management",
      "Data Entry",
      "Document Processing",
      "Meeting Follow-Up",
      "Approvals",
      "Spreadsheet Maintenance",
    ],
  },
];

const businessAreasBySlug = new Map(
  businessAreaDefinitions.map((area) => [area.slug, area] as const),
);

export function getBusinessArea(slug: string): BusinessAreaDefinition | undefined {
  return businessAreasBySlug.get(slug as BusinessArea);
}

export function getBusinessAreaTitle(slug: string): string {
  return businessAreasBySlug.get(slug as BusinessArea)?.title ?? slug;
}

export function isBusinessArea(slug: string): slug is BusinessArea {
  return businessAreasBySlug.has(slug as BusinessArea);
}
