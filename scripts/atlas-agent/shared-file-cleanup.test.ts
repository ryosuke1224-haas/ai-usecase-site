import assert from "node:assert/strict";
import { test } from "node:test";
import {
  captureSharedFileBaseline,
  revertAbandonedSharedFiles,
  revertBlueprintCatalogDelta,
  sharedWritableFiles,
  type SharedCleanupIo,
  type SharedFileBaseline,
} from "./shared-file-cleanup";

const CANDIDATE = "no-show-recovery-assistant";
const SCOPE = [
  `app/blueprints/${CANDIDATE}/`,
  `components/premium/${CANDIDATE}/`,
  `src/lib/premium/${CANDIDATE}/`,
  "src/lib/blueprints.ts",
  `e2e/${CANDIDATE}/`,
];

const SECURITY = catalogRow(
  "security-readiness-action-pack",
  "Security Readiness Action Pack",
  "A quarterly readiness queue you review yourself.",
);
const ADS = catalogRow(
  "google-ads-performance-coach",
  "Google Ads Performance Coach",
  "A measurement-first review you run yourself.",
);
const QUOTE = catalogRow(
  "quote-request-assistant",
  "Quote Request Assistant",
  "Paste a quote request and review a draft.",
);
const NO_SHOW = catalogRow(
  CANDIDATE,
  "No-show Recovery Assistant",
  "Labelled no-show drafts. The kit never texts.",
);
const DIRTY_COMMENT = "  // owner note: keep this human edit\n";

function catalogRow(id: string, title: string, summary: string): string {
  return `  {
    id: "${id}",
    title: "${title}",
    badge: "PREMIUM",
    href: "/blueprints/${id}/kit",
    purchaseHref: "/blueprints/${id}",
    productSlug: "${id}",
    access: "premium",
    summary:
      "${summary}",
  }`;
}

function catalogFile(rows: string[], extraPrefix = ""): string {
  return [
    "export type BlueprintAccess = \"free-authenticated\" | \"premium\";",
    extraPrefix,
    "export const blueprintCatalog: BlueprintDefinition[] = [",
    rows.join(",\n") + ",",
    "];",
    "",
    "export function getBlueprintById(id: string) {",
    "  return blueprintCatalog.find((item) => item.id === id);",
    "}",
    "",
  ].join("\n");
}

function memoryIo(files: Record<string, string> = {}): {
  files: Record<string, string>;
  baselines: Map<string, SharedFileBaseline>;
  io: SharedCleanupIo;
} {
  const store = { ...files };
  const baselines = new Map<string, SharedFileBaseline>();
  return {
    files: store,
    baselines,
    io: {
      readFile: (file) => (file in store ? store[file]! : null),
      writeFile: (file, text) => {
        store[file] = text;
      },
      readBaseline: (id) => baselines.get(id) ?? null,
      writeBaseline: (snapshot) => {
        baselines.set(snapshot.candidate_id, structuredClone(snapshot));
      },
      clearBaseline: (id) => {
        baselines.delete(id);
      },
    },
  };
}

test("shared writable files include blueprints.ts and other explicit shared files", () => {
  assert.deepEqual(
    sharedWritableFiles([...SCOPE, "src/lib/custom-shared.ts"]),
    ["src/lib/blueprints.ts", "src/lib/custom-shared.ts"],
  );
});

test("timed-out candidate adds a row to src/lib/blueprints.ts", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const current = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW]);
  const parsed = revertBlueprintCatalogDelta(baseline, current, CANDIDATE);
  assert.equal("ambiguous" in parsed, false);
  if ("ambiguous" in parsed) return;
  assert.equal(parsed.changed, true);
  assert.deepEqual(parsed.removedIds, [CANDIDATE]);
  assert.match(current, new RegExp(`id: "${CANDIDATE}"`));
});

test("retry keeps the candidate catalog row", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const harness = memoryIo({ "src/lib/blueprints.ts": baseline });
  const first = captureSharedFileBaseline({
    candidateId: CANDIDATE,
    scope: SCOPE,
    now: "t0",
    io: harness.io,
  });
  harness.files["src/lib/blueprints.ts"] = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW]);
  const retry = captureSharedFileBaseline({
    candidateId: CANDIDATE,
    scope: SCOPE,
    now: "t1",
    io: harness.io,
  });
  assert.equal(retry.files["src/lib/blueprints.ts"], first.files["src/lib/blueprints.ts"]);
  assert.match(harness.files["src/lib/blueprints.ts"]!, new RegExp(`id: "${CANDIDATE}"`));
});

test("abandoned candidate removes only its own catalog row", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const harness = memoryIo({ "src/lib/blueprints.ts": baseline });
  captureSharedFileBaseline({ candidateId: CANDIDATE, scope: SCOPE, now: "t0", io: harness.io });
  harness.files["src/lib/blueprints.ts"] = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW]);
  const result = revertAbandonedSharedFiles({ candidateId: CANDIDATE, scope: SCOPE, io: harness.io });
  assert.equal(result.unsafe, false);
  assert.equal(result.restored.includes("src/lib/blueprints.ts"), true);
  const next = harness.files["src/lib/blueprints.ts"]!;
  assert.equal(next.includes(`id: "${CANDIDATE}"`), false);
  assert.equal(next.includes('id: "security-readiness-action-pack"'), true);
  assert.equal(next.includes('id: "google-ads-performance-coach"'), true);
  assert.equal(next.includes('id: "quote-request-assistant"'), true);
});

test("existing Security / Google Ads / Quote Request entries remain untouched", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const current = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW]);
  const result = revertBlueprintCatalogDelta(baseline, current, CANDIDATE);
  assert.equal("ambiguous" in result, false);
  if ("ambiguous" in result) return;
  assert.equal(result.text.includes('id: "security-readiness-action-pack"'), true);
  assert.equal(result.text.includes('id: "google-ads-performance-coach"'), true);
  assert.equal(result.text.includes('id: "quote-request-assistant"'), true);
});

test("unrelated dirty edits in src/lib/blueprints.ts remain untouched", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const dirty = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW], DIRTY_COMMENT);
  const result = revertBlueprintCatalogDelta(baseline, dirty, CANDIDATE);
  assert.equal("ambiguous" in result, false);
  if ("ambiguous" in result) return;
  assert.equal(result.text.includes("owner note: keep this human edit"), true);
  assert.equal(result.text.includes(`id: "${CANDIDATE}"`), false);
});

test("ambiguous shared-file divergence stops safely", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const contaminated = catalogFile([
    SECURITY.replace("quarterly readiness queue", `quarterly readiness plus ${CANDIDATE}`),
    ADS,
    QUOTE,
    NO_SHOW,
  ]);
  const result = revertBlueprintCatalogDelta(baseline, contaminated, CANDIDATE);
  assert.equal("ambiguous" in result, true);
  if (!("ambiguous" in result)) return;
  assert.match(result.ambiguous, /ambiguous/);
});

test("next candidate starts with no abandoned candidate contamination", () => {
  const baseline = catalogFile([SECURITY, ADS, QUOTE]);
  const harness = memoryIo({ "src/lib/blueprints.ts": baseline });
  captureSharedFileBaseline({ candidateId: CANDIDATE, scope: SCOPE, now: "t0", io: harness.io });
  harness.files["src/lib/blueprints.ts"] = catalogFile([SECURITY, ADS, QUOTE, NO_SHOW]);
  const abandoned = revertAbandonedSharedFiles({ candidateId: CANDIDATE, scope: SCOPE, io: harness.io });
  assert.equal(abandoned.unsafe, false);
  const nextId = "next-pay-labor-check";
  const nextScope = [...SCOPE.filter((item) => !item.includes(CANDIDATE)), `app/blueprints/${nextId}/`];
  const nextBaseline = captureSharedFileBaseline({
    candidateId: nextId,
    scope: nextScope,
    now: "t2",
    io: harness.io,
  });
  assert.equal(nextBaseline.files["src/lib/blueprints.ts"]?.includes(`id: "${CANDIDATE}"`), false);
  assert.equal(harness.files["src/lib/blueprints.ts"]!.includes(`id: "${CANDIDATE}"`), false);
  assert.equal(harness.baselines.has(CANDIDATE), false);
});

test("a pre-existing catalog row is restored to baseline instead of being deleted", () => {
  const original = catalogRow(CANDIDATE, "No-show Recovery Assistant", "Original summary.");
  const mutated = catalogRow(CANDIDATE, "No-show Recovery Assistant", "Incomplete timed-out summary.");
  const baseline = catalogFile([SECURITY, original]);
  const current = catalogFile([SECURITY, mutated]);
  const result = revertBlueprintCatalogDelta(baseline, current, CANDIDATE);
  assert.equal("ambiguous" in result, false);
  if ("ambiguous" in result) return;
  assert.equal(result.text.includes("Original summary."), true);
  assert.equal(result.text.includes("Incomplete timed-out summary."), false);
  assert.equal(result.text.includes(`id: "${CANDIDATE}"`), true);
  assert.deepEqual(result.removedIds, []);
});

test("missing shared-file baseline is treated as unsafe", () => {
  const harness = memoryIo({ "src/lib/blueprints.ts": catalogFile([SECURITY, NO_SHOW]) });
  const result = revertAbandonedSharedFiles({ candidateId: CANDIDATE, scope: SCOPE, io: harness.io });
  assert.equal(result.unsafe, true);
  assert.match(result.reason ?? "", /baseline is missing/);
  assert.match(harness.files["src/lib/blueprints.ts"]!, new RegExp(`id: "${CANDIDATE}"`));
});
