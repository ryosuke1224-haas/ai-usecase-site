import Image from "next/image";
import Link from "next/link";

export function FlagshipPlaybook() {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            Flagship workflow
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">
            Audit Google Ads and GA4 with files you can already export
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Upload the reports and one conversion-settings screenshot. A
            file-capable AI assistant creates the calculation workbook, checks
            whether the outcome is trustworthy, and produces a prioritized audit.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/use-cases/google-ads-performance-coach"
              className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              View the blueprint
            </Link>
            <Link
              href="/playbooks/google-ads-audit"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/40"
            >
              See the playbook
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
          <Image
            src="/images/google-ads-audit/calculated-metrics-dashboard.png"
            alt="Sample calculated workbook for a Google Ads and GA4 audit"
            width={2048}
            height={640}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
