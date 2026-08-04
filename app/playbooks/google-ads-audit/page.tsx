import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/src/lib/site";

const PREVIEW_IMAGE = "/images/google-ads-audit/calculated-metrics-dashboard.png";

export const metadata: Metadata = {
  title: "Google Ads AI Audit Playbook",
  description:
    "A practical Google Ads and GA4 audit package with export instructions, AI prompts, sample files, a calculated workbook, and an action log.",
  alternates: { canonical: "/playbooks/google-ads-audit" },
  openGraph: {
    title: "Google Ads AI Audit Playbook",
    description:
      "Create a calculation workbook and evidence-based Google Ads audit from exported reports.",
    url: "/playbooks/google-ads-audit",
    type: "article",
  },
};

const included = [
  "Complete PDF playbook with beginner-friendly export instructions",
  "Workbook-generation and audit-report prompts",
  "Fictional Google Ads and GA4 sample inputs",
  "Calculated Excel workbook example",
  "Completed audit report example",
  "Weekly action-log workbook",
];

export default function GoogleAdsAuditPlaybookPage() {
  const emailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Google Ads AI Audit Playbook",
  )}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <Link
        href="/use-cases/google-ads-performance-coach"
        className="text-sm font-medium text-muted hover:text-accent"
      >
        ← Google Ads Performance Coach
      </Link>

      <section className="mt-6 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            AI Use Case Atlas · Premium playbook
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Google Ads AI Audit Playbook
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            A repeatable way to turn Google Ads and GA4 exports into a
            formula-driven workbook, a measurement-readiness check, and a
            prioritized action plan.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={emailHref}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              Request playbook access
            </a>
            <a
              href="/downloads/google-ads-audit/calculated_metrics_sample.xlsx"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-5 py-3 text-sm font-semibold hover:border-accent/40"
            >
              Download sample workbook
            </a>
          </div>
        </div>

        <div>
          <a
            href={PREVIEW_IMAGE}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View the sample workbook preview at full size"
            className="group block overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Image
              src={PREVIEW_IMAGE}
              alt="Sample Google Ads audit workbook dashboard"
              width={2048}
              height={640}
              className="h-auto w-full transition-opacity group-hover:opacity-90"
              priority
            />
          </a>
          <a
            href={PREVIEW_IMAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            View full-size preview
          </a>
        </div>
      </section>

      <section className="mt-14 grid gap-5 sm:grid-cols-3">
        <ValueCard title="Input" text="Google Ads and GA4 exports, one conversion screenshot, and business context." />
        <ValueCard title="Process" text="AI-generated workbook, formula checks, measurement rules, and evidence labels." />
        <ValueCard title="Output" text="Prioritized findings, safe verification steps, sample audit, and action log." />
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h2 className="text-2xl font-bold">What is included</h2>
          <ul className="mt-5 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-lg font-semibold">Built to stop bad optimization</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The workflow checks conversion configuration before judging CPA or
            ROAS. When page views or other low-value events are configured as
            Primary, the workbook reports{" "}
            <strong>MEASUREMENT REVIEW FIRST</strong> instead of presenting
            those events as qualified leads.
          </p>
        </div>
      </section>

      <section className="mt-14 rounded-2xl border-2 border-accent/20 bg-accent/5 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">See the completed output</h2>
            <p className="mt-2 text-sm text-muted">
              Review the fictional report before deciding whether the workflow fits your business.
            </p>
          </div>
          <a
            href="/downloads/google-ads-audit/sample_audit_report.pdf"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card px-5 py-3 text-sm font-semibold hover:border-accent/40"
          >
            Open sample audit PDF
          </a>
        </div>
      </section>
    </main>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}
