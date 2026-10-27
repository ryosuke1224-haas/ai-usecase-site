"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { MY_BLUEPRINTS_PATH, authPath } from "@/src/lib/blueprints";
import { siteCopy } from "@/src/lib/i18n/copy";
import { localizedHref, type UiLocale } from "@/src/lib/i18n/locale";

export function AccountMenu({
  email,
  isAuthenticated,
  locale = null,
}: {
  email?: string;
  isAuthenticated: boolean;
  locale?: UiLocale | null;
}) {
  const copy = siteCopy(locale ?? "en").nav;
  const blueprintsHref = locale ? localizedHref(locale, MY_BLUEPRINTS_PATH) : MY_BLUEPRINTS_PATH;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!isAuthenticated) {
    return (
      <Link
        href={authPath(blueprintsHref, locale ?? undefined)}
        className="shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-sm"
      >
        {copy.signIn}
      </Link>
    );
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setOpen(false);
      router.push(locale ? `/${locale}` : "/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const label = email?.split("@")[0] || (locale === "ja" ? "アカウント" : "Account");

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="shrink-0 rounded px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:text-sm"
      >
        {label}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label={locale === "ja" ? "メニューを閉じる" : "Close account menu"}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border/60 bg-card py-1 shadow-lg"
          >
            <Link
              href={blueprintsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              {copy.myBlueprints}
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={handleSignOut}
              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-surface disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              {signingOut ? copy.signingOut : copy.signOut}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
