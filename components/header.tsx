import Link from "next/link";
import { GlobalSearch } from "@/components/discovery/global-search";
import { ResourcesMenu } from "@/components/nav/resources-menu";
import { isComingSoonMode } from "@/src/lib/site-mode";

const navLinks = [
  { href: "/business-areas", label: "Business Areas", alwaysVisible: true },
  { href: "/use-cases", label: "AI Blueprints", alwaysVisible: true },
  { href: "/#how-it-works", label: "How It Works", alwaysVisible: false },
  { href: "/contact", label: "Contact", alwaysVisible: false },
];

function BrandLink() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-bold text-accent-foreground">
        AI
      </span>
      <span className="hidden font-semibold sm:inline">Use Case Atlas</span>
    </Link>
  );
}

function ComingSoonHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <BrandLink />
        <a
          href="/#workflow-request"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-sm"
        >
          Share your workflow
        </a>
      </div>
    </header>
  );
}

function LiveHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
        <BrandLink />

        <GlobalSearch className="hidden flex-1 md:block md:max-w-sm lg:max-w-md" />

        <nav className="ml-auto flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-sm ${
                link.alwaysVisible ? "" : "hidden sm:inline-flex"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <ResourcesMenu />
        </nav>
      </div>

      <div className="border-t border-border/40 px-6 py-2 md:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}

export function Header() {
  if (isComingSoonMode()) {
    return <ComingSoonHeader />;
  }

  return <LiveHeader />;
}
