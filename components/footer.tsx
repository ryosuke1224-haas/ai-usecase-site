import Link from "next/link";
import { businessAreaDefinitions } from "@/src/lib/business-areas";
import { CONTACT_EMAIL } from "@/src/lib/site";
import { isComingSoonMode } from "@/src/lib/site-mode";

function ComingSoonFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
            AI
          </span>
          <span className="text-base font-semibold">AI Use Case Atlas</span>
        </div>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}

function LiveFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
                AI
              </span>
              <span className="text-lg font-semibold">Use Case Atlas</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Practical AI workflows for small businesses — organised by
              business area and process, with what each workflow does, what you
              need, and how to get started.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/business-areas", label: "Business Areas" },
                { href: "/use-cases", label: "AI Blueprints" },
                { href: "/#how-it-works", label: "How it works" },
                { href: "/use-cases?difficulty=Beginner", label: "Beginner blueprints" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/find-workflows", label: "Find workflows by tools" },
                { href: "/apis", label: "APIs & Tools" },
                { href: "/data-sources", label: "Data Sources" },
                { href: "/workflow-ideas", label: "Workflow Ideas" },
                {
                  href: "/playbooks/google-ads-audit",
                  label: "Google Ads Playbook",
                },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav
          aria-label="Business areas"
          className="mt-10 border-t border-border/60 pt-6"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Business areas
          </h3>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {businessAreaDefinitions.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/business-areas/${area.slug}`}
                  className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {area.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-sm text-muted">
          AI Use Case Atlas — Practical workflows for SMB operators
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  if (isComingSoonMode()) {
    return <ComingSoonFooter />;
  }

  return <LiveFooter />;
}
