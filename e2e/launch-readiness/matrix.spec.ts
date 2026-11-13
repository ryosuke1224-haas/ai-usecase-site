import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow } from "../support/navigation";

const PREMIUM = [
  {
    slug: "google-ads-performance-coach",
    enTitle: "Google Ads Performance Coach",
    jaTitle: "Google Ads 運用チェック",
  },
  {
    slug: "quote-request-assistant",
    enTitle: "Quote Request Assistant",
    jaTitle: "見積依頼レビュー",
  },
  {
    slug: "ai-expense-watchdog",
    enTitle: "AI Expense Watchdog",
    jaTitle: "経費の定期点検",
  },
  {
    slug: "no-show-recovery-assistant",
    enTitle: "No-show Recovery Assistant",
    jaTitle: "無断キャンセル再予約",
  },
  {
    slug: "unbilled-work-review-queue",
    enTitle: "Unbilled Work Review Queue",
    jaTitle: "未請求作業レビュー",
  },
  {
    slug: "ai-customer-response-assistant",
    enTitle: "On-brand Reply Review Queue",
    jaTitle: "問い合わせ返信レビュー",
  },
  {
    slug: "ai-pipeline-risk-detector",
    enTitle: "Stalled Deal Rescue Queue",
    jaTitle: "停滞商談の確認",
  },
  {
    slug: "inactive-customer-winback",
    enTitle: "Lapsed Customer Return Queue",
    jaTitle: "久々のお客様の再来案内",
  },
  {
    slug: "ai-staffing-optimizer",
    enTitle: "Shift Coverage vs Demand Check",
    jaTitle: "シフト過不足チェック",
  },
  {
    slug: "ai-proposal-follow-up-assistant",
    enTitle: "Quiet Proposal Chase Queue",
    jaTitle: "提案フォローの下書き",
  },
  {
    slug: "ai-payroll-forecasting",
    enTitle: "Next-Pay Labor Check",
    jaTitle: "次回人件費チェック",
  },
] as const;

test.describe("Launch public routes", () => {
  for (const product of PREMIUM) {
    test(`${product.slug} shows the one-time launch price in both locales`, async ({ page }) => {
      await page.goto(`/blueprints/${product.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: product.enTitle })).toBeVisible();
      await expect(page.getByText("$49", { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in to purchase", exact: true })).toBeVisible();
      const purchase = page.getByRole("region", { name: "Premium access" });
      await expect(purchase.getByRole("link", { name: "Terms", exact: true })).toHaveAttribute("href", "/legal/terms");
      await expect(purchase.getByRole("link", { name: "Refunds", exact: true })).toHaveAttribute("href", "/legal/refund");
      await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
      await expect(purchase).not.toContainText(/subscription|subscribe/i);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots).toContain("noindex");
      await expectNoHorizontalOverflow(page);

      await page.goto(`/ja/blueprints/${product.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: product.jaTitle })).toBeVisible();
      await expect(page.getByText("¥7,980", { exact: true })).toBeVisible();
      const japanesePurchase = page.getByRole("region", { name: "プレミアムAI活用テンプレート" });
      await expect(japanesePurchase.getByRole("link", { name: "ログインして購入", exact: true })).toHaveAttribute(
        "href",
        `/ja/auth?next=${encodeURIComponent(`/ja/blueprints/${product.slug}`)}`,
      );
      await expect(japanesePurchase.getByRole("link", { name: "利用規約", exact: true })).toHaveAttribute(
        "href",
        "/ja/legal/terms",
      );
      await expect(japanesePurchase.getByRole("link", { name: "返金・キャンセルポリシー", exact: true })).toHaveAttribute(
        "href",
        "/ja/legal/refund",
      );
      await expect(japanesePurchase.getByRole("link", { name: "特定商取引法に基づく表記", exact: true })).toHaveAttribute(
        "href",
        "/ja/legal/tokusho",
      );
      await expect(japanesePurchase).toContainText("買い切り");
      await expect(japanesePurchase).not.toContainText(/月額|サブスクリプション/);
      const japaneseRobots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(japaneseRobots).toContain("noindex");
      await expectNoHorizontalOverflow(page);
    });

    test(`${product.slug} logged-out kits keep locale and next`, async ({ page }) => {
      await page.goto(`/blueprints/${product.slug}/kit`);
      const english = new URL(page.url());
      expect(english.pathname).toBe("/auth");
      expect(english.searchParams.get("next")).toBe(`/blueprints/${product.slug}/kit`);

      await page.goto(`/ja/blueprints/${product.slug}/kit`);
      const japanese = new URL(page.url());
      expect(japanese.pathname).toBe("/ja/auth");
      expect(japanese.searchParams.get("next")).toBe(`/ja/blueprints/${product.slug}/kit`);
    });
  }
});

test.describe("Launch catalog, collections, inbox, and legal", () => {
  test("Japanese catalog lists the shipped products and hides incomplete templates", async ({ page }) => {
    await page.goto("/ja/use-cases");
    await expect(page.getByText("13件", { exact: true }).first()).toBeVisible();
    for (const product of PREMIUM) {
      await expect(page.locator(`a[href="/ja/blueprints/${product.slug}"]`).first()).toBeVisible();
    }
    await expect(page.locator('a[href="/ja/blueprints/ai-collections-assistant"]').first()).toBeVisible();
    await expect(page.locator('a[href="/blueprints/daily-inbox-briefing/starter-kit"]').first()).toBeVisible();
    await expect(page.locator("a[href*='ai-sop-builder']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "LinkedIn Profiles" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "上級" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("Collections keeps its Japanese price and Daily Inbox stays a free starter", async ({ page }) => {
    await page.goto("/ja/blueprints/ai-collections-assistant");
    await expect(page.getByRole("heading", { level: 1, name: "AI Collections Assistant" })).toBeVisible();
    await expect(page.getByText("4,900円").first()).toBeVisible();
    await expect(page.getByText("¥7,980")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await page.goto("/blueprints/daily-inbox-briefing/starter-kit");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("next")).toBe("/blueprints/daily-inbox-briefing/starter-kit");
  });

  test("legal and contact routes resolve", async ({ page }) => {
    const routes = [
      ["/ja/legal/tokusho", "特定商取引法"],
      ["/ja/legal/terms", "利用規約"],
      ["/ja/legal/privacy", "プライバシー"],
      ["/ja/legal/refund", "返金"],
      ["/legal/terms", "Terms"],
      ["/legal/privacy", "Privacy"],
      ["/legal/refund", "Refund"],
    ] as const;
    for (const [path, heading] of routes) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBe(true);
      await expect(page.getByRole("heading", { level: 1, name: new RegExp(heading) })).toBeVisible();
    }
    for (const path of ["/ja/contact", "/contact"]) {
      const response = await page.goto(path);
      expect(response?.ok(), path).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/legal/terms");
    await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/legal/privacy");
    await expect(footer.getByRole("link", { name: "Refunds" })).toHaveAttribute("href", "/legal/refund");
  });

  test("Japanese discovery hides empty categories and opens shipped products", async ({ page }) => {
    await page.goto("/ja");
    await expect(page.locator("header").getByRole("link", { name: "ツールから探す" })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "AI活用アイデア" })).toHaveCount(0);
    await expect(page.locator("footer").getByRole("link", { name: "ツールから探す" })).toHaveCount(0);
    await expect(page.locator("footer").getByRole("link", { name: "AI活用アイデア" })).toHaveCount(0);
    await expect(page.locator("#how-it-works").getByRole("link", { name: "AI活用テンプレートを見る" })).toHaveAttribute(
      "href",
      "/ja/use-cases",
    );

    await page.goto("/ja/business-areas/sales");
    const quotes = page.getByRole("link", { name: /見積と提案/ });
    await expect(quotes).toHaveAttribute("href", "/ja/use-cases?process=Quotes%20%26%20Proposals");
    await expect(page.getByRole("link", { name: /売上予測/ })).toHaveAttribute(
      "href",
      "/ja/use-cases?process=Sales%20Forecasting",
    );
    await expect(page.getByText("0件")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "見込み客の受付と見極め" })).toHaveCount(0);

    await quotes.click();
    await expect(page).toHaveURL(/process=Quotes(%20|\+)%26(%20|\+)Proposals/);
    await expect(page.getByRole("heading", { level: 3, name: "見積依頼レビュー" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "提案フォローの下書き" })).toBeVisible();
    await expect(page.locator('a[href="/ja/blueprints/quote-request-assistant"]').first()).toBeVisible();
    await expect(page.locator('a[href="/ja/blueprints/ai-pipeline-risk-detector"]')).toHaveCount(0);
  });

  test("Japanese mobile navigation stays on shipped discovery", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/ja");
    await page.getByRole("button", { name: "リソース" }).click();
    const menu = page.locator("header");
    await expect(menu.getByRole("link", { name: "ツールから探す" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "AI活用アイデア" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "業務から探す" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "AI活用テンプレート" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("an auth callback without a code keeps the Japanese next path", async ({ page }) => {
    await page.goto("/auth/callback?next=/ja/blueprints/quote-request-assistant");
    const url = new URL(page.url());
    expect(url.pathname).toBe("/ja/auth");
    expect(url.searchParams.get("next")).toBe("/ja/blueprints/quote-request-assistant");
    expect(url.searchParams.get("error")).toBe("auth");
  });
});
