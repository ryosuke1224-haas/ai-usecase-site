import Link from "next/link";
import { GlobalSearch } from "@/components/discovery/global-search";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/find-workflows", label: "Find Workflows" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/apis", label: "APIs" },
  { href: "/data-sources", label: "Data Sources" },
  { href: "/workflow-ideas", label: "Workflows" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-bold text-accent-foreground">
            AI
          </span>
          <span className="hidden font-semibold sm:inline">Use Case Atlas</span>
        </Link>

        <GlobalSearch className="hidden flex-1 md:block md:max-w-sm lg:max-w-md" />

        <nav className="ml-auto flex items-center gap-0.5 overflow-x-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border/40 px-6 py-2 md:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}
