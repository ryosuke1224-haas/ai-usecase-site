import type { AdminAccess } from "./access";

const OWNER_HEADING = "## 自分の視点";
const CLOSED = new Set(["PUBLISHED", "ARCHIVED", "SENT"]);

export function normalizeEditorialNote(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => (line.trimStart().startsWith("## ") ? line.trimStart().slice(3) : line))
    .join("\n")
    .trim()
    .slice(0, 2000);
}

export function editorialNoteReady(note: string): boolean {
  return normalizeEditorialNote(note).length >= 8;
}

export function noteApplied(note: string, appliedNote: string | null): boolean {
  const current = normalizeEditorialNote(note);
  const applied = normalizeEditorialNote(appliedNote ?? "");
  return current.length > 0 && current === applied;
}

function stripOwnerSection(body: string): string {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line.trim() === OWNER_HEADING);
  if (start < 0) return lines.join("\n").trimEnd();
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      end = index;
      break;
    }
  }
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

/** Keep the sourced draft and place only the owner's words in a separate section. */
export function reviseArticleBody(body: string, note: string): string {
  const opinion = normalizeEditorialNote(note);
  const facts = stripOwnerSection(body);
  return `${facts}\n\n${OWNER_HEADING}\n\n${opinion}\n`;
}

export function saveEditorialNote(note: string): { ok: true; note: string } | { ok: false; reason: "empty" } {
  const clean = normalizeEditorialNote(note);
  if (clean.length < 8) return { ok: false, reason: "empty" };
  return { ok: true, note: clean };
}

export function applyEditorialRevision(input: {
  status: string;
  body: string;
  note: string;
}): { ok: true; proposedBody: string } | { ok: false; reason: "closed" | "note" } {
  if (CLOSED.has(input.status)) return { ok: false, reason: "closed" };
  if (!editorialNoteReady(input.note)) return { ok: false, reason: "note" };
  return { ok: true, proposedBody: reviseArticleBody(input.body, input.note) };
}

export function acceptRevision(input: {
  status: string;
  proposedBody: string | null;
}): { ok: true; status: string; body: string } | { ok: false; reason: "closed" | "missing" } {
  if (CLOSED.has(input.status)) return { ok: false, reason: "closed" };
  const body = input.proposedBody?.trim() ?? "";
  if (!body) return { ok: false, reason: "missing" };
  const status = input.status === "APPROVED" || input.status === "REJECTED" ? "READY_FOR_REVIEW" : input.status;
  return { ok: true, status, body };
}

export function publishDecision(input: {
  status: string;
  confirmed: boolean;
  pendingRevision: boolean;
  publishedAt: string | null;
  now: Date;
}): { ok: true; publishedAt: string } | { ok: false; reason: "status" | "confirm" | "pending" } {
  if (input.status !== "APPROVED") return { ok: false, reason: "status" };
  if (!input.confirmed) return { ok: false, reason: "confirm" };
  if (input.pendingRevision) return { ok: false, reason: "pending" };
  const existing = input.publishedAt && !Number.isNaN(Date.parse(input.publishedAt)) ? input.publishedAt : null;
  return { ok: true, publishedAt: existing ?? input.now.toISOString() };
}

export function editorialActorAllowed(access: AdminAccess): boolean {
  return access === "allow";
}

export type EditorialWrite =
  | { kind: "save"; columns: ["editorial_note"] }
  | { kind: "apply"; columns: ["proposed_body"] }
  | { kind: "accept"; columns: ["body", "editorial_applied_note", "proposed_body", "status"] }
  | { kind: "keep"; columns: ["proposed_body"] }
  | { kind: "publish"; columns: ["status", "published_at"] };

export function editorialWrite(kind: EditorialWrite["kind"]): EditorialWrite {
  if (kind === "save") return { kind, columns: ["editorial_note"] };
  if (kind === "apply") return { kind, columns: ["proposed_body"] };
  if (kind === "accept") return { kind, columns: ["body", "editorial_applied_note", "proposed_body", "status"] };
  if (kind === "keep") return { kind, columns: ["proposed_body"] };
  return { kind: "publish", columns: ["status", "published_at"] };
}

export function publishActionLog(input: {
  actorEmail: string;
  targetId: string;
  targetTitle: string;
}): {
  action: "publish";
  targetType: "blog";
  targetId: string;
  targetTitle: string;
  fromStatus: "APPROVED";
  toStatus: "PUBLISHED";
  actorEmail: string;
} {
  return {
    actorEmail: input.actorEmail,
    action: "publish",
    targetType: "blog",
    targetId: input.targetId,
    targetTitle: input.targetTitle,
    fromStatus: "APPROVED",
    toStatus: "PUBLISHED",
  };
}
