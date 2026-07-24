import Link from "next/link";

export function Footer() {
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
              A structured workflow database for small business owners and
              consultants — mapping business problems to data sources, APIs, and
              implementation paths.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Libraries
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/use-cases", label: "Use Cases" },
                { href: "/apis", label: "APIs & Tools" },
                { href: "/data-sources", label: "Data Sources" },
                { href: "/workflow-ideas", label: "Workflow Ideas" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Get Started
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/use-cases?difficulty=Beginner"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Beginner use cases
                </Link>
              </li>
              <li>
                <Link
                  href="/workflow-ideas"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  API combination ideas
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-sm text-muted">
          AI Use Case Atlas — Practical workflows for SMB operators
        </div>
      </div>
    </footer>
  );
}
