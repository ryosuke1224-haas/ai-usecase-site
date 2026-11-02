import fs from "node:fs";
import { pathMatches } from "./guards";
import {
  DEFAULT_SHARED_WRITABLE_FILES,
  revertAbandonedSharedFiles,
  type SharedCleanupIo,
} from "./shared-file-cleanup";
import { changesSince, dirtyWorkspacePaths, restoreFiles, restorePathsToHead, type Baseline } from "./workspace";

export function candidateOwnedPrefixes(candidateId: string): string[] {
  return [
    `app/blueprints/${candidateId}/`,
    `components/premium/${candidateId}/`,
    `src/lib/premium/${candidateId}/`,
    `e2e/${candidateId}/`,
    `agent-specs/${candidateId}.json`,
    `agent-tasks/${candidateId}-premium-build.json`,
  ];
}

export function isSafeCandidateOwnedPath(file: string, candidateId: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  if (DEFAULT_SHARED_WRITABLE_FILES.some((file) => file === normalized)) return false;
  if (normalized.startsWith("atlas-memory/")) return false;
  if (normalized.startsWith("app/blueprints/") && !normalized.startsWith(`app/blueprints/${candidateId}/`)) {
    return false;
  }
  if (normalized.startsWith("components/premium/") && !normalized.startsWith(`components/premium/${candidateId}/`)) {
    return false;
  }
  if (normalized.startsWith("src/lib/premium/") && !normalized.startsWith(`src/lib/premium/${candidateId}/`)) {
    return false;
  }
  if (normalized.startsWith("e2e/") && !normalized.startsWith(`e2e/${candidateId}/`)) return false;
  return pathMatches(normalized, candidateOwnedPrefixes(candidateId));
}

export function restoreAbandonedCandidateFiles(
  baseline: Baseline,
  candidateId: string,
): { restored: string[]; skipped: string[] } {
  const changed = changesSince(baseline).map((change) => change.path);
  const restored = changed.filter((file) => isSafeCandidateOwnedPath(file, candidateId));
  const skipped = changed.filter((file) => !restored.includes(file));
  restoreFiles(baseline, restored);
  return { restored, skipped };
}

export function restoreAbandonedCandidateFromGit(
  candidateId: string,
  options: { scope?: string[]; io?: SharedCleanupIo } = {},
): {
  restored: string[];
  skipped: string[];
  unsafe: boolean;
  reason?: string;
} {
  try {
    const dirty = dirtyWorkspacePaths();
    const owned = dirty.filter((file) => isSafeCandidateOwnedPath(file, candidateId));
    const skippedOwned = dirty.filter((file) => !owned.includes(file));
    restorePathsToHead(owned);
    const shared = revertAbandonedSharedFiles({
      candidateId,
      scope: options.scope,
      io: options.io,
    });
    return {
      restored: [...owned, ...shared.restored],
      skipped: [...skippedOwned, ...shared.skipped],
      unsafe: shared.unsafe,
      reason: shared.reason,
    };
  } catch (error) {
    return {
      restored: [],
      skipped: [],
      unsafe: true,
      reason: error instanceof Error ? error.message : "Candidate cleanup failed.",
    };
  }
}

export function deleteUntrackedCandidateFiles(candidateId: string, files: string[]): string[] {
  const removed: string[] = [];
  for (const file of files) {
    if (!isSafeCandidateOwnedPath(file, candidateId)) continue;
    const abs = file.replace(/\\/g, "/");
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (!stat.isFile()) continue;
    fs.unlinkSync(abs);
    removed.push(abs);
  }
  return removed;
}
