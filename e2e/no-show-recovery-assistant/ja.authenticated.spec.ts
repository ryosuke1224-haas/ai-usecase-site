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

test.describe("No-show Recovery Assistant Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit names the prompt, consent rule, and human send boundary", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "無断キャンセル再予約のプレミアムキット" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー", { exact: true })).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("Rebooking Draft Prompt");
    await expect(page.locator("#rebooking-draft-prompt")).toContainText("メールの同意は SMS の同意を意味しません");
    await expect(page.locator("#rebooking-draft-prompt")).toContainText("sms_consent が no または空欄");
    await expect(page.getByText("自動では送信しません。").first()).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet states sms_consent no and email consent", async ({ page }) => {
    await page.getByRole("button", { name: "再予約ルールを作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("sms_consent が no または空欄のときは SMS を下書きしない。");
    await expect(rules).toContainText("メールの同意は SMS の同意を意味しません。");
    await expect(rules).toContainText("自動では送信しません。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of ["setup-checklist", "attendance-prompt", "rebooking-draft-prompt", "sample-bookings"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("No-show Recovery Assistant Japanese kit without entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in Japanese kit stays locked", async ({ page }) => {
    await openAuthenticated(page, JA_KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premiumはロックされています" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.getByText("自動では送信しません。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ガイドに戻る" })).toHaveAttribute("href", JA_DEMO_PATH);
  });
});
