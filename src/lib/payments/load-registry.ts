import "server-only";

import { readRegistryFile, type RegistryProduct } from "./registry";
import { readSupabaseRegistry } from "./registry-supabase";

/** Supabase wins when it has a row. The local file covers the period before the migration is applied. */
export async function loadRegistryProducts(): Promise<RegistryProduct[]> {
  const local = readRegistryFile();
  const remote = await readSupabaseRegistry();
  if (!remote) return local;
  const merged = new Map(local.map((row) => [row.product_slug, row]));
  for (const row of remote) merged.set(row.product_slug, row);
  return [...merged.values()];
}
