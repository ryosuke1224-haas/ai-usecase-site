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

test.describe("Quiet Proposal Chase Queue Japanese signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET });
    await openAuthenticated(page, JA_KIT_PATH);
  });

  test("Japanese kit keeps skip-first and human-send approval", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "提案後のフォロープレミアムキット" }),
    ).toBeVisible();
    await expect(page.getByText("プライベートプレビュー").first()).toBeVisible();
    await expect(page.locator("#setup-checklist")).toContainText("先にスキップルール");
    await expect(page.locator("#silence-queue-prompt")).toContainText("先にスキップルール");
    await expect(page.locator("#silence-queue-prompt")).toContainText("自動では送信しません");
    await expect(page.locator("#silence-queue-prompt")).toContainText("異議、競合");
    await expect(page.locator("#next-week-prompt")).toContainText("自動では送信しません");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
  });

  test("Japanese worksheet keeps silence rules and human-send boundary", async ({ page }) => {
    await page.getByRole("button", { name: "沈黙ルールを作る" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("declined、won、および on-hold は外す。");
    await expect(rules).toContainText("異議、競合名、期限は作らないでください。");
    await expect(rules).toContainText("沈黙は買う証拠でも、断った証拠でもありません。");
    await expect(rules).toContainText("送るのはあなたです。自動では送信しません。");
  });

  test("Japanese kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, JA_KIT_PATH);
    for (const id of [
      "setup-checklist",
      "silence-queue-prompt",
      "next-week-prompt",
      "sample-proposal-export",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe("Quiet Proposal Chase Queue Japanese kit without entitlement", () => {
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
