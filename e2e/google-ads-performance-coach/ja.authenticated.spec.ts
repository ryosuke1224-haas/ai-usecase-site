import { AUTH_SESSION_REFRESH_REQUIRED, inspectStorageState } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow, openAuthenticated } from "../support/navigation";
import { E2E_ENTITLEMENT_HEADER, E2E_ENTITLEMENT_SECRET } from "../support/payments-e2e";
import { JA_DEMO_PATH, JA_KIT_PATH } from "./helpers";

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Google Ads Performance Coach Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps coaching manual and forbids automatic Ads changes", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Google Ads の見直しプレミアムキット" }),
    ).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("有効な成果");
    await expect(page.locator("#measurement-review-prompt")).toContainText(
      "入札は変えないでください。",
    );
    await expect(page.locator("#measurement-review-prompt")).toContainText(
      "Google Ads アカウントは編集しないでください。",
    );
    await expect(page.locator("#period-review-prompt")).toContainText("AIの解釈");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps findings as coaching suggestions", async ({ page }) => {
    await page.getByRole("button", { name: "測定ルールを作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("まず測定の確認");
    await expect(rules).toContainText("入札は変えません");
    await expect(rules).toContainText("自動では行いません");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of [
      "setup-checklist",
      "measurement-review-prompt",
      "sample-exports",
      "safety-guidance",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("Google Ads Performance Coach Japanese kit without entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in Japanese kit stays locked", async ({ page }) => {
    await openAuthenticated(page, JA_KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premiumはロックされています" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.getByText("自動では行いません。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ガイドに戻る" })).toHaveAttribute(
      "href",
      JA_DEMO_PATH,
    );
  });
});
