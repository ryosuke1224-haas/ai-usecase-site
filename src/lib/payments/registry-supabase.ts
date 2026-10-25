import "server-only";

import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import type { RegistryProduct } from "./registry";

/** Service-role read. Returns null when the table or key is not available. */
export async function readSupabaseRegistry(): Promise<RegistryProduct[] | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return null;
  }
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("product_registry").select("*");
    if (error || !data) return null;
    return data.flatMap((row) => {
      const product = row as Partial<RegistryProduct>;
      if (!product.product_slug || !product.name || !product.status) return [];
      return [product as RegistryProduct];
    });
  } catch {
    return null;
  }
}
