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

test.describe("Stalled Deal Rescue Queue Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps skip-first and CRM export boundary", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "止まりそうな商談プレミアムキット" }),
    ).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("先にスキップルール");
    await expect(page.locator("#stall-queue-prompt")).toContainText("先にスキップルール");
    await expect(page.locator("#stall-queue-prompt")).toContainText("自動では送信もCRM書き込みもしません");
    await expect(page.locator("#stall-queue-prompt")).toContainText("連絡先、異議");
    await expect(page.locator("#next-week-prompt")).toContainText("自動では送信もCRM書き込みもしません");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps stall rules and human-send boundary", async ({ page }) => {
    await page.getByRole("button", { name: "停滞ルールを作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("closed-won、closed-lost、および on-hold は外す。");
    await expect(rules).toContainText("連絡先、異議、期限は作らないでください。");
    await expect(rules).toContainText("停滞の印は、買い手が興味を失った証拠にはなりません。");
    await expect(rules).toContainText("自動では送信もCRM書き込みもしません。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of [
      "setup-checklist",
      "stall-queue-prompt",
      "next-week-prompt",
      "sample-deal-export",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("Stalled Deal Rescue Queue Japanese kit without entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in Japanese kit stays locked", async ({ page }) => {
    await openAuthenticated(page, JA_KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premiumはロックされています" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.getByText("自動では送信もCRM書き込みもしません。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ガイドに戻る" })).toHaveAttribute("href", JA_DEMO_PATH);
  });
});
