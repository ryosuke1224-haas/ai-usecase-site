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

test.describe("Lapsed Customer Return Queue Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps skip-first, no invented offers, and human send", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "久々のお客様への再案内プレミアムキット" }),
    ).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("先にスキップルール");
    await expect(page.locator("#skip-rules-prompt")).toContainText("marketing_consent");
    await expect(page.locator("#skip-rules-prompt")).toContainText("do_not_contact");
    await expect(page.locator("#skip-rules-prompt")).toContainText("自動では送信しません");
    await expect(page.locator("#draft-prompt")).toContainText("要確認");
    await expect(page.locator("#draft-prompt")).toContainText("作らない");
    await expect(page.locator("#return-check-prompt")).toContainText(
      "再来は、メッセージが原因だった証拠にはなりません",
    );
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps skip rules and written-offer boundary", async ({ page }) => {
    await page.getByRole("button", { name: "再案内のルールを作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("先にスキップルール");
    await expect(rules).toContainText("marketing_consent が no または空欄のときは外す。");
    await expect(rules).toContainText("オファーリストにない割引は作らないでください。");
    await expect(rules).toContainText("送るのは人です。自動では送信しません。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of [
      "setup-checklist",
      "skip-rules-prompt",
      "draft-prompt",
      "return-check-prompt",
      "sample-customers",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("Lapsed Customer Return Queue Japanese kit without entitlement", () => {
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
