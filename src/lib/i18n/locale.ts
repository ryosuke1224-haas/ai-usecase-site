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

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function noShowPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/no-show-recovery-assistant`,
    kit: `${prefix}/blueprints/no-show-recovery-assistant/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function expensePaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-expense-watchdog`,
    kit: `${prefix}/blueprints/ai-expense-watchdog/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function unbilledPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/unbilled-work-review-queue`,
    kit: `${prefix}/blueprints/unbilled-work-review-queue/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function quotePaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/quote-request-assistant`,
    kit: `${prefix}/blueprints/quote-request-assistant/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function replyPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-customer-response-assistant`,
    kit: `${prefix}/blueprints/ai-customer-response-assistant/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function winbackPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/inactive-customer-winback`,
    kit: `${prefix}/blueprints/inactive-customer-winback/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function staffingPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-staffing-optimizer`,
    kit: `${prefix}/blueprints/ai-staffing-optimizer/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function proposalPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-proposal-follow-up-assistant`,
    kit: `${prefix}/blueprints/ai-proposal-follow-up-assistant/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function payrollPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-payroll-forecasting`,
    kit: `${prefix}/blueprints/ai-payroll-forecasting/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function googleAdsPaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/google-ads-performance-coach`,
    kit: `${prefix}/blueprints/google-ads-performance-coach/kit`,
  };
}

/** Unprefixed paths stay English. `/ja` and `/en` use the same blueprint slug. */
export function pipelinePaths(locale: UiLocale | null): { demo: string; kit: string } {
  const prefix = locale ? `/${locale}` : "";
  return {
    demo: `${prefix}/blueprints/ai-pipeline-risk-detector`,
    kit: `${prefix}/blueprints/ai-pipeline-risk-detector/kit`,
  };
}
