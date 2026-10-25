import Stripe from "stripe";
import type { SandboxStripe } from "../../src/lib/payments/provision";
import type { MarketCode, RegistryCurrency } from "../../src/lib/payments/registry";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Sandbox Stripe calls. The secret key stays in this process and is never returned. */
export function sandboxStripe(stripe: Stripe): SandboxStripe {
  return {
    async findProductBySlug(slug, market = "US") {
      if (!SLUG.test(slug) || (market !== "US" && market !== "JP")) return null;
      const scoped = await stripe.products.search({
        query: `active:'true' AND metadata['atlas_product_slug']:'${slug}' AND metadata['atlas_market']:'${market}'`,
        limit: 1,
      });
      if (scoped.data[0]) return { id: scoped.data[0].id };
      if (market !== "US") return null;
      const loose = await stripe.products.search({
        query: `active:'true' AND metadata['atlas_product_slug']:'${slug}'`,
        limit: 1,
      });
      const product = loose.data[0];
      if (product) {
        const tagged = product.metadata?.atlas_market;
        if (tagged && tagged !== "US") return null;
        return { id: product.id };
      }
      if (slug !== "ai-collections-assistant") return null;
      const priceId = process.env.STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT?.trim() ?? "";
      if (!/^price_[A-Za-z0-9]+$/.test(priceId)) return null;
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      return productId.startsWith("prod_") ? { id: productId } : null;
    },
    async findPrice(productId, amountCents, currency = "usd") {
      if (currency !== "usd" && currency !== "jpy") return null;
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
      const match = prices.data.find(
        (price) => price.unit_amount === amountCents && price.currency === currency && price.type === "one_time",
      );
      return match ? { id: match.id } : null;
    },
    async createProduct({ name, slug, market = "US", locale }) {
      const product = await stripe.products.create(
        {
          name,
          metadata: {
            atlas_product_slug: slug,
            atlas_market: market,
            atlas_locale: locale ?? (market === "JP" ? "ja" : "en"),
            atlas_environment: "SANDBOX",
          },
        },
        { idempotencyKey: productIdempotencyKey(slug, market) },
      );
      return { id: product.id };
    },
    async createPrice({ productId, amountCents, slug, currency = "usd", market = "US" }) {
      const price = await stripe.prices.create(
        {
          product: productId,
          unit_amount: amountCents,
          currency,
          metadata: {
            atlas_product_slug: slug,
            atlas_market: market,
            atlas_currency: currency,
            atlas_environment: "SANDBOX",
          },
        },
        { idempotencyKey: priceIdempotencyKey(slug, amountCents, market, currency) },
      );
      return { id: price.id };
    },
  };
}

function productIdempotencyKey(slug: string, market: MarketCode): string {
  if (market === "US") return `atlas-sandbox-product-${slug}`;
  return `atlas-sandbox-product-${market}-${slug}`;
}

function priceIdempotencyKey(slug: string, amount: number, market: MarketCode, currency: RegistryCurrency): string {
  if (market === "US" && currency === "usd") return `atlas-sandbox-price-${slug}-${amount}`;
  return `atlas-sandbox-price-${market}-${currency}-${slug}-${amount}`;
}
