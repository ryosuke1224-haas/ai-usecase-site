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

test.describe("On-brand Reply Review Queue Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps escalate-first and approval before send", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "問い合わせ返信の下書きプレミアムキット" }),
    ).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("Escalate-First Prompt");
    await expect(page.locator("#setup-checklist")).toContainText("FAQ-Only Draft Prompt");
    await expect(page.locator("#escalate-prompt")).toContainText("エスカレート規則を先に適用");
    await expect(page.locator("#escalate-prompt")).toContainText(
      "金銭に関する顧客向けの返信は下書きしないでください",
    );
    await expect(page.locator("#draft-prompt")).toContainText("送信はあなたがします");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps escalate defaults and send boundary", async ({ page }) => {
    await page.getByRole("button", { name: "返信の規則を作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("エスカレート規則を先に適用");
    await expect(rules).toContainText("refund demand; injury; legal threat");
    await expect(rules).toContainText("送信はあなたがします。自動では送りません。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of ["setup-checklist", "escalate-prompt", "draft-prompt", "sample-messages"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("On-brand Reply Review Queue Japanese kit without entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in Japanese kit stays locked", async ({ page }) => {
    await openAuthenticated(page, JA_KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premiumはロックされています" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.getByText("送信はあなたがします。自動では送りません。")).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "ガイドに戻る" })).toHaveAttribute(
      "href",
      JA_DEMO_PATH,
    );
  });
});
