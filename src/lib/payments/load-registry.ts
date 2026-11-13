import "server-only";

import { launchLiveRegistryRows, launchRegistryRows } from "./launch-catalog";
import { mergeRegistryProducts, readRegistryFile, type RegistryProduct } from "./registry";
import { readSupabaseRegistry } from "./registry-supabase";

/** Supabase wins per market mapping. The launch catalog fills mappings that are not saved yet. */
export async function loadRegistryProducts(): Promise<RegistryProduct[]> {
  const local = readRegistryFile();
  const remote = await readSupabaseRegistry();
  return mergeRegistryProducts(
    mergeRegistryProducts(launchRegistryRows(), launchLiveRegistryRows()),
    mergeRegistryProducts(local, remote),
  );
}
