/**
 * Provisions one-time prices on the Japanese live Stripe account.
 * Accepts sk_live_ and rk_live_ keys. Refuses test keys.
 * --preflight checks permissions and creates nothing.
 */
import fs from "node:fs";
import Stripe from "stripe";
import { loadAtlasLocalEnv } from "./atlas-auto/local-env";
import { formatRegistrySync, readMergedRegistry, registryMarketSchemaReady, saveRegistryRow } from "./atlas-commerce/save-registry";
import {
  COLLECTIONS_JPY_AMOUNT,
  LAUNCH_JPY_AMOUNT,
  LAUNCH_PRODUCTS,
  LAUNCH_USD_CENTS,
  launchLiveRegistryRows,
} from "../src/lib/payments/launch-catalog";
import { isLiveStripeKey } from "../src/lib/payments/stripe-mode";
import { findRegistryMapping, mappingKey, resolveTrustedPriceId, type RegistryProduct } from "../src/lib/payments/registry";

const SITE = "https://aiusecaseatlas.com";

type PricePlan = {
  slug: string;
  name: string;
  currency: "jpy" | "usd";
  locale: "ja" | "en";
  amount: number;
};

function redact(value: string): string {
  return value
    .replace(/\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\bwhsec_[A-Za-z0-9]+/g, "[redacted]");
}

function fail(message: string): never {
  console.error(redact(message));
  console.error("Created: nothing further");
  process.exit(1);
}

function readEnvFile(file: string): string {
  if (!fs.existsSync(file)) fail("Env file is missing. Created: nothing");
  const line = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((item) => item.startsWith("STRIPE_SECRET_KEY="));
  const raw = line?.slice("STRIPE_SECRET_KEY=".length).trim().replace(/^["']|["']$/g, "") ?? "";
  if (!raw || raw === "[SENSITIVE]") fail("STRIPE_SECRET_KEY is missing from the production env file. Created: nothing");
  return raw;
}

function keyClass(key: string): string {
  if (key.startsWith("rk_live_")) return "restricted-live";
  if (key.startsWith("sk_live_")) return "secret-live";
  if (key.startsWith("rk_test_") || key.startsWith("sk_test_")) return "test";
  return "unknown";
}

function plans(): PricePlan[] {
  const blueprints = LAUNCH_PRODUCTS.flatMap((item) => [
    { slug: item.slug, name: item.name, currency: "jpy" as const, locale: "ja" as const, amount: LAUNCH_JPY_AMOUNT },
    { slug: item.slug, name: item.name, currency: "usd" as const, locale: "en" as const, amount: LAUNCH_USD_CENTS },
  ]);
  return [
    ...blueprints,
    {
      slug: "ai-collections-assistant",
      name: "AI Collections Assistant",
      currency: "jpy",
      locale: "ja",
      amount: COLLECTIONS_JPY_AMOUNT,
    },
  ];
}

async function stripeCall(
  key: string,
  method: string,
  path: string,
  body?: string,
): Promise<{ status: number; payload: { error?: { code?: string; message?: string; param?: string }; country?: string } }> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body,
  });
  const payload = (await response.json()) as {
    id?: string;
    livemode?: boolean;
    country?: string;
  };
  return { status: response.status, payload };
}

function permissionName(message: string): string | null {
  return message.match(/\b(rak_[a-z0-9_]+)\b/)?.[1] ?? null;
}

async function probe(
  key: string,
  method: string,
  path: string,
  body?: string,
): Promise<{ ok: boolean; permission: string | null; detail: string }> {
  const result = await stripeCall(key, method, path, body);
  const error = result.payload.error;
  const message = error?.message ?? "";
  const permission = permissionName(message);
  if (permission || error?.code === "more_permissions_required" || result.status === 401 || result.status === 403) {
    return { ok: false, permission, detail: redact(message || `HTTP ${result.status}`) };
  }
  if (result.status >= 200 && result.status < 300) return { ok: true, permission: null, detail: "allowed" };
  if (error?.code === "resource_missing" || error?.code === "parameter_missing" || error?.param) {
    return { ok: true, permission: null, detail: error.code ?? error.param ?? "validation" };
  }
  return { ok: false, permission: null, detail: redact(message || `HTTP ${result.status}`) };
}

function sandboxIds(products: RegistryProduct[]): Map<string, string> {
  return new Map(
    products
      .filter((row) => row.stripe_environment === "SANDBOX" && row.stripe_price_id)
      .map((row) => [mappingKey(row), row.stripe_price_id as string]),
  );
}

async function findProduct(stripe: Stripe, slug: string): Promise<Stripe.Product | null> {
  const query = `active:'true' AND metadata['atlas_product_slug']:'${slug}' AND metadata['atlas_environment']:'LIVE'`;
  try {
    const found = await stripe.products.search({ query, limit: 1 });
    return found.data[0] ?? null;
  } catch {
    const listed = await stripe.products.list({ active: true, limit: 100 });
    return (
      listed.data.find(
        (product) => product.metadata.atlas_product_slug === slug && product.metadata.atlas_environment === "LIVE",
      ) ?? null
    );
  }
}

async function findPrice(stripe: Stripe, productId: string, amount: number, currency: "jpy" | "usd"): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return (
    prices.data.find(
      (price) =>
        price.livemode === true &&
        price.type === "one_time" &&
        price.currency === currency &&
        price.unit_amount === amount &&
        price.metadata.atlas_environment !== "SANDBOX",
    ) ?? null
  );
}

async function main() {
  const preflight = process.argv.includes("--preflight") || process.argv.includes("preflight");
  const envFile = process.argv.find((arg) => arg.startsWith("--env-file="))?.slice("--env-file=".length);
  const key = envFile ? readEnvFile(envFile) : (process.env.STRIPE_SECRET_KEY?.trim() ?? "");
  if (!key || key === "[SENSITIVE]") fail("STRIPE_SECRET_KEY is not available. Created: nothing");
  const kind = keyClass(key);
  if (!isLiveStripeKey(key)) fail(`Production key class is ${kind}. Live provisioning requires sk_live_ or rk_live_. Created: nothing`);
  console.log(`Production key class: ${kind}`);

  const checks = await Promise.all([
    probe(key, "GET", "/v1/products?limit=1"),
    probe(key, "GET", "/v1/prices?limit=1"),
    probe(key, "POST", "/v1/products", ""),
    probe(key, "POST", "/v1/prices", ""),
    probe(key, "POST", "/v1/checkout/sessions", ""),
    probe(key, "GET", "/v1/products/prod_permission_probe"),
    probe(key, "GET", "/v1/prices/price_permission_probe"),
  ]);
  const labels = ["product-read", "price-read", "product-write", "price-write", "checkout-write", "product-retrieve", "price-retrieve"];
  const missing: string[] = [];
  labels.forEach((label, index) => {
    const item = checks[index];
    console.log(`${label}: ${item?.ok ? "allowed" : "missing"} ${item?.permission ?? item?.detail ?? ""}`.trim());
    if (!item?.ok) missing.push(item?.permission ?? label);
  });
  const account = await stripeCall(key, "GET", "/v1/account");
  if (account.payload.country) console.log(`Account country: ${account.payload.country}`);
  else console.log("Account country: not readable with this restricted key");
  if (account.payload.country && account.payload.country !== "JP") {
    fail(`Account country is ${account.payload.country}. Created: nothing`);
  }
  if (missing.length > 0) {
    console.error(`Missing Stripe permissions: ${[...new Set(missing)].join(", ")}`);
    fail("Restricted key cannot perform the launch operations. Created: nothing");
  }

  process.env.STRIPE_SECRET_KEY = key;
  loadAtlasLocalEnv();
  process.env.STRIPE_SECRET_KEY = key;
  const schema = await registryMarketSchemaReady();
  if (!schema.ok) fail(`Registry is not ready: ${schema.reason}. Created: nothing`);
  const before = await readMergedRegistry();
  const sandboxBefore = sandboxIds(before);
  console.log(`Sandbox registry rows preserved for comparison: ${sandboxBefore.size}`);
  console.log("Daily Inbox: free, no paid live price");
  if (preflight) {
    console.log("Preflight passed. Created: nothing");
    return;
  }

  const stripe = new Stripe(key);
  const createdPriceIds: string[] = [];
  for (const plan of plans()) {
    let product = await findProduct(stripe, plan.slug);
    let createdProduct = false;
    if (product && product.livemode !== true) fail(`${plan.slug} matched a non-live product. Created: stopped`);
    if (!product) {
      product = await stripe.products.create(
        {
          name: plan.name,
          metadata: {
            atlas_product_slug: plan.slug,
            atlas_market: "JP",
            atlas_environment: "LIVE",
          },
        },
        { idempotencyKey: `atlas-live-product-${plan.slug}` },
      );
      createdProduct = true;
    }
    if (product.livemode !== true) fail(`${plan.slug} product is not live. Created: stopped`);

    let price = await findPrice(stripe, product.id, plan.amount, plan.currency);
    let createdPrice = false;
    if (!price) {
      price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: plan.amount,
          currency: plan.currency,
          metadata: {
            atlas_product_slug: plan.slug,
            atlas_market: "JP",
            atlas_locale: plan.locale,
            atlas_currency: plan.currency,
            atlas_environment: "LIVE",
          },
        },
        { idempotencyKey: `atlas-live-price-${plan.slug}-${plan.currency}-${plan.amount}` },
      );
      createdPrice = true;
    }
    if (price.livemode !== true || price.type !== "one_time" || price.unit_amount !== plan.amount || price.currency !== plan.currency) {
      fail(`${plan.slug} ${plan.currency} price did not match the approved one-time amount. Created: stopped`);
    }
    if ([...sandboxBefore.values()].includes(price.id)) fail(`${plan.slug} resolved a sandbox price id. Created: stopped`);

    const template = launchLiveRegistryRows().find(
      (row) => row.product_slug === plan.slug && row.currency === plan.currency && row.locale === plan.locale,
    );
    if (!template || template.stripe_environment !== "LIVE" || template.market !== "JP") {
      fail(`${plan.slug} has no live registry template. Created: stopped`);
    }
    const row: RegistryProduct = {
      ...template,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      updated_at: new Date().toISOString(),
    };
    const sync = await saveRegistryRow(row);
    createdPriceIds.push(price.id);
    console.log(
      `${plan.slug} ${plan.currency} ${plan.amount} product ${product.id} price ${price.id} createdProduct=${createdProduct} createdPrice=${createdPrice} reused=${!createdProduct && !createdPrice} ${formatRegistrySync(sync)}`,
    );
  }

  const after = await readMergedRegistry();
  const sandboxAfter = sandboxIds(after);
  for (const [keyName, priceId] of sandboxBefore) {
    if (sandboxAfter.get(keyName) !== priceId) fail(`Sandbox registry row changed: ${keyName}`);
  }
  const quote = "quote-request-assistant";
  const products = after;
  const yen = resolveTrustedPriceId(quote, { products, market: "JP", locale: "ja", currency: "jpy", environment: "LIVE" });
  const dollar = resolveTrustedPriceId(quote, { products, market: "JP", locale: "en", currency: "usd", environment: "LIVE" });
  const collections = resolveTrustedPriceId("ai-collections-assistant", {
    products,
    market: "JP",
    locale: "ja",
    currency: "jpy",
    environment: "LIVE",
  });
  const sandboxQuote = resolveTrustedPriceId(quote, { products, market: "JP", locale: "ja", currency: "jpy", environment: "SANDBOX" });
  if (!yen.ok || !dollar.ok || yen.priceId === dollar.priceId) fail("Live yen and dollar prices did not resolve separately.");
  if (!collections.ok) fail("Collections live price did not resolve.");
  if (yen.priceId === (sandboxQuote.ok ? sandboxQuote.priceId : yen.priceId) && sandboxQuote.ok) {
    fail("Live yen price matches the sandbox price.");
  }
  const liveQuote = findRegistryMapping(products, {
    product_slug: quote,
    market: "JP",
    locale: "ja",
    currency: "jpy",
    stripe_environment: "LIVE",
  });
  const liveEnglish = findRegistryMapping(products, {
    product_slug: quote,
    market: "JP",
    locale: "en",
    currency: "usd",
    stripe_environment: "LIVE",
  });
  if (liveQuote?.stripe_product_id !== liveEnglish?.stripe_product_id) fail("Yen and dollar prices are not on the same product.");
  console.log(`Verified quote JPY ${yen.priceId} and USD ${dollar.priceId} on ${liveQuote?.stripe_product_id}`);
  console.log(`Verified collections JPY ${collections.priceId}`);
  console.log(`Sandbox rows unchanged: ${sandboxBefore.size}`);
  console.log(`Live prices stored: ${createdPriceIds.length}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Live provisioning failed.";
  console.error(redact(message));
  console.error("Created: stopped");
  process.exit(1);
});
