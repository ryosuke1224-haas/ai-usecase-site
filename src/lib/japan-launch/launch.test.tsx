import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PremiumAccessPanel } from "@/components/premium/ai-collections-assistant/premium-access-panel";
import { blueprintCatalog } from "@/src/lib/blueprints";
import { BusinessAreaCard } from "@/components/business-areas/business-area-card";
import { Footer } from "@/components/footer";
import { siteCopy } from "@/src/lib/i18n/copy";
import { hasJapaneseCatalogLabel, japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { japaneseBusinessArea } from "@/src/lib/i18n/business-areas";
import { businessAreaDefinitions } from "@/src/lib/business-areas";
import { collectionsPaths, localeFromPathname } from "@/src/lib/i18n/locale";
import { KNOWN_SUPPORT_EMAIL, JAPAN_PRODUCT_PRICE, legalDocuments, legalPlainText } from "@/src/lib/japan-launch/legal";
import {
  JAPAN_LAUNCH_REVIEW_REQUIRED,
  isJapanLaunchReviewVisible,
  japanLaunchDecision,
  japanLaunchReviewItems,
} from "@/src/lib/japan-launch/review";
import {
  commerceScopeForUiLocale,
  displayPriceForUi,
  formatCheckoutPrice,
  parseUiLocale,
} from "@/src/lib/payments/preview-market";

test("locale routes keep Japanese and English separate", () => {
  assert.equal(localeFromPathname("/ja/use-cases"), "ja");
  assert.equal(localeFromPathname("/en"), "en");
  assert.equal(localeFromPathname("/use-cases"), null);
  assert.equal(collectionsPaths("ja").demo, "/ja/blueprints/ai-collections-assistant");
  assert.equal(collectionsPaths(null).demo, "/blueprints/ai-collections-assistant");
  assert.match(siteCopy("ja").home.title, /日々の業務をもっと効率的に/);
  assert.equal(siteCopy("ja").nav.businessAreas, "業務から探す");
  assert.equal(siteCopy("ja").nav.signIn, "ログイン");
  assert.equal(siteCopy("ja").home.body.includes("英語版"), false);
  assert.equal(siteCopy("ja").home.contentNote, "");
  assert.match(siteCopy("en").home.title, /See where AI can save time/);
  assert.equal(siteCopy("ja").purchase.buy.includes("$49"), false);
  assert.match(siteCopy("ja").purchase.buy, /購入/);
});

test("Japanese purchase uses the JP sandbox price and English does not", () => {
  const japan = commerceScopeForUiLocale("ja", {
    ATLAS_COMMERCE_MARKET: "US",
    ATLAS_COMMERCE_LOCALE: "en",
  });
  const english = commerceScopeForUiLocale("en", {
    ATLAS_COMMERCE_MARKET: "JP",
    ATLAS_COMMERCE_LOCALE: "ja",
  });
  assert.deepEqual(japan, { market: "JP", locale: "ja", currency: "jpy", stripe_environment: "SANDBOX" });
  assert.deepEqual(english, { market: "US", locale: "en", currency: "usd", stripe_environment: "SANDBOX" });
  assert.equal(formatCheckoutPrice(4900, "jpy"), "¥4,900");
  assert.equal(displayPriceForUi("ja", "¥4,900"), "¥4,900");
  assert.equal(displayPriceForUi("ja", "$49"), null);
  assert.equal(displayPriceForUi("en", "¥4,900"), null);
  assert.equal(displayPriceForUi("en", "$49"), "$49");
  assert.equal(parseUiLocale("LIVE"), null);
  assert.equal(parseUiLocale("price_japan"), null);
  assert.equal(japan?.stripe_environment, "SANDBOX");
});

test("Japanese purchase controls show yen and do not send a browser price", () => {
  const japanese = renderToStaticMarkup(
    <PremiumAccessPanel mode="buy" priceLabel="¥4,900" uiLocale="ja" />,
  );
  assert.match(japanese, /4,900円/);
  assert.match(japanese, /買い切り/);
  assert.match(japanese, /決済確認後、すぐに利用できます/);
  assert.match(japanese, /利用開始後のお客様都合による返金は原則としてお受けしていません/);
  assert.equal(japanese.includes("$49"), false);
  assert.match(japanese, /name="uiLocale" value="ja"/);
  assert.equal(japanese.includes("priceId"), false);
  assert.equal(japanese.split("4,900円").length - 1, 1);
  assert.match(japanese, /\/ja\/legal\/terms/);
  assert.match(japanese, /\/ja\/legal\/refund/);
  assert.match(japanese, /\/ja\/legal\/tokusho/);
  assert.match(japanese, /購入する/);

  const english = renderToStaticMarkup(
    <PremiumAccessPanel mode="buy" priceLabel="$49" uiLocale="en" />,
  );
  assert.match(english, /\$49/);
  assert.equal(english.includes("¥4,900"), false);
  assert.equal(english.includes("4,900円"), false);
  assert.equal(english.includes("/ja/legal/terms"), false);
  assert.match(english, /name="uiLocale" value="en"/);

  const current = renderToStaticMarkup(<PremiumAccessPanel mode="buy" priceLabel="¥4,900" />);
  assert.equal(current.includes("uiLocale"), false);
  assert.match(current, /Buy Premium/);
});

test("legal drafts state known terms and do not invent operator facts", () => {
  const text = legalPlainText();
  const headings = (slug: keyof typeof legalDocuments) => legalDocuments[slug].sections.map((section) => section.heading);
  for (const heading of [
    "販売事業者・所在地・電話番号",
    "お問い合わせ先",
    "販売価格",
    "商品代金以外に必要な料金",
    "支払方法",
    "支払時期",
    "商品提供時期",
    "返品・キャンセル・返金",
    "動作環境 / デジタル商品の提供条件",
  ]) {
    assert.equal(headings("tokusho").includes(heading), true, heading);
  }
  const tokushoPrice = legalDocuments.tokusho.sections.find((section) => section.heading === "販売価格")?.body.join("\n") ?? "";
  assert.match(tokushoPrice, /お支払いいただく総額は4,900円です。当サイトから別途手数料を加算することはありません。/);
  assert.equal(tokushoPrice.includes("別途の販売手数料はかかりません"), false);
  assert.equal(tokushoPrice.split("総額").length - 1, 1);
  assert.match(text, /法令上必要な手続を経たうえで適用します/);
  assert.equal(text.includes("同意したものとして扱います"), false);
  assert.match(text, /ご請求があった場合、遅滞なく開示/);
  assert.equal(text.split("遅滞なく開示").length - 1, 1);
  assert.match(text, new RegExp(JAPAN_PRODUCT_PRICE));
  assert.match(text, /デジタル商品のため送料はかかりません/);
  assert.match(text, /Stripeが提供する決済画面/);
  assert.match(text, /直ちに購入したアカウントへ利用権を付与/);
  for (const heading of ["支払い完了前", "利用権の付与後", "返金を確認する場合", "返金の依頼", "返金の方法", "返信の目安"]) {
    assert.equal(headings("refund").includes(heading), true, heading);
  }
  assert.match(legalDocuments.refund.sections.map((section) => section.body.join("\n")).join("\n"), /重複して請求/);
  assert.match(text, /システムの不具合により、購入した商品を提供できない/);
  assert.match(text, /合理的な期間内に解消できない重大な不具合/);
  assert.match(text, /適用される法令/);
  assert.match(text, /原則としてお支払いいただいた方法へ返します/);
  assert.match(text, /原則3営業日以内/);
  for (const heading of [
    "サービス",
    "アカウント",
    "有料コンテンツ",
    "AIが生成する内容",
    "支払いと返金",
    "禁止事項",
    "知的財産",
    "サービスの変更と一時停止",
    "アカウントの停止",
    "責任の範囲",
    "プライバシー",
    "規約の変更",
    "準拠法",
    "お問い合わせ",
  ]) {
    assert.equal(headings("terms").includes(heading), true, heading);
  }
  assert.match(text, /不正確な場合/);
  assert.match(text, /業務で使う前にご自身で確認/);
  assert.match(text, /本規約は日本法に準拠します/);
  assert.match(text, /消費者契約法その他の法令により責任を制限できない場合は、その法令が優先します/);
  assert.equal(text.includes("一切責任を負いません"), false);
  assert.match(text, /ログイン用のメールを送るため/);
  assert.match(text, /Stripe/);
  assert.match(text, /Supabase/);
  assert.equal(text.includes("位置情報を取得"), false);
  assert.match(text, new RegExp(KNOWN_SUPPORT_EMAIL.replace(".", "\\.")));
  assert.equal(text.includes("いかなる場合も返金しない"), false);
  assert.equal(text.includes("返金は一切"), false);
  assert.equal(text.includes("[事業者氏名：要確認]"), false);
  assert.equal(text.includes("[所在地：要確認]"), false);
  assert.equal(text.includes("[電話番号：要確認]"), false);
  assert.equal(text.includes("税込"), false);
  assert.equal(text.includes("税抜"), false);
  assert.equal(/\d{2,4}-\d{2,4}-\d{4}/.test(text), false);
  assert.equal(text.includes("$49"), false);
});

test("Japan launch stays blocked and the review pages exist", () => {
  const decision = japanLaunchDecision();
  assert.equal(decision.ok, false);
  assert.equal(decision.code, JAPAN_LAUNCH_REVIEW_REQUIRED);
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "production-launch")?.status, "BLOCKED");
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "production-stripe")?.status, "NOT STARTED");
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "jp-price")?.status, "REVIEW REQUIRED");
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "japan-sandbox")?.status, "PASS");
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "tokusho")?.status, "REVIEW REQUIRED");
  assert.equal(japanLaunchReviewItems.find((item) => item.id === "purchase-disclosure")?.status, "REVIEW REQUIRED");
  assert.equal(japanLaunchReviewItems.some((item) => item.status === "APPROVED"), false);
  assert.match(readFileSync("src/lib/japan-launch/review.ts", "utf8"), /HUMAN LEGAL REVIEW/);
  assert.equal(isJapanLaunchReviewVisible({ VERCEL_ENV: "production" } as NodeJS.ProcessEnv), false);
  assert.equal(isJapanLaunchReviewVisible({ VERCEL_ENV: "preview" } as NodeJS.ProcessEnv), true);

  for (const path of [
    "app/[locale]/page.tsx",
    "app/[locale]/use-cases/page.tsx",
    "app/[locale]/blueprints/ai-collections-assistant/page.tsx",
    "app/[locale]/legal/[doc]/page.tsx",
    "app/[locale]/contact/page.tsx",
    "app/internal/japan-launch-review/page.tsx",
    "app/page.tsx",
    "app/use-cases/page.tsx",
  ]) {
    assert.equal(existsSync(path), true, path);
  }
  const review = readFileSync("app/internal/japan-launch-review/page.tsx", "utf8");
  assert.equal(review.includes("vercel deploy"), false);
  assert.equal(review.includes("deploy Production"), false);
  assert.match(review, /JAPAN_LAUNCH_REVIEW_REQUIRED|japanLaunchDecision/);
  assert.equal(decision.blocking.some((item) => item.id === "production-launch"), true);
});

test("the Japanese home chrome stays in Japanese and on /ja", () => {
  const sales = businessAreaDefinitions[0];
  if (!sales) throw new Error("missing sales area");
  const card = renderToStaticMarkup(<BusinessAreaCard area={sales} workflowCount={13} locale="ja" />);
  assert.match(card, /営業/);
  assert.match(card, /13件のAI活用例/);
  assert.match(card, /href="\/ja\/business-areas\/sales"/);
  assert.equal(card.includes("Sales"), false);
  assert.equal(card.includes("blueprint"), false);
  const englishCard = renderToStaticMarkup(<BusinessAreaCard area={sales} workflowCount={13} />);
  assert.match(englishCard, /Sales/);
  assert.match(englishCard, /href="\/business-areas\/sales"/);

  const footer = renderToStaticMarkup(<Footer locale="ja" />);
  assert.match(footer, /業務から探す/);
  assert.match(footer, /AI活用テンプレート/);
  assert.match(footer, /サポート・法務/);
  assert.match(footer, /中小企業の業務で使えるAI活用例/);
  assert.match(footer, /特定商取引法に基づく表記/);
  assert.equal(footer.includes("Practical AI workflows"), false);
  assert.equal(footer.includes("Explore"), false);
  assert.equal(footer.includes("Beginner blueprints"), false);
  assert.match(footer, /href="\/ja\/use-cases"/);
  assert.match(footer, /href="\/ja\/business-areas\/sales"/);
  assert.equal(footer.includes("Business Areas"), false);
  assert.equal(footer.includes("Find workflows by tools"), false);
  assert.equal(japaneseBusinessArea("marketing")?.title, "マーケティング");

  const englishFooter = renderToStaticMarkup(<Footer locale={null} />);
  assert.match(englishFooter, /Business Areas/);
  assert.match(englishFooter, /href="\/business-areas"/);
});

test("published Japanese catalog labels cover the library names shown on /ja", () => {
  const useCaseDir = "content/published/use-cases";
  for (const file of readdirSync(useCaseDir)) {
    if (!file.endsWith(".json")) continue;
    const record = JSON.parse(readFileSync(`${useCaseDir}/${file}`, "utf8")) as { slug: string };
    assert.ok(japaneseUseCase(record.slug), record.slug);
  }
  const dataDir = "content/published/data-sources";
  for (const file of readdirSync(dataDir)) {
    if (!file.endsWith(".json")) continue;
    const record = JSON.parse(readFileSync(`${dataDir}/${file}`, "utf8")) as { name: string };
    assert.equal(hasJapaneseCatalogLabel(record.name), true, record.name);
  }
});

test("Daily Inbox stays free and the current entitlement gate remains", () => {
  const starter = blueprintCatalog.find((item) => item.id === "daily-inbox-briefing-starter-kit");
  const premium = blueprintCatalog.find((item) => item.id === "ai-collections-assistant");
  assert.equal(starter?.access, "free-authenticated");
  assert.equal(premium?.access, "premium");
  const access = readFileSync("src/lib/payments/access.ts", "utf8");
  assert.match(access, /free-authenticated/);
  assert.match(access, /hasActiveEntitlement/);
});
