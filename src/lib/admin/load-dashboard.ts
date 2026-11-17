import "server-only";

import type Stripe from "stripe";
import { isUuid } from "@/src/lib/payments/ids";
import { stripeRuntimeMode } from "@/src/lib/payments/stripe-mode";
import { getSiteMode } from "@/src/lib/site-mode";
import { getStripe, serverCommerceEnv } from "@/src/lib/stripe/server";
import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { summarizeArticles } from "@/src/lib/blog/model";
import { loadArticleStatuses } from "@/src/lib/blog/store";
import { summarizeSubscribers } from "@/src/lib/newsletter/model";
import { loadSubscriberRows } from "@/src/lib/newsletter/store";
import { performanceProducts, premiumBlueprintCount, vercelAnalyticsInstalled } from "./catalog";
import { readVercelAnalytics } from "./analytics-query";
import {
  auditAnalytics,
  buildOperationsDashboard,
  cleanEmail,
  entitlementFact,
  toCheckoutFact,
  type BlogSnapshot,
  type CheckoutFact,
  type CustomerSnapshot,
  type DashboardModel,
  type NewsletterSnapshot,
  type StripeSnapshot,
} from "./dashboard-model";
import { rangeStart, type DashboardRange } from "./range";

const SESSION_PAGE_LIMIT = 10;
const ENTITLEMENT_LIMIT = 1000;
const EMAIL_LOOKUP_LIMIT = 100;

/**
 * Read-only Checkout list. No expand, no writes, and no card or customer objects
 * are copied into the dashboard model.
 */
async function listCheckoutFacts(
  stripe: Stripe,
  createdGte: number,
): Promise<{ sessions: CheckoutFact[]; truncated: boolean }> {
  const sessions: CheckoutFact[] = [];
  let startingAfter: string | undefined;
  for (let page = 0; page < SESSION_PAGE_LIMIT; page += 1) {
    const result = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: createdGte },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const session of result.data) {
      const fact = toCheckoutFact({
        created: session.created,
        livemode: session.livemode,
        payment_status: session.payment_status,
        status: session.status,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: { product_slug: session.metadata?.product_slug ?? null },
      });
      if (fact) sessions.push(fact);
    }
    if (!result.has_more) return { sessions, truncated: false };
    const last = result.data.at(-1);
    if (!last) return { sessions, truncated: true };
    startingAfter = last.id;
  }
  return { sessions, truncated: true };
}

async function loadStripe(createdGte: number): Promise<StripeSnapshot> {
  try {
    const mode = stripeRuntimeMode(serverCommerceEnv());
    const stripe = getStripe();
    try {
      const listed = await listCheckoutFacts(stripe, createdGte);
      if (mode === "live") {
        return { state: "live", sessions: listed.sessions, truncated: listed.truncated };
      }
      return { state: "sandbox", sessions: listed.sessions, truncated: listed.truncated };
    } catch {
      return { state: "not_connected", detail: "Stripe could not be read. No revenue is shown." };
    }
  } catch {
    return { state: "not_connected", detail: "Stripe is not configured on this server." };
  }
}

async function loadCustomers(): Promise<CustomerSnapshot> {
  let supabase: ReturnType<typeof createServiceRoleClient>;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return { state: "not_connected", detail: "Customer records are not configured on this server." };
  }

  try {
    const { data, error } = await supabase
      .from("entitlements")
      .select("user_id, product_slug, status, purchased_at, stripe_checkout_session_id")
      .limit(ENTITLEMENT_LIMIT);
    if (error || !data) return { state: "not_connected", detail: "Customer records could not be read." };

    const rows = data.flatMap((row) => {
      const fact = entitlementFact(row, null);
      return fact ? [fact] : [];
    });
    const liveIds = [...new Set(rows.filter((row) => row.checkout === "live").map((row) => row.userId))];
    const lookupIds = liveIds.filter((id) => isUuid(id)).slice(0, EMAIL_LOOKUP_LIMIT);
    const emails = new Map<string, string>();
    let emailsIncomplete = liveIds.length > EMAIL_LOOKUP_LIMIT || lookupIds.length !== Math.min(liveIds.length, EMAIL_LOOKUP_LIMIT);

    for (const id of lookupIds) {
      try {
        const result = await supabase.auth.admin.getUserById(id);
        if (result.error) {
          emailsIncomplete = true;
          continue;
        }
        const email = cleanEmail(result.data.user?.email);
        if (email) emails.set(id, email);
      } catch {
        emailsIncomplete = true;
      }
    }

    return {
      state: "value",
      truncated: data.length >= ENTITLEMENT_LIMIT,
      emailsIncomplete,
      rows: rows.map((row) => ({ ...row, email: emails.get(row.userId) ?? null })),
    };
  } catch {
    return { state: "not_connected", detail: "Customer records could not be read." };
  }
}

async function loadBlog(): Promise<BlogSnapshot> {
  const rows = await loadArticleStatuses();
  if (!rows) {
    return {
      state: "not_connected",
      detail: "Article storage is not available. Apply the Atlas articles migration before counts can be shown.",
    };
  }
  return { state: "value", ...summarizeArticles(rows) };
}

async function loadNewsletter(now: Date): Promise<NewsletterSnapshot> {
  const rows = await loadSubscriberRows();
  if (!rows) {
    return {
      state: "not_connected",
      detail: "Subscriber storage is not available. Apply the Atlas newsletter migration before counts can be shown.",
    };
  }
  return { state: "value", ...summarizeSubscribers(rows, now) };
}

export async function loadOperationsDashboard(input: {
  range: DashboardRange;
  viewerEmail: string;
}): Promise<DashboardModel> {
  const now = new Date();
  const createdGte = Math.floor(rangeStart(input.range, now).getTime() / 1000);
  const products = performanceProducts();
  const vercelInstalled = vercelAnalyticsInstalled();
  const [stripe, customers, blog, newsletter, analyticsRead] = await Promise.all([
    loadStripe(createdGte),
    loadCustomers(),
    loadBlog(),
    loadNewsletter(now),
    vercelInstalled
      ? readVercelAnalytics({
          range: input.range,
          now,
          productSlugs: products.map((product) => product.slug),
          env: process.env,
          request: requestVercelAnalytics,
        })
      : Promise.resolve(null),
  ]);
  return buildOperationsDashboard({
    now,
    range: input.range,
    viewerEmail: input.viewerEmail,
    siteMode: getSiteMode(),
    stripe,
    customers,
    blog,
    newsletter,
    analytics: auditAnalytics({
      gaCollectionConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()),
      vercelAnalyticsInstalled: vercelInstalled,
      read: analyticsRead,
    }),
    products,
    premiumBlueprintCount: premiumBlueprintCount(),
  });
}

async function requestVercelAnalytics(url: string, token: string): Promise<{ ok: boolean; body: unknown }> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return { ok: false, body: null };
  try {
    return { ok: true, body: await response.json() };
  } catch {
    return { ok: false, body: null };
  }
}
