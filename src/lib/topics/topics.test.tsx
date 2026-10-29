import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import TopicSlugPage from "@/app/[locale]/topics/[slug]/page";
import { FeaturedTopics } from "@/components/topics/featured-topics";
import { resourceMenuLinks } from "@/components/nav/resources-menu";
import { BUSINESS_AREAS } from "@/src/lib/business-areas";
import { featuredTopics, getTopic, topicStatusLabel } from "@/src/lib/topics";

test("security is a topic page in Japanese and English, not a business area", async () => {
  assert.equal(BUSINESS_AREAS.includes("security" as (typeof BUSINESS_AREAS)[number]), false);
  assert.equal(BUSINESS_AREAS.length, 7);
  assert.equal(getTopic("ai-governance"), undefined);
  assert.equal(getTopic("cash-flow"), undefined);
  assert.equal(getTopic("customer-experience"), undefined);

  const japanese = renderToStaticMarkup(await TopicSlugPage({ params: Promise.resolve({ locale: "ja", slug: "security" }) }));
  assert.match(japanese, /中小企業のセキュリティ対策を、実行できる形に。/);
  assert.match(japanese, /専任のセキュリティ担当がいない中小企業でも/);
  for (const item of ["MFA", "アカウントと権限", "管理者権限", "退職者アクセス", "バックアップ", "ソフトウェア更新", "SaaSの棚卸し", "インシデント時の連絡先", "フィッシング対応", "基本的なインシデント対応準備"]) {
    assert.match(japanese, new RegExp(item));
  }
  assert.match(japanese, /ペネトレーションテスト/);
  assert.match(japanese, /脆弱性スキャン/);
  assert.match(japanese, /マルウェア解析/);
  assert.match(japanese, /セキュリティ認証/);
  assert.match(japanese, /安全であることの保証/);
  assert.match(japanese, /5分セキュリティチェック/);
  assert.match(japanese, new RegExp(topicStatusLabel.preparing.ja));
  assert.match(japanese, /Security Readiness Action Pack/);
  assert.match(japanese, new RegExp(topicStatusLabel["under-review"].ja));
  assert.match(japanese, /まだ購入できる商品ではありません/);
  assert.equal(japanese.includes("checkout"), false);
  assert.equal(japanese.includes("購入する"), false);

  const english = renderToStaticMarkup(await TopicSlugPage({ params: Promise.resolve({ locale: "en", slug: "security" }) }));
  assert.match(english, /Security checks a small business can actually carry out/);
  assert.match(english, /5-Minute Security Check/);
  assert.match(english, /Preparing/);
  assert.match(english, /Under review/);
  assert.match(english, /Penetration testing/);
  assert.match(english, /Neither item is for sale yet/);
  assert.equal(english.includes("checkout"), false);

  await assert.rejects(() => TopicSlugPage({ params: Promise.resolve({ locale: "ja", slug: "not-a-topic" }) }));
});

test("the Japanese homepage links to the security topic after business areas", () => {
  const page = readFileSync("app/[locale]/page.tsx", "utf8");
  const areas = page.indexOf('id="business-areas"');
  const featured = page.indexOf("<FeaturedTopics");
  const steps = page.indexOf('id="how-it-works"');
  assert.ok(areas >= 0 && featured > areas && steps > featured);
  assert.match(page, /featuredTopics\(locale\)/);

  const html = renderToStaticMarkup(<FeaturedTopics locale="ja" topics={featuredTopics("ja")} />);
  assert.match(html, /注目テーマ/);
  assert.match(html, /セキュリティ対策を、何から始めるか。/);
  assert.match(html, /href="\/ja\/topics\/security"/);
  assert.match(html, /セキュリティ対策を見る/);
  assert.equal(html.includes('href="/ja/business-areas/security"'), false);

  const english = renderToStaticMarkup(<FeaturedTopics locale="en" topics={featuredTopics("en")} />);
  assert.match(english, /href="\/en\/topics\/security"/);

  const extra = renderToStaticMarkup(
    <FeaturedTopics
      locale="ja"
      topics={[
        ...featuredTopics("ja"),
        {
          slug: "cash-flow",
          href: "/ja/topics/cash-flow",
          eyebrow: "注目テーマ",
          title: "資金繰り",
          body: "後から追加できるテーマです。",
          cta: "資金繰りを見る",
        },
      ]}
    />,
  );
  assert.match(extra, /href="\/ja\/topics\/security"/);
  assert.match(extra, /href="\/ja\/topics\/cash-flow"/);
});

test("security is discovered from Resources and not from the main header", () => {
  const japanese = resourceMenuLinks("ja");
  assert.equal(japanese.some((link) => link.href === "/ja/topics/security" && link.label === "セキュリティ対策"), true);
  const english = resourceMenuLinks("en");
  assert.equal(english.some((link) => link.href === "/en/topics/security" && link.label === "Security readiness"), true);
  assert.equal(resourceMenuLinks(null).some((link) => link.href === "/en/topics/security"), true);

  const header = readFileSync("components/header.tsx", "utf8");
  const nav = header.slice(header.indexOf("function navLinks"), header.indexOf("function BrandLink"));
  assert.equal(nav.includes("topics/security"), false);
});
