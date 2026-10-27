import Link from "next/link";
import { GlobalSearch } from "@/components/discovery/global-search";
import { AccountMenu } from "@/components/nav/account-menu";
import { ResourcesMenu } from "@/components/nav/resources-menu";
import { getCurrentUser } from "@/src/lib/auth";
import { siteCopy } from "@/src/lib/i18n/copy";
import { localizedHref, type UiLocale } from "@/src/lib/i18n/locale";
import { isComingSoonMode } from "@/src/lib/site-mode";

function navLinks(locale: UiLocale | null) {
  const copy = siteCopy(locale ?? "en").nav;
  const href = (path: string, localized: boolean) => (locale && localized ? localizedHref(locale, path) : path);
  return [
    { href: locale === "ja" ? "/ja/business-areas" : "/business-areas", label: copy.businessAreas },
    { href: href("/use-cases", true), label: copy.blueprints },
    { href: href("/#how-it-works", true), label: copy.howItWorks },
    { href: href("/contact", true), label: copy.contact },
  ];
}

function BrandLink({ locale }: { locale: UiLocale | null }) {
  return (
    <Link
      href={locale ? `/${locale}` : "/"}
      className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <span aria-hidden={locale === "ja" ? true : undefined} className="flex h-7 w-7 items-center justify-center rounded bg-accent text-xs font-bold text-accent-foreground">
        AI
      </span>
      <span className="hidden font-semibold sm:inline">{locale === "ja" ? "AI Use Case Atlas" : "Use Case Atlas"}</span>
    </Link>
  );
}

function ComingSoonHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <BrandLink locale={null} />
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

async function LiveHeader({ locale }: { locale: UiLocale | null }) {
  const user = await getCurrentUser();
  const copy = siteCopy(locale ?? "en").nav;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
        <BrandLink locale={locale} />

        <GlobalSearch locale={locale} className="hidden flex-1 md:block md:max-w-sm lg:max-w-md" />

        <nav className="ml-auto flex items-center gap-0.5">
          {navLinks(locale).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:inline-flex sm:text-sm"
            >
              {link.label}
            </Link>
          ))}
          <ResourcesMenu locale={locale} label={copy.resources} />
          {locale ? (
            <Link
              href={locale === "ja" ? "/en" : "/ja"}
              className="hidden shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground sm:inline-flex sm:text-sm"
            >
              {locale === "ja" ? "English" : "日本語"}
            </Link>
          ) : null}
          <AccountMenu
            isAuthenticated={Boolean(user)}
            email={user?.email}
            locale={locale}
          />
        </nav>
      </div>

      <div className="border-t border-border/40 px-6 py-2 md:hidden">
        <GlobalSearch locale={locale} />
      </div>
    </header>
  );
}

export async function Header({ locale = null }: { locale?: UiLocale | null }) {
  if (isComingSoonMode()) {
    return <ComingSoonHeader />;
  }

  return <LiveHeader locale={locale} />;
}
