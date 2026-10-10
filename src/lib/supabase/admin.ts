import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the Stripe webhook.
 * Never import this from a Client Component or expose the key to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !key) {
    throw new Error("Supabase service role is not configured.");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
