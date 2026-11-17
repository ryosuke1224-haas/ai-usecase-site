import { projectOperations, PROJECT_STATUSES, type ProjectArea, type ProjectStatus } from "@/ops/operations";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import type { AnalyticsPageRow, AnalyticsRead, AnalyticsReferrerRow } from "./analytics-query";
import type { PerformanceProduct } from "./catalog";
import {
  formatTokyoDateTime,
  instantInRange,
  rangeLabel,
  rangeStart,
  type DashboardRange,
} from "./range";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CheckoutFact = {
  created: number;
  livemode: boolean;
  paymentStatus: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  productSlug: string | null;
};

export type EntitlementFact = {
  userId: string;
  email: string | null;
  productSlug: string;
  status: "active" | "revoked";
  purchasedAt: string | null;
  checkout: "live" | "sandbox" | "unclassified";
};

export type StripeSnapshot =
  | { state: "not_connected"; detail: string }
  | { state: "sandbox"; sessions: CheckoutFact[]; truncated: boolean }
  | { state: "live"; sessions: CheckoutFact[]; truncated: boolean };

export type CustomerSnapshot =
  | { state: "not_connected"; detail: string }
  | { state: "value"; rows: EntitlementFact[]; truncated: boolean; emailsIncomplete: boolean };

export type AnalyticsAudit = {
  state: "not_connected" | "not_available" | "value";
  headline: string;
  providerNeeded: string;
  detail: string;
  visitors: number | null;
  pageViews: number | null;
  productPageViews: number | null;
  topPages: AnalyticsPageRow[] | null;
  referrers: AnalyticsReferrerRow[] | null;
  productPageViewsBySlug: Record<string, number> | null;
};

export type BlogSnapshot =
  | { state: "not_connected"; detail: string }
  | {
      state: "value";
      published: number;
      drafts: number;
      readyForReview: number;
      approved: number;
      needsChanges: number;
      rejected: number;
      archived: number;
      total: number;
    };

export type NewsletterSnapshot =
  | { state: "not_connected"; detail: string }
  | { state: "value"; active: number; recent: number; unsubscribed: number };

export type MetricState = "value" | "not_connected" | "not_available";

export type KpiCard = {
  id: string;
  label: string;
  display: string;
  detail: string;
  state: MetricState;
};

export type OverviewCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

export type MoneyRow = {
  key: string;
  label: string;
  amountLabel: string;
  count: number;
};

export type RecentPurchaseRow = {
  when: string;
  title: string;
  amountLabel: string;
};

export type CustomerProductRow = {
  title: string;
  slug: string;
  status: "active" | "revoked";
  purchasedAt: string;
};

export type CustomerRow = {
  email: string;
  products: CustomerProductRow[];
};

export type ProductPerformanceRow = {
  titleJa: string;
  slug: string;
  liveLabel: "Live" | "Not live";
  pageViews: string;
  checkoutStarts: string;
  purchases: string;
  revenue: string;
  conversion: string;
};

export type DashboardModel = {
  range: DashboardRange;
  rangeLabel: string;
  timezoneNote: string;
  viewerEmail: string;
  updated: string;
  overview: OverviewCard[];
  kpis: KpiCard[];
  analytics: AnalyticsAudit;
  blog: BlogSnapshot;
  newsletter: NewsletterSnapshot;
  revenue: {
    state: MetricState;
    detail: string;
    purchaseCount: number | null;
    byCurrency: MoneyRow[];
    byProduct: MoneyRow[];
    recent: RecentPurchaseRow[];
  };
  customers: {
    state: MetricState;
    detail: string;
    uniqueInRange: number | null;
    ownedInRange: number | null;
    uniqueAllTime: number | null;
    ownedAllTime: number | null;
    recent: CustomerRow[];
  };
  products: ProductPerformanceRow[];
  statusGroups: { status: ProjectStatus; areas: ProjectArea[] }[];
  roadmap: typeof projectOperations.roadmap;
  recentChanges: typeof projectOperations.recentChanges;
  pipeline: ProjectArea[];
};

export type DashboardInput = {
  now: Date;
  range: DashboardRange;
  viewerEmail: string;
  siteMode: "live" | "coming-soon";
  stripe: StripeSnapshot;
  customers: CustomerSnapshot;
  analytics: AnalyticsAudit;
  blog: BlogSnapshot;
  newsletter: NewsletterSnapshot;
  products: PerformanceProduct[];
  premiumBlueprintCount: number;
};

type MoneyBucket = { currency: string; amount: number; count: number };

export function safeProductSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const slug = value.trim().toLowerCase();
  return SLUG.test(slug) ? slug : null;
}

export function formatAdminMoney(amount: number, currency: string): string {
  if (!Number.isInteger(amount) || amount < 0) return "Unavailable";
  if (currency === "jpy") return `¥${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  if (currency === "usd") {
    const dollars = amount / 100;
    return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  }
  return `${amount} ${currency.toUpperCase()}`;
}

export function cleanEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** Copies only the fields the dashboard is allowed to keep. Card and customer objects are dropped. */
export function toCheckoutFact(session: {
  created?: number;
  livemode?: boolean;
  payment_status?: string | null;
  status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: { product_slug?: string | null } | null;
}): CheckoutFact | null {
  if (typeof session.created !== "number" || !Number.isFinite(session.created)) return null;
  return {
    created: session.created,
    livemode: session.livemode === true,
    paymentStatus: session.payment_status ?? null,
    status: session.status ?? null,
    amount: typeof session.amount_total === "number" ? session.amount_total : null,
    currency: session.currency?.trim().toLowerCase() || null,
    productSlug: safeProductSlug(session.metadata?.product_slug),
  };
}

export function entitlementFact(
  row: {
    user_id?: unknown;
    product_slug?: unknown;
    status?: unknown;
    purchased_at?: unknown;
    stripe_checkout_session_id?: unknown;
  },
  email: string | null,
): EntitlementFact | null {
  if (typeof row.user_id !== "string" || row.user_id.length === 0) return null;
  if (typeof row.product_slug !== "string") return null;
  const productSlug = safeProductSlug(row.product_slug);
  if (!productSlug) return null;
  if (row.status !== "active" && row.status !== "revoked") return null;
  const sessionId = typeof row.stripe_checkout_session_id === "string" ? row.stripe_checkout_session_id : "";
  const checkout = sessionId.startsWith("cs_test_")
    ? "sandbox"
    : sessionId.startsWith("cs_live_")
      ? "live"
      : "unclassified";
  const purchasedAt =
    typeof row.purchased_at === "string" && !Number.isNaN(Date.parse(row.purchased_at)) ? row.purchased_at : null;
  return {
    userId: row.user_id,
    email: cleanEmail(email),
    productSlug,
    status: row.status,
    purchasedAt,
    checkout,
  };
}

const EMPTY_ANALYTICS = {
  visitors: null,
  pageViews: null,
  productPageViews: null,
  topPages: null,
  referrers: null,
  productPageViewsBySlug: null,
} as const;

export function auditAnalytics(input: {
  gaCollectionConfigured: boolean;
  vercelAnalyticsInstalled: boolean;
  read?: AnalyticsRead | null;
}): AnalyticsAudit {
  if (input.vercelAnalyticsInstalled) {
    if (input.read?.state === "value") {
      return {
        state: "value",
        headline: "Vercel Web Analytics",
        providerNeeded: "Connected with the server-only Vercel Web Analytics token.",
        detail: "Production visitors and page views for this range. /admin routes are excluded. A zero is a real count.",
        visitors: input.read.visitors,
        pageViews: input.read.pageViews,
        productPageViews: input.read.productPageViews,
        topPages: input.read.topPages,
        referrers: input.read.referrers,
        productPageViewsBySlug: input.read.productPageViewsBySlug,
      };
    }
    return {
      state: "not_available",
      headline: "Not available",
      providerNeeded: "Set the server-only VERCEL_WEB_ANALYTICS_TOKEN. Do not use a NEXT_PUBLIC variable.",
      detail: input.read?.state === "not_available"
        ? input.read.detail
        : "Vercel Web Analytics is installed. Visitors and page views are not available until the server can read them.",
      ...EMPTY_ANALYTICS,
    };
  }
  if (!input.gaCollectionConfigured) {
    return {
      state: "not_connected",
      headline: "Not connected",
      providerNeeded: "Google Analytics Data API (GA4) or Vercel Web Analytics",
      detail:
        "No analytics provider is connected. Vercel Web Analytics is not installed, and Google Analytics has no measurement ID on this server. Visitor counts and product page views are Not connected.",
      ...EMPTY_ANALYTICS,
    };
  }
  return {
    state: "not_connected",
    headline: "Not connected",
    providerNeeded: "Google Analytics Data API (GA4) with a server-side read credential",
    detail:
      "Google Analytics is configured to collect browser page views. This dashboard cannot read those reports, so visitor counts, product page views, and page-view conversion stay Not connected.",
    ...EMPTY_ANALYTICS,
  };
}

function analyticsMetric(analytics: AnalyticsAudit, value: number | null): { display: string; state: MetricState } {
  if (analytics.state === "value" && typeof value === "number") return { display: String(value), state: "value" };
  if (analytics.state === "not_available" || analytics.state === "value") return { display: "Not available", state: "not_available" };
  return { display: "Not connected", state: "not_connected" };
}

function productTitle(slug: string | null, products: readonly PerformanceProduct[]): string {
  if (!slug) return "Unknown product";
  return products.find((item) => item.slug === slug)?.titleJa ?? japaneseUseCase(slug)?.title ?? slug;
}

function isSuccessfulLivePayment(session: CheckoutFact): boolean {
  return (
    session.livemode === true &&
    session.paymentStatus === "paid" &&
    session.status === "complete" &&
    typeof session.amount === "number" &&
    Number.isInteger(session.amount) &&
    session.amount >= 0 &&
    Boolean(session.currency)
  );
}

function addMoney(map: Map<string, MoneyBucket>, currency: string, amount: number) {
  const current = map.get(currency) ?? { currency, amount: 0, count: 0 };
  current.amount += amount;
  current.count += 1;
  map.set(currency, current);
}

function currencyRank(currency: string): number {
  if (currency === "jpy") return 0;
  if (currency === "usd") return 1;
  return 2;
}

function moneyRows(map: Map<string, MoneyBucket>, labelFor: (bucket: MoneyBucket) => string): MoneyRow[] {
  return [...map.values()]
    .sort((a, b) => currencyRank(a.currency) - currencyRank(b.currency) || a.currency.localeCompare(b.currency))
    .map((bucket) => ({
      key: `${labelFor(bucket)}:${bucket.currency}`,
      label: labelFor(bucket),
      amountLabel: formatAdminMoney(bucket.amount, bucket.currency),
      count: bucket.count,
    }));
}

function joinAmounts(rows: MoneyRow[]): string {
  return rows.map((row) => row.amountLabel).join(" · ");
}

function areaById(id: string): ProjectArea | undefined {
  return projectOperations.areas.find((item) => item.id === id);
}

function formatRate(purchases: number, starts: number): string {
  const pct = (purchases / starts) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${purchases}/${starts} (${text}%)`;
}

export function buildOperationsDashboard(input: DashboardInput): DashboardModel {
  const start = rangeStart(input.range, input.now);
  const sessions =
    input.stripe.state === "not_connected"
      ? []
      : input.stripe.sessions.filter((session) => instantInRange(session.created * 1000, start, input.now));
  const liveSessions = input.stripe.state === "live" ? sessions.filter((session) => session.livemode) : [];
  const purchases = input.stripe.state === "live" ? liveSessions.filter(isSuccessfulLivePayment) : [];
  const sandboxSeen =
    input.stripe.state === "sandbox"
      ? sessions.length
      : sessions.filter((session) => session.livemode === false).length;
  const unsuccessfulLive = liveSessions.filter((session) => !isSuccessfulLivePayment(session)).length;

  const byCurrency = new Map<string, MoneyBucket>();
  const byProduct = new Map<string, MoneyBucket & { slug: string | null }>();
  for (const session of purchases) {
    const currency = session.currency as string;
    const amount = session.amount as number;
    addMoney(byCurrency, currency, amount);
    const key = `${session.productSlug ?? "unknown"}:${currency}`;
    const current = byProduct.get(key) ?? { currency, amount: 0, count: 0, slug: session.productSlug };
    current.amount += amount;
    current.count += 1;
    byProduct.set(key, current);
  }

  const currencyRows = moneyRows(byCurrency, (bucket) => bucket.currency.toUpperCase());
  const productRows = [...byProduct.values()]
    .sort((a, b) => currencyRank(a.currency) - currencyRank(b.currency) || (a.slug ?? "").localeCompare(b.slug ?? ""))
    .map((bucket) => ({
      key: `${bucket.slug ?? "unknown"}:${bucket.currency}`,
      label: productTitle(bucket.slug, input.products),
      amountLabel: formatAdminMoney(bucket.amount, bucket.currency),
      count: bucket.count,
    }));

  const revenue = revenueSection({
    stripe: input.stripe,
    purchaseCount: purchases.length,
    byCurrency: currencyRows,
    byProduct: productRows,
    recent: purchases
      .slice()
      .sort((a, b) => b.created - a.created)
      .slice(0, 8)
      .map((session) => ({
        when: formatTokyoDateTime(session.created * 1000),
        title: productTitle(session.productSlug, input.products),
        amountLabel: formatAdminMoney(session.amount as number, session.currency as string),
      })),
    sandboxSeen,
    unsuccessfulLive,
  });

  const customers = customerSection(input.customers, input.products, start, input.now);
  const commerceState: MetricState =
    input.stripe.state === "not_connected" ? "not_connected" : input.stripe.state === "sandbox" ? "not_available" : "value";

  const products = input.products.map((product) => {
    const starts = liveSessions.filter((session) => session.productSlug === product.slug).length;
    const sold = purchases.filter((session) => session.productSlug === product.slug);
    const amounts = new Map<string, MoneyBucket>();
    for (const session of sold) addMoney(amounts, session.currency as string, session.amount as number);
    const amountRows = moneyRows(amounts, () => product.titleJa);
    return {
      titleJa: product.titleJa,
      slug: product.slug,
      liveLabel: product.live ? ("Live" as const) : ("Not live" as const),
      pageViews:
        input.analytics.state === "not_connected"
          ? "Not connected"
          : input.analytics.productPageViewsBySlug
            ? String(input.analytics.productPageViewsBySlug[product.slug] ?? 0)
            : "Not available",
      checkoutStarts: commerceState === "value" ? String(starts) : commerceState === "not_available" ? "Not available" : "Not connected",
      purchases: commerceState === "value" ? String(sold.length) : commerceState === "not_available" ? "Not available" : "Not connected",
      revenue:
        commerceState === "value"
          ? amountRows.length > 0
            ? joinAmounts(amountRows)
            : "No revenue in this range"
          : commerceState === "not_available"
            ? "Not available"
            : "Not connected",
      conversion:
        commerceState !== "value"
          ? commerceState === "not_available"
            ? "Not available"
            : "Not connected"
          : starts === 0
            ? "Not enough data"
            : formatRate(sold.length, starts),
    };
  });

  const visitors = analyticsMetric(input.analytics, input.analytics.visitors);
  const pageViews = analyticsMetric(input.analytics, input.analytics.pageViews);
  const productPageViews = analyticsMetric(input.analytics, input.analytics.productPageViews);
  const kpis: KpiCard[] = [
    {
      id: "visitors",
      label: "Visitors",
      display: visitors.display,
      detail: input.analytics.detail,
      state: visitors.state,
    },
    {
      id: "page-views",
      label: "Page views",
      display: pageViews.display,
      detail: input.analytics.detail,
      state: pageViews.state,
    },
    {
      id: "product-page-views",
      label: "Product page views",
      display: productPageViews.display,
      detail: "Views of live blueprint pages, including Japanese and English paths. Kit and checkout pages are not included.",
      state: productPageViews.state,
    },
    {
      id: "checkout-starts",
      label: "Checkout starts",
      display: commerceState === "value" ? String(liveSessions.length) : commerceState === "not_available" ? "Not available" : "Not connected",
      detail:
        input.stripe.state === "live"
          ? "Live Checkout sessions created in this range, including unpaid sessions."
          : input.stripe.state === "sandbox"
            ? "Stripe sandbox is connected. Sandbox sessions are excluded from production checkout starts."
            : input.stripe.detail,
      state: commerceState,
    },
    {
      id: "purchases",
      label: "Purchases",
      display: commerceState === "value" ? String(purchases.length) : commerceState === "not_available" ? "Not available" : "Not connected",
      detail:
        input.stripe.state === "live"
          ? "Paid, completed, live-mode Checkout sessions in this range."
          : input.stripe.state === "sandbox"
            ? "Sandbox payments are excluded from production purchases."
            : input.stripe.detail,
      state: commerceState,
    },
    {
      id: "revenue",
      label: "Revenue",
      display: revenue.purchaseCount === null ? revenue.state === "not_available" ? "Not available" : "Not connected" : revenue.byCurrency.length > 0 ? joinAmounts(revenue.byCurrency) : "No revenue in this range",
      detail: revenue.detail,
      state: revenue.state,
    },
    {
      id: "customers",
      label: "Customers",
      display:
        customers.uniqueInRange === null
          ? "Not connected"
          : String(customers.uniqueInRange),
      detail:
        customers.state === "value"
          ? "Distinct accounts with a live-checkout entitlement purchased in this range."
          : customers.detail,
      state: customers.state === "value" ? "value" : "not_connected",
    },
  ];

  return {
    range: input.range,
    rangeLabel: rangeLabel(input.range),
    timezoneNote: "Dates use Japan time (Asia/Tokyo). Today starts at midnight in Japan. Last 7 days and last 30 days include today.",
    viewerEmail: cleanEmail(input.viewerEmail) ?? "your Atlas account",
    updated: projectOperations.updated,
    overview: overviewCards(input),
    kpis,
    analytics: input.analytics,
    blog: input.blog,
    newsletter: input.newsletter,
    revenue,
    customers,
    products,
    statusGroups: PROJECT_STATUSES.map((status) => ({
      status,
      areas: projectOperations.areas.filter((item) => item.status === status),
    })),
    roadmap: projectOperations.roadmap,
    recentChanges: projectOperations.recentChanges,
    pipeline: projectOperations.areas.filter(
      (item) => item.status === "PLANNED" || item.status === "BACKLOG" || item.status === "IDEA",
    ),
  };
}

function revenueSection(input: {
  stripe: StripeSnapshot;
  purchaseCount: number;
  byCurrency: MoneyRow[];
  byProduct: MoneyRow[];
  recent: RecentPurchaseRow[];
  sandboxSeen: number;
  unsuccessfulLive: number;
}): DashboardModel["revenue"] {
  if (input.stripe.state === "not_connected") {
    return {
      state: "not_connected",
      detail: input.stripe.detail,
      purchaseCount: null,
      byCurrency: [],
      byProduct: [],
      recent: [],
    };
  }
  if (input.stripe.state === "sandbox") {
    return {
      state: "not_available",
      detail: `Production revenue is not available because this server is using a Stripe sandbox key. Sandbox checkout sessions seen in this range: ${input.sandboxSeen}. They are not included in production totals.`,
      purchaseCount: null,
      byCurrency: [],
      byProduct: [],
      recent: [],
    };
  }
  const truncated = input.stripe.truncated ? " Stripe returned more sessions than this page read, so these totals can be short." : "";
  return {
    state: "value",
    detail: `Sandbox payments excluded: ${input.sandboxSeen}. Unpaid or incomplete live checkouts excluded: ${input.unsuccessfulLive}.${truncated}`,
    purchaseCount: input.purchaseCount,
    byCurrency: input.byCurrency,
    byProduct: input.byProduct,
    recent: input.recent,
  };
}

function customerSection(
  snapshot: CustomerSnapshot,
  products: readonly PerformanceProduct[],
  start: Date,
  now: Date,
): DashboardModel["customers"] {
  if (snapshot.state === "not_connected") {
    return {
      state: "not_connected",
      detail: snapshot.detail,
      uniqueInRange: null,
      ownedInRange: null,
      uniqueAllTime: null,
      ownedAllTime: null,
      recent: [],
    };
  }

  const live = snapshot.rows.filter((row) => row.checkout === "live");
  const sandbox = snapshot.rows.filter((row) => row.checkout === "sandbox").length;
  const unclassified = snapshot.rows.filter((row) => row.checkout === "unclassified").length;
  const inRange = live.filter((row) => row.purchasedAt !== null && instantInRange(Date.parse(row.purchasedAt), start, now));
  const unique = (rows: EntitlementFact[]) => new Set(rows.map((row) => row.userId)).size;
  const recentIds = [...inRange].sort((a, b) => Date.parse(b.purchasedAt ?? "") - Date.parse(a.purchasedAt ?? ""));
  const seen = new Set<string>();
  const orderedIds: string[] = [];
  for (const row of recentIds) {
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);
    orderedIds.push(row.userId);
    if (orderedIds.length === 12) break;
  }

  const notes = [
    "Unique customers count every live-checkout account, including later revocations. Owned blueprints count active entitlements only.",
    `Sandbox entitlements excluded: ${sandbox}. Entitlements without a live checkout id excluded: ${unclassified}.`,
    "Emails are the account address only. Payment methods, addresses, and Stripe IDs are not shown.",
  ];
  if (snapshot.truncated) notes.push("The entitlement read stopped at the page limit, so these counts can be short.");
  if (snapshot.emailsIncomplete) notes.push("Some account emails could not be read.");

  return {
    state: "value",
    detail: notes.join(" "),
    uniqueInRange: unique(inRange),
    ownedInRange: inRange.filter((row) => row.status === "active").length,
    uniqueAllTime: unique(live),
    ownedAllTime: live.filter((row) => row.status === "active").length,
    recent: orderedIds.map((userId) => {
      const rows = live.filter((row) => row.userId === userId);
      return {
        email: rows.find((row) => row.email)?.email ?? "Email unavailable",
        products: rows
          .slice()
          .sort((a, b) => Date.parse(b.purchasedAt ?? "") - Date.parse(a.purchasedAt ?? ""))
          .map((row) => ({
            title: productTitle(row.productSlug, products),
            slug: row.productSlug,
            status: row.status,
            purchasedAt: row.purchasedAt ? formatTokyoDateTime(Date.parse(row.purchasedAt)) : "Unknown date",
          })),
      };
    }),
  };
}

function overviewCards(input: DashboardInput): OverviewCard[] {
  const stripeRuntime =
    input.stripe.state === "live" ? "Live key" : input.stripe.state === "sandbox" ? "Sandbox key" : "Not connected";
  const recorded = (id: string) => areaById(id);
  const productionBits = ["japanese-site", "english-site", "stripe-live-checkout"]
    .map((id) => {
      const area = recorded(id);
      return area ? `${area.name} ${area.status}` : id;
    })
    .join(". ");
  const newsletterSignup = recorded("newsletter-signup");
  const newsletterSending = recorded("newsletter-sending");
  const card = (id: string, label: string): OverviewCard => {
    const area = recorded(id);
    return {
      id,
      label,
      value: area?.status ?? "Missing",
      detail: area?.note ?? "Missing from the project record.",
    };
  };

  return [
    {
      id: "production",
      label: "Production status",
      value: input.siteMode === "live" ? "Live" : "Coming soon",
      detail: `Runtime site mode is ${input.siteMode === "live" ? "live" : "coming soon"}. Stripe on this server: ${stripeRuntime}. Recorded: ${productionBits}.`,
    },
    {
      id: "premium-blueprints",
      label: "Total Premium Blueprints",
      value: String(input.premiumBlueprintCount),
      detail: "Premium kits in the blueprint catalog, including products that do not have checkout yet.",
    },
    card("collections", "Collections"),
    card("daily-inbox", "Daily Inbox"),
    card("blog", "Blog"),
    {
      id: "newsletter",
      label: "Newsletter",
      value: newsletterSignup && newsletterSending ? `${newsletterSignup.status} / ${newsletterSending.status}` : "Missing",
      detail: `Signup: ${newsletterSignup?.note ?? "Missing."} Sending: ${newsletterSending?.note ?? "Missing."}`,
    },
    card("atlas-weekly", "Atlas weekly automation"),
  ];
}
