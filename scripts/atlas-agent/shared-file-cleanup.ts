import fs from "node:fs";
import path from "node:path";

export const DEFAULT_SHARED_WRITABLE_FILES = ["src/lib/blueprints.ts"] as const;
export const SHARED_FILE_BASELINE_SCHEMA = "atlas-shared-file-baseline-v1";
export const SHARED_BASELINE_DIR = "atlas-memory/builder-shared-baselines";

export type SharedFileBaseline = {
  schema_version: typeof SHARED_FILE_BASELINE_SCHEMA;
  candidate_id: string;
  captured_at: string;
  files: Record<string, string>;
};

export type SharedFileRevertResult = {
  text: string;
  changed: boolean;
  removedIds: string[];
};

export type SharedFileRevertFailure = {
  ambiguous: string;
};

export type SharedCleanupIo = {
  readFile(file: string): string | null;
  writeFile(file: string, text: string): void;
  readBaseline(candidateId: string): SharedFileBaseline | null;
  writeBaseline(snapshot: SharedFileBaseline): void;
  clearBaseline(candidateId: string): void;
};

export function candidateIdFromTask(task: { id: string; scope: string[] }): string {
  for (const entry of task.scope) {
    const normalized = entry.replace(/\\/g, "/");
    const match = normalized.match(/^app\/blueprints\/([^/]+)/);
    if (match?.[1] && match[1] !== "daily-inbox-briefing") return match[1];
  }
  return task.id.replace(/-premium-build$/, "");
}

export function sharedWritableFiles(scope: string[]): string[] {
  const files = new Set<string>(DEFAULT_SHARED_WRITABLE_FILES);
  for (const entry of scope) {
    const normalized = entry.replace(/\\/g, "/").replace(/\/$/, "");
    if (!normalized || normalized.endsWith("/")) continue;
    if (!normalized.includes(".")) continue;
    if (normalized.startsWith("app/blueprints/")) continue;
    if (normalized.startsWith("components/premium/")) continue;
    if (normalized.startsWith("src/lib/premium/")) continue;
    if (normalized.startsWith("e2e/")) continue;
    if (normalized.startsWith("agent-specs/")) continue;
    if (normalized.startsWith("agent-tasks/")) continue;
    files.add(normalized);
  }
  return [...files];
}

export function sharedBaselinePath(candidateId: string, root = SHARED_BASELINE_DIR): string {
  return `${root.replace(/\\/g, "/")}/${candidateId}.json`;
}

export function defaultSharedCleanupIo(root = SHARED_BASELINE_DIR): SharedCleanupIo {
  return {
    readFile(file) {
      const abs = path.resolve(process.cwd(), file);
      if (!fs.existsSync(abs)) return null;
      return fs.readFileSync(abs, "utf8");
    },
    writeFile(file, text) {
      const abs = path.resolve(process.cwd(), file);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, text);
    },
    readBaseline(candidateId) {
      const file = sharedBaselinePath(candidateId, root);
      if (!fs.existsSync(file)) return null;
      return JSON.parse(fs.readFileSync(file, "utf8")) as SharedFileBaseline;
    },
    writeBaseline(snapshot) {
      const file = sharedBaselinePath(snapshot.candidate_id, root);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
    },
    clearBaseline(candidateId) {
      const file = sharedBaselinePath(candidateId, root);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    },
  };
}

/** First Builder start wins so a retry keeps the original pre-candidate snapshot. */
export function clearSharedFileBaseline(candidateId: string, io: SharedCleanupIo = defaultSharedCleanupIo()): void {
  io.clearBaseline(candidateId);
}

export function captureSharedFileBaseline(input: {
  candidateId: string;
  scope: string[];
  now?: string;
  io?: SharedCleanupIo;
}): SharedFileBaseline {
  const io = input.io ?? defaultSharedCleanupIo();
  const existing = io.readBaseline(input.candidateId);
  if (existing) return existing;
  const files: Record<string, string> = {};
  for (const file of sharedWritableFiles(input.scope)) {
    const text = io.readFile(file);
    if (text !== null) files[file] = text;
  }
  const snapshot: SharedFileBaseline = {
    schema_version: SHARED_FILE_BASELINE_SCHEMA,
    candidate_id: input.candidateId,
    captured_at: input.now ?? new Date().toISOString(),
    files,
  };
  io.writeBaseline(snapshot);
  return snapshot;
}

export function revertSharedFileDelta(
  file: string,
  baseline: string,
  current: string,
  candidateId: string,
): SharedFileRevertResult | SharedFileRevertFailure {
  if (baseline === current) return { text: current, changed: false, removedIds: [] };
  if (file.replace(/\\/g, "/") === "src/lib/blueprints.ts") {
    return revertBlueprintCatalogDelta(baseline, current, candidateId);
  }
  return revertGenericSharedDelta(baseline, current, candidateId);
}

export function revertAbandonedSharedFiles(input: {
  candidateId: string;
  scope?: string[];
  io?: SharedCleanupIo;
}): { restored: string[]; skipped: string[]; unsafe: boolean; reason?: string } {
  const io = input.io ?? defaultSharedCleanupIo();
  const snapshot = io.readBaseline(input.candidateId);
  if (!snapshot) {
    return {
      restored: [],
      skipped: sharedWritableFiles(input.scope ?? [...DEFAULT_SHARED_WRITABLE_FILES]),
      unsafe: true,
      reason: "Shared-file baseline is missing. Candidate-only rollback is ambiguous.",
    };
  }
  const restored: string[] = [];
  const skipped: string[] = [];
  const files = input.scope ? sharedWritableFiles(input.scope) : Object.keys(snapshot.files);
  for (const file of files) {
    const baseline = snapshot.files[file];
    const current = io.readFile(file);
    if (baseline === undefined) {
      skipped.push(file);
      continue;
    }
    if (current === null) {
      return {
        restored,
        skipped: [...skipped, file],
        unsafe: true,
        reason: `${file} is missing after the timed-out Builder. Shared-file rollback is ambiguous.`,
      };
    }
    const result = revertSharedFileDelta(file, baseline, current, input.candidateId);
    if ("ambiguous" in result) {
      return { restored, skipped: [...skipped, file], unsafe: true, reason: result.ambiguous };
    }
    if (result.changed) {
      io.writeFile(file, result.text);
      restored.push(file);
    } else {
      skipped.push(file);
    }
  }
  io.clearBaseline(input.candidateId);
  return { restored, skipped, unsafe: false };
}

export function revertBlueprintCatalogDelta(
  baseline: string,
  current: string,
  candidateId: string,
): SharedFileRevertResult | SharedFileRevertFailure {
  const baseCatalog = parseBlueprintCatalog(baseline);
  const currentCatalog = parseBlueprintCatalog(current);
  if (!baseCatalog || !currentCatalog) {
    return { ambiguous: "src/lib/blueprints.ts catalog could not be parsed for candidate-only rollback." };
  }
  for (const entry of currentCatalog.entries) {
    if (entry.id !== candidateId && mentionsCandidate(entry.text, candidateId)) {
      return {
        ambiguous: `Candidate ${candidateId} appears inside catalog entry ${entry.id}. Shared-file rollback is ambiguous.`,
      };
    }
  }
  const prefixMerge = mergeNonCatalogRegion(baseCatalog.prefix, currentCatalog.prefix, candidateId, "prefix");
  if ("ambiguous" in prefixMerge) return prefixMerge;
  const suffixMerge = mergeNonCatalogRegion(baseCatalog.suffix, currentCatalog.suffix, candidateId, "suffix");
  if ("ambiguous" in suffixMerge) return suffixMerge;

  const existedBefore = baseCatalog.entries.find((entry) => entry.id === candidateId) ?? null;
  const kept = currentCatalog.entries.filter((entry) => entry.id !== candidateId);
  if (existedBefore) {
    const priorId = baseCatalog.entries[baseCatalog.entries.findIndex((entry) => entry.id === candidateId) - 1]?.id;
    const insertAt = priorId ? kept.findIndex((entry) => entry.id === priorId) + 1 : 0;
    kept.splice(Math.max(0, insertAt), 0, existedBefore);
  }
  const removed = existedBefore ? [] : currentCatalog.entries.filter((entry) => entry.id === candidateId).map((entry) => entry.id);
  const nextInterior =
    kept.length === 0
      ? "\n"
      : `\n${kept.map((entry) => entry.text.replace(/\s+$/, "")).join(",\n")},\n`;
  const text = `${prefixMerge.text}${currentCatalog.open}${nextInterior}${currentCatalog.close}${suffixMerge.text}`;
  return {
    text,
    changed: prefixMerge.changed || suffixMerge.changed || text !== current,
    removedIds: removed,
  };
}

type CatalogEntry = { id: string; text: string };

type ParsedCatalog = {
  prefix: string;
  open: string;
  close: string;
  suffix: string;
  entries: CatalogEntry[];
};

export function parseBlueprintCatalog(source: string): ParsedCatalog | null {
  const marker = source.match(/export\s+const\s+blueprintCatalog(?:\s*:\s*[^=]+)?\s*=\s*/);
  if (!marker || marker.index === undefined) return null;
  const openIndex = source.indexOf("[", marker.index + marker[0].length - 1);
  if (openIndex < 0) return null;
  const closeIndex = findMatching(source, openIndex, "[", "]");
  if (closeIndex < 0) return null;
  const interior = source.slice(openIndex + 1, closeIndex);
  const entries: CatalogEntry[] = [];
  let cursor = 0;
  while (cursor < interior.length) {
    const start = interior.indexOf("{", cursor);
    if (start < 0) break;
    const end = findMatching(interior, start, "{", "}");
    if (end < 0) return null;
    const text = interior.slice(start, end + 1);
    const id = text.match(/\bid\s*:\s*["']([^"']+)["']/)?.[1];
    if (!id) return null;
    entries.push({ id, text });
    cursor = end + 1;
  }
  return {
    prefix: source.slice(0, openIndex),
    open: "[",
    close: "]",
    suffix: source.slice(closeIndex + 1),
    entries,
  };
}

function revertGenericSharedDelta(
  baseline: string,
  current: string,
  candidateId: string,
): SharedFileRevertResult | SharedFileRevertFailure {
  const merged = mergeNonCatalogRegion(baseline, current, candidateId, "shared file");
  if ("ambiguous" in merged) return merged;
  return { text: merged.text, changed: merged.changed, removedIds: merged.changed ? [candidateId] : [] };
}

function mergeNonCatalogRegion(
  baseline: string,
  current: string,
  candidateId: string,
  label: string,
): { text: string; changed: boolean } | SharedFileRevertFailure {
  if (baseline === current) return { text: current, changed: false };
  const baseHas = mentionsCandidate(baseline, candidateId);
  const currentHas = mentionsCandidate(current, candidateId);
  if (!baseHas && !currentHas) return { text: current, changed: false };
  const out: string[] = [];
  const baseLines = splitKeep(baseline);
  const currentLines = splitKeep(current);
  let index = 0;
  for (const line of currentLines) {
    if (index < baseLines.length && line === baseLines[index]) {
      out.push(line);
      index += 1;
      continue;
    }
    const later = indexOfLine(baseLines, line, index);
    if (later >= 0) {
      index = later + 1;
      out.push(line);
      continue;
    }
    if (mentionsCandidate(line, candidateId) && mentionsForeignCatalogId(line, candidateId)) {
      return { ambiguous: `${label} mixes ${candidateId} with another catalog id on the same line.` };
    }
    if (mentionsCandidate(line, candidateId)) continue;
    out.push(line);
  }
  return { text: out.join(""), changed: out.join("") !== current };
}

function mentionsCandidate(text: string, candidateId: string): boolean {
  return text.includes(candidateId);
}

function mentionsForeignCatalogId(line: string, candidateId: string): boolean {
  const ids = [...line.matchAll(/\b(?:id|productSlug)\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  return ids.some((id) => id !== candidateId);
}

function splitKeep(text: string): string[] {
  return text.split(/(?<=\n)/);
}

function indexOfLine(lines: string[], line: string, start: number): number {
  for (let i = start; i < lines.length; i += 1) {
    if (lines[i] === line) return i;
  }
  return -1;
}

function findMatching(source: string, openIndex: number, open: string, close: string): number {
  let depth = 0;
  let quote: string | null = null;
  let escape = false;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i]!;
    if (quote) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      i = end < 0 ? source.length - 1 : end;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
