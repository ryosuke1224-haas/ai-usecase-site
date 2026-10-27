export const UI_LOCALES = ["ja", "en"] as const;

export type UiLocale = (typeof UI_LOCALES)[number];

export function isUiLocale(value: string): value is UiLocale {
  return value === "ja" || value === "en";
}

/** Locale prefix on the URL. Unprefixed pages stay on the existing English routes. */
export function localeFromPathname(pathname: string): UiLocale | null {
  const match = /^\/(ja|en)(?=\/|$)/.exec(pathname);
  if (match?.[1] === "ja" || match?.[1] === "en") return match[1];
  return null;
}

export function localizedHref(locale: UiLocale | null, href: string): string {
  if (!locale) return href;
  if (href.startsWith("/#")) return `/${locale}${href.slice(1)}`;
  if (href.startsWith("#")) return `/${locale}${href}`;
  const path = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${path}`;
}

export function collectionsPaths(locale: UiLocale | null): {
  demo: string;
  kit: string;
  success: string;
} {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-collections-assistant`,
    kit: `${prefix}/blueprints/ai-collections-assistant/kit`,
    success: `${prefix}/blueprints/ai-collections-assistant/checkout/success`,
  };
}
