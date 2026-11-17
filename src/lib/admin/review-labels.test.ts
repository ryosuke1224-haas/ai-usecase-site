import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { reviewDecisionHelp, reviewStatusLabel, reviewTypeLabel } from "./review-labels";

test("review queue labels are Japanese and the stored enums stay in place", () => {
  assert.equal(reviewStatusLabel("READY_FOR_REVIEW"), "確認待ち");
  assert.equal(reviewStatusLabel("APPROVED"), "承認済み");
  assert.equal(reviewStatusLabel("NEEDS_CHANGES"), "修正待ち");
  assert.equal(reviewStatusLabel("REJECTED"), "却下済み");
  assert.equal(reviewStatusLabel("PUBLISHED"), "公開済み");
  assert.equal(reviewTypeLabel("BLOG"), "ブログ");
  assert.equal(reviewTypeLabel("NEWSLETTER"), "ニュースレター");
  assert.equal(reviewDecisionHelp("blog"), "承認しても、自動で公開はされません。");
  assert.equal(reviewDecisionHelp("newsletter"), "承認しても、自動で配信はされません。");

  const form = readFileSync("components/admin/review-form.tsx", "utf8");
  assert.match(form, /value="approve"/);
  assert.match(form, /value="needs_changes"/);
  assert.match(form, /value="reject"/);
  assert.match(form, /承認/);
  assert.match(form, /修正が必要/);
  assert.match(form, /却下/);
  assert.match(form, /メモ/);
  assert.doesNotMatch(form, />\s*Approve\s*</);
  assert.doesNotMatch(form, /does not publish or send/);

  const dashboard = readFileSync("components/admin/project-dashboard.tsx", "utf8");
  assert.match(dashboard, /公開プレビューなし/);
  assert.match(dashboard, /reviewStatusLabel\(item\.status\)/);
  assert.doesNotMatch(dashboard, /No public preview/);
});
