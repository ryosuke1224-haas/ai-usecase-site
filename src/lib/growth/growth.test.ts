import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { analyticsBeforeSend } from "@/src/lib/analytics/filter";
import {
  articleBlocks,
  isPublicArticle,
  parsePublicArticle,
  publishedSitemapPaths,
  relatedBlueprintLinks,
  selectFeatured,
  summarizeArticles,
} from "@/src/lib/blog/model";
import {
  allowSignupAttempt,
  normalizeNewsletterEmail,
  recentActiveSubscribers,
  subscriberAction,
} from "@/src/lib/newsletter/model";

const published = {
  id: "article-1",
  slug: "sf-agent-notes",
  title: "現場で使えるエージェント",
  summary: "短い実務メモです。",
  body: "本文です。\n\n## 参照\n\n- [公式](https://example.com/source)\n\n<script>alert(1)</script>",
  category: "practical-ai",
  source_urls: ["https://example.com/source", "javascript:alert(1)"],
  related_blueprints: ["quote-request-assistant", "not-a-product", "security-readiness-action-pack"],
  status: "PUBLISHED",
  published_at: "2026-11-13T00:00:00.000Z",
  featured: false,
  display_author: "Atlas",
  seo_title: null,
  seo_description: null,
  updated_at: "2026-11-13T00:00:00.000Z",
};

test("only published articles with a date are public", () => {
  assert.equal(isPublicArticle({ status: "PUBLISHED", publishedAt: "2026-11-13T00:00:00.000Z" }), true);
  assert.equal(isPublicArticle({ status: "DRAFT", publishedAt: "2026-11-13T00:00:00.000Z" }), false);
  assert.equal(isPublicArticle({ status: "READY_FOR_REVIEW", publishedAt: "2026-11-13T00:00:00.000Z" }), false);
  assert.equal(isPublicArticle({ status: "ARCHIVED", publishedAt: "2026-11-13T00:00:00.000Z" }), false);
  assert.equal(isPublicArticle({ status: "PUBLISHED", publishedAt: null }), false);
  assert.equal(parsePublicArticle({ ...published, status: "DRAFT" }), null);
  assert.equal(parsePublicArticle({ ...published, status: "READY_FOR_REVIEW" }), null);
  assert.equal(parsePublicArticle({ ...published, status: "APPROVED" }), null);
  assert.equal(parsePublicArticle({ ...published, status: "NEEDS_CHANGES" }), null);
  assert.equal(parsePublicArticle({ ...published, status: "REJECTED" }), null);

  const article = parsePublicArticle(published);
  assert.ok(article);
  assert.deepEqual(article.sourceUrls, ["https://example.com/source"]);
  const links = relatedBlueprintLinks(article.relatedBlueprints);
  assert.ok(links.some((item) => item.slug === "quote-request-assistant" && item.href === "/ja/blueprints/quote-request-assistant"));
  assert.equal(links.some((item) => item.slug === "not-a-product"), false);
  assert.ok(links.every((item) => item.href.startsWith("/ja/blueprints/") && item.titleJa !== item.slug));
  const blocks = articleBlocks(article.body);
  assert.equal(blocks.some((block) => block.type === "paragraph" && block.inlines.some((item) => item.type === "text" && item.text.includes("<script>"))), true);
  assert.equal(selectFeatured([article])?.slug, article.slug);
});

test("sitemap paths include published slugs only", () => {
  assert.deepEqual(
    publishedSitemapPaths([
      { slug: "sf-agent-notes", status: "PUBLISHED", publishedAt: "2026-11-13T00:00:00.000Z" },
      { slug: "draft-note", status: "DRAFT", publishedAt: "2026-11-13T00:00:00.000Z" },
      { slug: "review-note", status: "READY_FOR_REVIEW", publishedAt: "2026-11-13T00:00:00.000Z" },
      { slug: "missing-date", status: "PUBLISHED", publishedAt: null },
      { slug: "Bad Slug", status: "PUBLISHED", publishedAt: "2026-11-13T00:00:00.000Z" },
    ]),
    ["/ja/blog/sf-agent-notes"],
  );
  assert.deepEqual(summarizeArticles([
    { status: "PUBLISHED" },
    { status: "DRAFT" },
    { status: "READY_FOR_REVIEW" },
    { status: "ARCHIVED" },
    { status: "OTHER" },
  ]), { published: 1, drafts: 1, readyForReview: 1, approved: 0, needsChanges: 0, rejected: 0, archived: 1, total: 4 });
});

test("newsletter emails are normalized and active duplicates are not inserted again", () => {
  assert.equal(normalizeNewsletterEmail("  Owner@Example.com "), "owner@example.com");
  assert.equal(normalizeNewsletterEmail("not-an-email"), null);
  assert.equal(normalizeNewsletterEmail(`${"a".repeat(250)}@b.co`), null);
  assert.equal(subscriberAction(null), "insert");
  assert.equal(subscriberAction("ACTIVE"), "already");
  assert.equal(subscriberAction("UNSUBSCRIBED"), "resubscribe");
  const now = new Date("2026-11-13T16:00:00.000Z");
  assert.equal(recentActiveSubscribers([
    { status: "ACTIVE", subscribedAt: "2026-11-12T00:00:00.000Z" },
    { status: "ACTIVE", subscribedAt: "2026-11-01T00:00:00.000Z" },
    { status: "UNSUBSCRIBED", subscribedAt: "2026-11-13T00:00:00.000Z" },
  ], now), 1);
  const start = Date.parse("2026-11-13T16:00:00.000Z");
  assert.equal(allowSignupAttempt([start, start, start, start], start + 1000), true);
  assert.equal(allowSignupAttempt([start, start, start, start, start], start + 1000), false);
});

test("analytics skips admin routes and the public pages wire the foundation", () => {
  const page = { type: "pageview" as const, url: "https://aiusecaseatlas.com/ja/blog" };
  assert.equal(analyticsBeforeSend(page), page);
  assert.equal(analyticsBeforeSend({ type: "pageview", url: "https://aiusecaseatlas.com/admin/project" }), null);
  assert.equal(analyticsBeforeSend({ type: "pageview", url: "https://aiusecaseatlas.com/business-areas" })?.url, "https://aiusecaseatlas.com/business-areas");
  assert.equal(analyticsBeforeSend({ type: "pageview", url: "http://[bad" }), null);

  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.equal(layout.match(/<AtlasAnalytics \/>/g)?.length, 1);
  const analytics = readFileSync("components/analytics/atlas-analytics.tsx", "utf8");
  assert.match(analytics, /beforeSend=\{analyticsBeforeSend\}/);
  assert.doesNotMatch(analytics, /gtag|G-|UA-/);

  const sitemap = readFileSync("app/sitemap.ts", "utf8");
  assert.match(sitemap, /publishedSitemapPaths/);
  assert.match(sitemap, /loadSitemapArticles/);
  assert.doesNotMatch(sitemap, /\/admin/);
  const articlePage = readFileSync("app/ja/blog/[slug]/page.tsx", "utf8");
  assert.match(articlePage, /notFound\(\)/);
  assert.match(articlePage, /canonical/);
  assert.match(articlePage, /openGraph/);
  const home = readFileSync("app/[locale]/page.tsx", "utf8");
  assert.match(home, /source="ja-home"/);
  const blog = readFileSync("app/ja/blog/page.tsx", "utf8");
  assert.match(blog, /AIニュースや米国テックの動きを、実務目線で短くまとめます。/);
  assert.doesNotMatch(blog, /短い日本語で公開します/);
  const newsletter = readFileSync("app/ja/newsletter/page.tsx", "utf8");
  assert.match(newsletter, /短く読みやすい日本語でお届けします/);
  assert.match(newsletter, /lead=\{false\}/);
  assert.doesNotMatch(newsletter, /送信はまだ始まりません/);
  const form = readFileSync("components/newsletter/signup-form.tsx", "utf8");
  assert.match(form, /配信目的でのみ使用します/);
  assert.doesNotMatch(form, /送信はまだ始まりません/);
  const privacy = readFileSync("src/lib/japan-launch/legal.ts", "utf8");
  assert.match(privacy, /ニュースレターを送るために保存します/);
  const store = readFileSync("src/lib/newsletter/store.ts", "utf8");
  assert.match(store, /select\("status, subscribed_at"\)/);
  assert.match(store, /import "server-only"/);
  assert.doesNotMatch(store, /NEXT_PUBLIC_/);
});
