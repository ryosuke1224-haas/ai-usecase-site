import Link from "next/link";
import { businessAreaDefinitions } from "@/src/lib/business-areas";
import { japaneseBusinessArea } from "@/src/lib/i18n/business-areas";
import { siteCopy } from "@/src/lib/i18n/copy";
import { localizedHref, type UiLocale } from "@/src/lib/i18n/locale";
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

function LiveFooter({ locale }: { locale: UiLocale | null }) {
  const copy = siteCopy(locale ?? "en");
  const href = (path: string, localized: boolean) => (locale && localized ? localizedHref(locale, path) : path);
  if (locale === "ja") {
    const linkClass = "text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";
    return (
      <footer className="mt-auto border-t border-border/60 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">AI</span>
            <span className="text-lg font-semibold">AI Use Case Atlas</span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{copy.footer.summary}</p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{copy.footer.explore}</h3>
              <ul className="mt-4 space-y-2">
                {[
                  { href: "/ja/business-areas", label: "業務から探す" },
                  { href: "/ja/use-cases", label: "AI活用テンプレート" },
                  { href: "/ja/use-cases?difficulty=Beginner", label: "初心者向け" },
                  { href: "/ja#how-it-works", label: "使い方" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{copy.footer.resources}</h3>
              <ul className="mt-4 space-y-2">
                {[
                  { href: "/ja/find-workflows", label: "ツールから探す" },
                  { href: "/ja/apis", label: "API・ツール" },
                  { href: "/ja/data-sources", label: "データソース" },
                  { href: "/ja/workflow-ideas", label: "AI活用アイデア" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{copy.footer.legal}</h3>
              <ul className="mt-4 space-y-2">
                {[
                  { href: "/ja/contact", label: "お問い合わせ" },
                  { href: "/ja/legal/tokusho", label: copy.footer.tokusho },
                  { href: "/ja/legal/terms", label: copy.footer.terms },
                  { href: "/ja/legal/privacy", label: copy.footer.privacy },
                  { href: "/ja/legal/refund", label: copy.footer.refund },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <nav aria-label={copy.footer.areas} className="mt-10 border-t border-border/60 pt-6">
            <h3 className="text-sm font-semibold text-foreground">{copy.footer.areas}</h3>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {businessAreaDefinitions.map((area) => (
                <li key={area.slug}>
                  <Link href={`/ja/business-areas/${area.slug}`} className={linkClass}>
                    {japaneseBusinessArea(area.slug)?.title ?? area.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    );
  }
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
              {copy.footer.summary}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              {copy.footer.explore}
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/business-areas", label: copy.nav.businessAreas },
                { href: href("/use-cases", true), label: copy.nav.blueprints },
                { href: href("/#how-it-works", true), label: copy.nav.howItWorks },
                { href: "/use-cases?difficulty=Beginner", label: "Beginner blueprints" },
                { href: href("/contact", true), label: copy.nav.contact },
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
              {copy.footer.resources}
            </h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: "/find-workflows", label: "Find workflows by tools" },
                { href: "/apis", label: "APIs & Tools" },
                { href: "/data-sources", label: "Data Sources" },
                { href: "/workflow-ideas", label: "Workflow Ideas" },
                { href: "/playbooks/google-ads-audit", label: "Google Ads Playbook" },
              ].map((link) => (
                <li key={link.label}>
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
          aria-label={copy.footer.areas}
          className="mt-10 border-t border-border/60 pt-6"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            {copy.footer.areas}
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
          {copy.footer.tagline}
        </div>
      </div>
    </footer>
  );
}

export function Footer({ locale = null }: { locale?: UiLocale | null }) {
  if (isComingSoonMode()) {
    return <ComingSoonFooter />;
  }

  return <LiveFooter locale={locale} />;
}
