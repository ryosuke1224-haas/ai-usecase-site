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

test.describe("Quote Request Assistant Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps never-in-draft and you-price boundaries", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "見積依頼整理のプレミアムキット" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("Fit Review Prompt");
    await expect(page.locator("#setup-checklist")).toContainText("下書きに出してはいけない");
    await expect(page.locator("#extraction-prompt")).toContainText("価格、価格帯、利益率、仕入先名");
    await expect(page.locator("#extraction-prompt")).toContainText("送らないでください");
    await expect(page.locator("#fit-review-prompt")).toContainText("見積もりはあなたが付けます");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps never-in-draft constraints", async ({ page }) => {
    await page.getByRole("button", { name: "資格条件を作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("価格、価格帯、利益率、仕入先名");
    await expect(rules).toContainText("サービスエリア: Riverside");
    await expect(rules).toContainText("送らない。見積もりしない。トラッカーの行を追加しない。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of ["setup-checklist", "extraction-prompt", "fit-review-prompt", "sample-request"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("Quote Request Assistant Japanese kit without entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in Japanese kit stays locked", async ({ page }) => {
    await openAuthenticated(page, JA_KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premiumはロックされています" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.getByText("見積もりはあなたが付けます。送信もあなたがします。キットは何も変更しません。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ガイドに戻る" })).toHaveAttribute("href", JA_DEMO_PATH);
  });
});
