import { createClient } from "@supabase/supabase-js";
import {
  mergeRegistryProducts,
  readRegistryFile,
  upsertRegistryProduct,
  writeRegistryFile,
  type RegistryProduct,
} from "../../src/lib/payments/registry";

/** Local file plus Supabase, when the table exists. Remote rows win. */
export async function readMergedRegistry(): Promise<RegistryProduct[]> {
  const local = readRegistryFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !key) return local;
  try {
    const { data, error } = await registryClient().from("product_registry").select("*");
    if (error || !data) return local;
    return mergeRegistryProducts(local, data as Array<Partial<RegistryProduct>>);
  } catch {
    return local;
  }
}

export type RegistrySyncResult = { status: "updated" } | { status: "skipped"; reason: string };

/** Names the missing server credential. Returns null when both values are set. */
export function missingSupabaseRegistryConfig(env: NodeJS.ProcessEnv = process.env): string | null {
  const missing: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length === 0) return null;
  return missing.length === 1 ? `${missing[0]} is not set.` : `${missing.join(" and ")} are not set.`;
}

/** Removes secret keys and full Stripe ids from a sync failure. */
export function publicRegistrySyncReason(reason: string, env: NodeJS.ProcessEnv = process.env): string {
  const secrets = [
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.STRIPE_SECRET_KEY,
    env.STRIPE_SECRET_KEY_US_SANDBOX,
    env.STRIPE_SECRET_KEY_JP_SANDBOX,
    env.STRIPE_SECRET_KEY_JP_LIVE,
    env.STRIPE_WEBHOOK_SECRET,
    env.STRIPE_WEBHOOK_SECRET_JP_SANDBOX,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    env.STRIPE_PRICE_AI_COLLECTIONS_ASSISTANT,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => value.length >= 8);
  let text = reason.replace(/\s+/g, " ").trim();
  for (const secret of secrets) text = text.split(secret).join("[redacted]");
  text = text
    .replace(/\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\bwhsec_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/\bprice_[A-Za-z0-9]+/g, "price_[redacted]")
    .replace(/\bprod_[A-Za-z0-9]+/g, "prod_[redacted]");
  if (!text) return "Supabase returned an empty error.";
  return text.slice(0, 240);
}

export function formatRegistrySync(result: RegistrySyncResult): string {
  return result.status === "updated" ? "Supabase registry updated." : `Supabase registry skipped: ${result.reason}`;
}

function supabaseErrorReason(error: { message?: string; code?: string; details?: string; hint?: string }): string {
  const parts = [error.code, error.message, error.details, error.hint].filter((part) => part && part.trim());
  return publicRegistrySyncReason(parts.join(" ") || "Supabase rejected the registry upsert.");
}

function registryClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Confirms the multi-market columns exist before a new Stripe product is created. */
export async function registryMarketSchemaReady(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const missing = missingSupabaseRegistryConfig();
  if (missing) return { ok: false, reason: missing };
  try {
    const { error } = await registryClient().from("product_registry").select("market,locale").limit(1);
    if (error) return { ok: false, reason: supabaseErrorReason(error) };
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase registry schema check failed.";
    return { ok: false, reason: publicRegistrySyncReason(message) };
  }
}

/** Writes the local registry. Updates Supabase when the service role and table are available. */
export async function saveRegistryRow(row: RegistryProduct): Promise<RegistrySyncResult> {
  writeRegistryFile(upsertRegistryProduct(readRegistryFile(), row));
  const missing = missingSupabaseRegistryConfig();
  if (missing) return { status: "skipped", reason: missing };
  try {
    const { error } = await registryClient().from("product_registry").upsert(
      {
        product_slug: row.product_slug,
        name: row.name,
        stripe_product_id: row.stripe_product_id,
        stripe_price_id: row.stripe_price_id,
        price_amount: row.price_amount,
        suggested_price_amount: row.suggested_price_amount,
        approved_price_amount: row.approved_price_amount,
        market: row.market,
        locale: row.locale,
        currency: row.currency,
        payment_type: row.payment_type,
        stripe_environment: row.stripe_environment,
        status: row.status,
        commercial_rationale: row.commercial_rationale,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      { onConflict: "product_slug,market,locale,currency,stripe_environment" },
    );
    if (error) return { status: "skipped", reason: supabaseErrorReason(error) };
    return { status: "updated" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase registry sync failed.";
    return { status: "skipped", reason: publicRegistrySyncReason(message) };
  }
}
