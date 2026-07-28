import { TallyEmbed } from "@/components/home/tally-embed";
import { CONTACT_EMAIL } from "@/src/lib/site";

const businessAreas = [
  {
    title: "Sales",
    description:
      "Lead follow-up, qualification, proposals, and pipeline updates",
  },
  {
    title: "Marketing",
    description:
      "Advertising analysis, content planning, reviews, and reporting",
  },
  {
    title: "Customer Service",
    description:
      "Inbox triage, response drafting, FAQs, and feedback analysis",
  },
  {
    title: "Operations",
    description:
      "Scheduling, inventory, order management, and recurring reports",
  },
  {
    title: "Finance & Accounting",
    description:
      "Invoices, expenses, cash-flow planning, and financial reporting",
  },
  {
    title: "People & HR",
    description:
      "Hiring, onboarding, timesheets, payroll preparation, and employee support",
  },
  {
    title: "Administration",
    description:
      "Email handling, data entry, document processing, meeting follow-ups, and spreadsheet updates",
  },
] as const;

const steps = [
  {
    number: "1",
    title: "Tell us what is taking too much time",
    description: "Share a repetitive task or manual process in your business.",
  },
  {
    number: "2",
    title: "We identify where AI could help",
    description:
      "We look for practical opportunities that fit how your business works.",
  },
  {
    number: "3",
    title: "Choose how you want to get started",
    description:
      "Try it yourself with a practical guide, use a simple local tool, or get help implementing it.",
  },
] as const;

function getConfiguredTallyFormUrl() {
  const raw = process.env.NEXT_PUBLIC_TALLY_FORM_URL?.trim();
  if (!raw) return undefined;

  try {
    return new URL(raw).toString();
  } catch {
    return undefined;
  }
}

export function ComingSoonPage() {
  const tallyFormUrl = getConfiguredTallyFormUrl();

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
      {/* Hero */}
      <section className="rounded-2xl border border-border/60 bg-card px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent sm:text-xs">
          AI Workflows for Small Businesses
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
          Discover where AI can save time in your business
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          AI Use Case Atlas helps small businesses discover practical ways to
          reduce repetitive work, improve operations, and make better decisions
          with AI.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#workflow-request"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Tell us what you want to automate
          </a>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
          AI Use Case Atlas is currently in development. Join the early access
          list or share a workflow you want us to explore.
        </p>
      </section>

      {/* Business areas */}
      <section className="mt-16 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Where could AI help your business?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          These are common areas where small businesses spend time on repetitive
          work. Your idea does not need to fit a perfect category.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessAreas.map((area) => (
            <li
              key={area.title}
              className="rounded-xl border border-border/60 bg-card px-5 py-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <AreaIcon title={area.title} />
              </div>
              <h3 className="mt-4 text-base font-semibold">{area.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {area.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mt-16 sm:mt-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          From everyday task to practical AI workflow
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-border/60 bg-surface/60 px-5 py-5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-sm font-bold text-accent">
                {step.number}
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Request form */}
      <section id="workflow-request" className="mt-16 scroll-mt-24 sm:mt-20">
        <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-border/60 bg-card px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What would you like to automate?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Tell us about a repetitive task, manual process, or business problem
            you would like to improve.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Your request may help shape a future AI blueprint, local tool, or
            pilot project.
          </p>

          {tallyFormUrl ? (
            <TallyEmbed formUrl={tallyFormUrl} />
          ) : (
            <div className="mt-8 rounded-xl border border-border/60 bg-surface px-5 py-6 sm:px-6">
              <p className="text-sm font-medium text-foreground sm:text-base">
                Tell us what you want to automate by emailing:
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Workflow automation request")}`}
                className="mt-3 inline-flex text-base font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              <div className="mt-5">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Workflow automation request")}`}
                  className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Submit my workflow
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AreaIcon({ title }: { title: string }) {
  const common = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (title) {
    case "Sales":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15v-3" />
          <path d="M12 15V8" />
          <path d="M16 15v-5" />
        </svg>
      );
    case "Marketing":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 12v6a2 2 0 0 0 2 2h3" />
          <path d="M20 8l-8 4-8-4 8-4 8 4z" />
          <path d="M12 12v8" />
        </svg>
      );
    case "Customer Service":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 10a8 8 0 0 1 16 0v4a3 3 0 0 1-3 3h-1" />
          <path d="M4 12v2a2 2 0 0 0 2 2h1" />
          <path d="M20 12v2a2 2 0 0 1-2 2h-1" />
          <path d="M9 19h6" />
        </svg>
      );
    case "Operations":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M5.6 5.6l1.4 1.4" />
          <path d="M17 17l1.4 1.4" />
          <path d="M5.6 18.4l1.4-1.4" />
          <path d="M17 7l1.4-1.4" />
        </svg>
      );
    case "Finance & Accounting":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 15h3" />
        </svg>
      );
    case "People & HR":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <path d="M15 19c0-2 1.5-3.5 4-3.5" />
        </svg>
      );
    case "Administration":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z" />
          <path d="M10 9h4" />
          <path d="M10 13h4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
