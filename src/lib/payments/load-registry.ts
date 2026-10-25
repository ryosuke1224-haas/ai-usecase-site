import "server-only";

import { mergeRegistryProducts, readRegistryFile, type RegistryProduct } from "./registry";
import { readSupabaseRegistry } from "./registry-supabase";

/** Supabase wins per market mapping. The local file covers the period before the migration is applied. */
export async function loadRegistryProducts(): Promise<RegistryProduct[]> {
  const local = readRegistryFile();
  const remote = await readSupabaseRegistry();
  return mergeRegistryProducts(local, remote);
}
