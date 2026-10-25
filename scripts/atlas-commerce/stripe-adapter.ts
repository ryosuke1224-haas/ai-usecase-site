import Stripe from "stripe";
import type { SandboxStripe } from "../../src/lib/payments/provision";

/** Sandbox Stripe calls. The secret key stays in this process and is never returned. */
export function sandboxStripe(stripe: Stripe): SandboxStripe {
  return {
    async findProductBySlug(slug) {
      const result = await stripe.products.search({
        query: `active:'true' AND metadata['atlas_product_slug']:'${slug}'`,
        limit: 1,
      });
      const product = result.data[0];
      if (product) return { id: product.id };
      if (slug !== "ai-collections-assistant") return null;
      const priceId = process.env.STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT?.trim() ?? "";
      if (!/^price_[A-Za-z0-9]+$/.test(priceId)) return null;
      const price = await stripe.prices.retrieve(priceId);
      const productId = typeof price.product === "string" ? price.product : price.product.id;
      return productId.startsWith("prod_") ? { id: productId } : null;
    },
    async findPrice(productId, amountCents) {
      const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
      const match = prices.data.find(
        (price) => price.unit_amount === amountCents && price.currency === "usd" && price.type === "one_time",
      );
      return match ? { id: match.id } : null;
    },
    async createProduct({ name, slug }) {
      const product = await stripe.products.create(
        {
          name,
          metadata: { atlas_product_slug: slug, atlas_environment: "SANDBOX" },
        },
        { idempotencyKey: `atlas-sandbox-product-${slug}` },
      );
      return { id: product.id };
    },
    async createPrice({ productId, amountCents, slug }) {
      const price = await stripe.prices.create(
        {
          product: productId,
          unit_amount: amountCents,
          currency: "usd",
          metadata: { atlas_product_slug: slug, atlas_environment: "SANDBOX" },
        },
        { idempotencyKey: `atlas-sandbox-price-${slug}-${amountCents}` },
      );
      return { id: price.id };
    },
  };
}
