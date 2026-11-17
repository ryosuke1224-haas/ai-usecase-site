import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isPublicArticle, publishedSitemapPaths } from "@/src/lib/blog/model";
import {
  acceptRevision,
  applyEditorialRevision,
  editorialActorAllowed,
  editorialWrite,
  noteApplied,
  publishActionLog,
  publishDecision,
  reviseArticleBody,
  saveEditorialNote,
} from "./editorial";

const BODY = [
  "## 何が報じられたか",
  "",
  "OpenAIが新しい確認手順を公開しています。",
  "",
  "出典: [OpenAI](https://openai.com/news/example)",
  "",
  "## 仕事での見方",
  "",
  "既存の確認手順を変える必要があるかを見ます。",
].join("\n");

const NOTE = "これは大企業より中小企業のほうが使いやすいと思う。完全自動化より、まずレビュー前提で使う方が現実的。";

test("an editorial note can be saved without publishing", () => {
  const saved = saveEditorialNote(`  ${NOTE}  `);
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.note, NOTE);
  const write = editorialWrite("save");
  assert.deepEqual(write.columns, ["editorial_note"]);
  assert.equal(write.columns.includes("status" as never), false);
  assert.equal(write.columns.includes("published_at" as never), false);
  assert.equal(saveEditorialNote("短い").ok, false);
});

test("applying an editorial note revises the draft and preserves sourced facts", () => {
  const revision = applyEditorialRevision({ status: "READY_FOR_REVIEW", body: BODY, note: NOTE });
  assert.equal(revision.ok, true);
  if (!revision.ok) return;
  assert.match(revision.proposedBody, /https:\/\/openai\.com\/news\/example/);
  assert.match(revision.proposedBody, /OpenAIが新しい確認手順を公開しています。/);
  assert.match(revision.proposedBody, /## 自分の視点/);
  assert.match(revision.proposedBody, /中小企業のほうが使いやすい/);
  assert.doesNotMatch(revision.proposedBody, /私は試した|50%|円/);
  assert.deepEqual(editorialWrite("apply").columns, ["proposed_body"]);
  const replaced = reviseArticleBody(revision.proposedBody, "レビュー前提が現実的です。");
  assert.equal(replaced.match(/## 自分の視点/g)?.length, 1);
  assert.match(replaced, /https:\/\/openai\.com\/news\/example/);
  assert.doesNotMatch(replaced, /中小企業のほうが使いやすい/);
  assert.equal(applyEditorialRevision({ status: "PUBLISHED", body: BODY, note: NOTE }).ok, false);
  assert.equal(noteApplied(NOTE, NOTE), true);
  assert.equal(noteApplied("別の見方です。", NOTE), false);
});

test("accepting a revision does not approve or publish", () => {
  const proposed = reviseArticleBody(BODY, NOTE);
  const accepted = acceptRevision({ status: "APPROVED", proposedBody: proposed });
  assert.equal(accepted.ok, true);
  if (!accepted.ok) return;
  assert.equal(accepted.status, "READY_FOR_REVIEW");
  assert.match(accepted.body, /自分の視点/);
  const review = acceptRevision({ status: "READY_FOR_REVIEW", proposedBody: proposed });
  assert.equal(review.ok, true);
  if (review.ok) assert.equal(review.status, "READY_FOR_REVIEW");
  assert.equal(acceptRevision({ status: "PUBLISHED", proposedBody: proposed }).ok, false);
  assert.deepEqual(editorialWrite("keep").columns, ["proposed_body"]);
});

test("only an allowlisted admin can use editorial actions", () => {
  assert.equal(editorialActorAllowed("allow"), true);
  assert.equal(editorialActorAllowed("anonymous"), false);
  assert.equal(editorialActorAllowed("forbidden"), false);
  const action = readFileSync("src/lib/admin/editorial-actions.ts", "utf8");
  assert.match(action, /editorialActorAllowed\(access\)/);
  assert.match(action, /adminAccessDecision/);
  assert.doesNotMatch(action, /child_process|spawn\(|checkout\.sessions\.create|status:\s*"SENT"/);
});

test("only an approved article can be published, and published_at is preserved", () => {
  const now = new Date("2026-11-16T12:00:00.000Z");
  for (const status of ["DRAFT", "READY_FOR_REVIEW", "NEEDS_CHANGES", "REJECTED", "PUBLISHED"]) {
    assert.equal(publishDecision({ status, confirmed: true, pendingRevision: false, publishedAt: null, now }).ok, false);
  }
  const created = publishDecision({ status: "APPROVED", confirmed: true, pendingRevision: false, publishedAt: null, now });
  assert.deepEqual(created, { ok: true, publishedAt: now.toISOString() });
  const kept = publishDecision({
    status: "APPROVED",
    confirmed: true,
    pendingRevision: false,
    publishedAt: "2026-11-01T00:00:00.000Z",
    now,
  });
  assert.deepEqual(kept, { ok: true, publishedAt: "2026-11-01T00:00:00.000Z" });
  assert.equal(publishDecision({ status: "APPROVED", confirmed: false, pendingRevision: false, publishedAt: null, now }).ok, false);
  assert.equal(publishDecision({ status: "APPROVED", confirmed: true, pendingRevision: true, publishedAt: null, now }).ok, false);
  assert.deepEqual(editorialWrite("publish").columns, ["status", "published_at"]);
  const log = publishActionLog({ actorEmail: "owner@example.com", targetId: "11111111-1111-4111-8111-111111111111", targetTitle: "週次メモ" });
  assert.equal(log.action, "publish");
  assert.equal(log.fromStatus, "APPROVED");
  assert.equal(log.toStatus, "PUBLISHED");
  assert.equal(log.targetType, "blog");
});

test("published articles are public and included in the sitemap", () => {
  const publishedAt = "2026-11-16T00:00:00.000Z";
  assert.equal(isPublicArticle({ status: "PUBLISHED", publishedAt }), true);
  assert.equal(isPublicArticle({ status: "APPROVED", publishedAt }), false);
  assert.equal(isPublicArticle({ status: "PUBLISHED", publishedAt: null }), false);
  assert.deepEqual(
    publishedSitemapPaths([
      { slug: "weekly-note", status: "PUBLISHED", publishedAt },
      { slug: "still-review", status: "READY_FOR_REVIEW", publishedAt },
      { slug: "missing-date", status: "PUBLISHED", publishedAt: null },
    ]),
    ["/ja/blog/weekly-note"],
  );
});
