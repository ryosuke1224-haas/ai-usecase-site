import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/src/lib/site";

const steps = [
  {
    number: "1",
    title: "Export",
    description: "Download matching Google Ads and GA4 reports for the current and previous periods.",
  },
  {
    number: "2",
    title: "Upload",
    description: "Add the CSV files, business context, and one conversion-actions screenshot to a file-capable AI assistant.",
  },
  {
    number: "3",
    title: "Calculate",
    description: "The AI creates a new calculated_metrics.xlsx workbook with formulas, raw-data sheets, and measurement checks.",
  },
  {
    number: "4",
    title: "Review",
    description: "Use the workbook as the arithmetic source of truth and generate an evidence-based audit and action plan.",
  },
];

const uploads = [
  "Google Ads campaign reports — current and previous",
  "GA4 Traffic acquisition — current and previous",
  "GA4 Landing page reports — current and previous",
  "Google Ads conversion-actions screenshot",
  "Business context and qualified-outcome definition",
  "Search terms when the campaign type supports them",
];

const outputs = [
  "Formula-driven calculation workbook",
  "Conversion-tracking readiness status",
  "Current-vs-previous scorecard",
  "Campaign, search-term, and landing-page findings",
  "Prioritized verification and action plan",
  "Documented assumptions and missing-data limits",
];

export function GoogleAdsPlaybookSection() {
  const accessHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Google Ads AI Audit Playbook",
  )}`;

  return (
    <section id="playbook" className="scroll-mt-24 space-y-8">
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Flagship manual playbook
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Run the workflow without building an app
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          The user does not build the spreadsheet by hand. The playbook tells them
          what to export and gives the AI two copy-ready prompts: first create the
          calculation workbook, then create the audit report.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="rounded-xl border border-border/60 bg-card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
              {step.number}
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <InfoPanel title="What the user uploads" items={uploads} />
        <InfoPanel title="What the AI creates" items={outputs} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="grid items-center gap-8 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
            <Image
              src="/images/google-ads-audit/calculated-metrics-dashboard.png"
              alt="Fictional Google Ads and GA4 calculated workbook dashboard showing measurement review first"
              width={2048}
              height={640}
              className="h-auto w-full"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Sample output
            </p>
            <h3 className="mt-2 text-xl font-bold">The workbook is generated for each run</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This fictional example catches a common failure: page views are
              configured as Primary conversions while GA4 shows zero paid-traffic
              key events. The correct result is a measurement review—not a false
              claim that the campaign generated qualified leads.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/downloads/google-ads-audit/calculated_metrics_sample.xlsx"
                className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/40 hover:bg-card"
              >
                Download sample workbook
              </a>
              <a
                href="/downloads/google-ads-audit/sample_audit_report.pdf"
                className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/40 hover:bg-card"
              >
                View sample audit
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-accent/20 bg-accent/5 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Get the complete playbook</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Includes the full export guide, workbook-generation prompt, audit
              prompt, fictional sample files, calculated workbook example, and
              weekly action log.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href={accessHref}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              Get playbook access
            </a>
            <Link
              href="/playbooks/google-ads-audit"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-semibold hover:border-accent/40"
            >
              See package details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-5">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
