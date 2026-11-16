import { randomUUID } from "node:crypto";
import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";
import { loadAtlasLocalEnv } from "../atlas-auto/local-env";
import { WEEKLY_FEEDS } from "./feeds";
import { readWeeklyState, writeWeeklyState } from "./files";
import { createRun, runUntilSettled } from "./pipeline";
import { dedupeSources, fetchFeed } from "./research";
import { knownQueueKeys, rememberRun, supabaseQueue } from "./remote";
import type { SourceRecord } from "./types";

const products = [
  ...LAUNCH_PRODUCTS.map((item) => ({ slug: item.slug, name: item.name })),
  { slug: COLLECTIONS_PRODUCT_SLUG, name: "AI Collections Assistant" },
];

async function research(now: Date): Promise<{ records: SourceRecord[]; errors: string[] }> {
  const retrievedAt = now.toISOString();
  const records: SourceRecord[] = [];
  const errors: string[] = [];
  for (const feed of WEEKLY_FEEDS) {
    try {
      records.push(...await fetchFeed(feed.url, feed.publisher, retrievedAt));
    } catch {
      errors.push(`${feed.publisher} could not be read`);
    }
  }
  return { records: dedupeSources(records), errors };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  loadAtlasLocalEnv();
  const now = new Date();
  const root = process.cwd();
  const fresh = createRun(now, `weekly-${randomUUID()}`);
  const existing = readWeeklyState(root, fresh.weekKey);
  const state = existing ?? fresh;
  if (!existing) state.errors = [];
  const fetched = state.completed.includes("RESEARCH")
    ? null
    : await research(now);
  if (fetched) state.errors = [...state.errors, ...fetched.errors].slice(-20);
  const known = await knownQueueKeys().catch(() => ({ urls: [] as string[], titles: [] as string[] }));
  const finished = await runUntilSettled(state, {
    now,
    products,
    knownUrls: known.urls,
    knownTitles: known.titles,
    dryRun,
    fetchSources: async () => fetched?.records ?? state.research,
    queue: dryRun ? undefined : supabaseQueue() ?? undefined,
  });
  writeWeeklyState(root, finished);
  await rememberRun(finished).catch(() => {
    finished.errors.push("Run history table is not available yet.");
    writeWeeklyState(root, finished);
  });
  const line = `${finished.weekKey} ${finished.status} ${finished.stage} queued ${finished.counts.queued} rejected ${finished.counts.qaRejected}`;
  console.log(line);
  if (finished.status === "failed") process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Weekly run failed";
  console.error(message);
  process.exitCode = 1;
});
