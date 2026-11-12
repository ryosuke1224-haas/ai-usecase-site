import { AUTH_SESSION_REFRESH_REQUIRED, inspectStorageState } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow, openAuthenticated } from "../support/navigation";
import { E2E_ENTITLEMENT_HEADER, E2E_ENTITLEMENT_SECRET } from "../support/payments-e2e";

const PREMIUM = [
  { slug: "google-ads-performance-coach", enKit: "Google Ads Performance Coach Premium Kit", jaKit: "Google Ads の見直しプレミアムキット" },
  { slug: "quote-request-assistant", enKit: "Quote Request Assistant Premium Kit", jaKit: "見積依頼整理のプレミアムキット" },
  { slug: "ai-expense-watchdog", enKit: "AI Expense Watchdog Premium Kit", jaKit: "経費の見落とし確認プレミアムキット" },
  { slug: "no-show-recovery-assistant", enKit: "No-show Recovery Assistant Premium Kit", jaKit: "無断キャンセル再予約のプレミアムキット" },
  { slug: "unbilled-work-review-queue", enKit: "Unbilled Work Review Queue Premium Kit", jaKit: "未請求作業確認のプレミアムキット" },
  { slug: "ai-customer-response-assistant", enKit: "On-brand Reply Review Queue Premium Kit", jaKit: "問い合わせ返信の下書きプレミアムキット" },
  { slug: "ai-pipeline-risk-detector", enKit: "Stalled Deal Rescue Queue Premium Kit", jaKit: "止まりそうな商談プレミアムキット" },
  { slug: "inactive-customer-winback", enKit: "Lapsed Customer Return Queue Premium Kit", jaKit: "久々のお客様への再案内プレミアムキット" },
  { slug: "ai-staffing-optimizer", enKit: "Shift Coverage vs Demand Check Premium Kit", jaKit: "シフトと需要の調整プレミアムキット" },
  { slug: "ai-proposal-follow-up-assistant", enKit: "Quiet Proposal Chase Queue Premium Kit", jaKit: "提案後のフォロープレミアムキット" },
  { slug: "ai-payroll-forecasting", enKit: "Next-Pay Labor Check Premium Kit", jaKit: "人件費の見通しプレミアムキット" },
] as const;

function requireStoredSession() {
  if (inspectStorageState().status !== "present") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Launch entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({
      [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET,
    });
  });

  for (const product of PREMIUM) {
    test(`${product.slug} entitlement opens both kits and does not ask for another purchase`, async ({ page }) => {
      await openAuthenticated(page, `/blueprints/${product.slug}/kit`);
      await expect(page.getByRole("heading", { level: 1, name: product.enKit })).toBeVisible();
      await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
      await expect(page.locator("form[action*='checkout']")).toHaveCount(0);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      expect(robots).toContain("noindex");
      await expectNoHorizontalOverflow(page);

      await openAuthenticated(page, `/ja/blueprints/${product.slug}/kit`);
      await expect(page.getByRole("heading", { level: 1, name: product.jaKit })).toBeVisible();
      await expect(page.locator("form[action*='checkout']")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);

      await openAuthenticated(page, `/blueprints/${product.slug}`);
      await expect(page.getByRole("link", { name: "Open Premium Kit" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
      await expect(page.locator("form[action*='checkout']")).toHaveCount(0);
    });
  }

  test("My Blueprints shows the launch products as unlocked", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    for (const product of PREMIUM) {
      const title = product.enKit.replace(" Premium Kit", "");
      const card = page.locator("li").filter({ has: page.getByRole("heading", { level: 2, name: title }) });
      await expect(card.getByText("Unlocked", { exact: true })).toBeVisible();
      await expect(card.getByRole("link", { name: "Open Blueprint" })).toHaveAttribute(
        "href",
        `/blueprints/${product.slug}/kit`,
      );
    }
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);

    await openAuthenticated(page, "/ja/my-blueprints");
    await expect(page.getByText("利用可能").first()).toBeVisible();
    await expect(page.locator("form[action*='checkout']")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("the same signed-in session opens Collections and the Daily Inbox starter", async ({ page }) => {
    await openAuthenticated(page, "/blueprints/ai-collections-assistant/kit");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form[action*='checkout']")).toHaveCount(0);
    await openAuthenticated(page, "/ja/blueprints/ai-collections-assistant/kit");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await openAuthenticated(page, "/blueprints/daily-inbox-briefing/starter-kit");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth/);
  });
});
