import fs from "node:fs";
import path from "node:path";

export const TASK_SCOPE_CONFLICT = "TASK_SCOPE_CONFLICT";
export const HUMAN_INTERVENTION_REQUIRED = "HUMAN_INTERVENTION_REQUIRED";

const STALE_ISOLATION = [
  /my-blueprints contains zero links/i,
  /not linked from the homepage, header, or My Blueprints/i,
  /does not add an entry to src\/lib\/blueprints\.ts/i,
  /does not import hasActiveEntitlement/i,
  /No existing file is modified/i,
  /authenticated\.spec\.ts should be (?:rewritten|modified)/i,
];

export function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function isDirectoryPattern(value: string): boolean {
  const normalized = value.replace(/\\/g, "/");
  if (normalized.endsWith("/")) return true;
  return path.extname(normalized) === "";
}

/** Exact shared paths, or a forbidden directory that contains a scope path. */
export function scopeForbiddenOverlap(scope: string[], forbidden: string[]): string[] {
  const hits = new Set<string>();
  for (const rawScope of scope) {
    const scoped = normalizeRepoPath(rawScope);
    for (const rawForbidden of forbidden) {
      const blocked = normalizeRepoPath(rawForbidden);
      if (scoped === blocked) {
        hits.add(scoped);
        continue;
      }
      if (isDirectoryPattern(rawForbidden) && (scoped === blocked || scoped.startsWith(`${blocked}/`))) {
        hits.add(scoped);
      }
    }
  }
  return [...hits];
}

export function staleAcceptanceCriteria(criteria: string[]): string[] {
  return criteria.filter((item) => STALE_ISOLATION.some((pattern) => pattern.test(item)));
}

export function specRequiresCatalogListing(spec: {
  allowed_paths?: string[];
  acceptance_criteria: string[];
}): boolean {
  if ((spec.allowed_paths ?? []).some((item) => normalizeRepoPath(item) === "src/lib/blueprints.ts")) {
    return true;
  }
  return spec.acceptance_criteria.some(
    (item) => /src\/lib\/blueprints\.ts/.test(item) && /registered|Open Blueprint|My Blueprints/i.test(item),
  );
}

export function existingAuthenticatedSpec(candidateId: string): string | null {
  const file = `e2e/${candidateId}/authenticated.spec.ts`;
  return fs.existsSync(file) ? file : null;
}
