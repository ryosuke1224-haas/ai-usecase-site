import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";
import { loadAtlasLocalEnv } from "../atlas-auto/local-env";
import { WEEKLY_FEEDS } from "./feeds";
import { writeWeeklyState } from "./files";
import { runUntilSettled } from "./pipeline";
import { dedupeSources, fetchFeed } from "./research";
import { knownQueueKeys, rememberRun, supabaseQueue } from "./remote";
import { resolveWeeklyRun } from "./resolve-run";
import type { SourceRecord } from "./types";
import { selectWriter } from "./writer";

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
  const rerun = process.argv.includes("--rerun");
  const editionIndex = process.argv.indexOf("--edition");
  const edition = editionIndex === -1 ? undefined : process.argv[editionIndex + 1] ?? "";
  if (!dryRun) loadAtlasLocalEnv();
  const writer = selectWriter();
  const now = new Date();
  const root = process.cwd();
  const resolved = resolveWeeklyRun({ root, now, rerun, dryRun, edition });
  const state = resolved.state;
  if (resolved.reusedCompleted) {
    console.log(
      `${state.weekKey} ${state.status} ${state.stage} queued ${state.counts.queued} rejected ${state.counts.qaRejected}`,
    );
    console.log("Completed week reused. Pass --rerun to generate a new edition.");
    return;
  }
  if (!state.completed.includes("RESEARCH")) state.errors = [];
  if (resolved.rerun) {
    console.log(`Rerun of ${resolved.baseWeekKey} as ${state.weekKey}`);
  }
  const fetched = state.completed.includes("RESEARCH")
    ? null
    : await research(now);
  if (fetched) state.errors = [...state.errors, ...fetched.errors].slice(-20);
  const known = dryRun ? { urls: [], titles: [] } : await knownQueueKeys();
  const finished = await runUntilSettled(state, {
    root,
    writer,
    now,
    products,
    knownUrls: known.urls,
    knownTitles: known.titles,
    dryRun,
    fetchSources: async () => fetched?.records ?? state.research,
    queue: dryRun ? undefined : supabaseQueue() ?? undefined,
  });
  writeWeeklyState(root, finished, dryRun);
  if (!dryRun) await rememberRun(finished).catch(() => {
    finished.errors.push("Run history table is not available yet.");
    writeWeeklyState(root, finished);
  });
  const line = `${finished.weekKey} ${finished.status} ${finished.stage} queued ${finished.counts.queued} rejected ${finished.counts.qaRejected}`;
  console.log(line);
  if (finished.pendingDrafts?.length && finished.status !== "failed") {
    console.log(`Waiting for manual drafts in atlas-memory/weekly/${finished.weekKey}/drafts: ${finished.pendingDrafts.join(", ")}`);
  }
  if (finished.status === "failed") {
    console.error(finished.errors.at(-1));
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Weekly run failed";
  console.error(message);
  process.exitCode = 1;
});
