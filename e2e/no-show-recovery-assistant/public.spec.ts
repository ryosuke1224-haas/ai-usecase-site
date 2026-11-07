import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  JA_DEMO_PATH,
  JA_KIT_PATH,
  KIT_PATH,
  TOTAL_STEPS,
  demoRegion,
  loadNoShowSpec,
  openDemoStep,
  stepLabel,
} from "./helpers";

const spec = loadNoShowSpec();

test.describe("No-show Recovery Assistant public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { level: 1, name: "No-show Recovery Assistant" })).toBeVisible();
    await expect(page.getByText("Private preview", { exact: true })).toBeVisible();
    await expect(page.getByText(spec.guided_demo.fictional_data_notice)).toBeVisible();
    await expect(page.getByText("Nothing is sent automatically.").first()).toBeVisible();
    await expect(page.getByText("Email consent does not imply SMS consent.").first()).toBeVisible();
    await expect(stepLabel(page, 1)).toBeVisible();
    const notice = page.getByText(spec.guided_demo.fictional_data_notice);
    const step = stepLabel(page, 1);
    expect((await notice.boundingBox())!.y < (await step.boundingBox())!.y).toBe(true);
  });

  test("demo is noindex", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const content = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(content).toContain("noindex");
    expect(content).toContain("nofollow");
  });

  test("demo is not linked from the homepage or sitemap", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("a[href*='/blueprints/no-show-recovery-assistant']")).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/no-show-recovery-assistant");
  });

  test("step 1 shows the fictional bookings and the consent rule", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional booking export" });
    await expect(table.locator("tbody tr")).toHaveCount(5);
    await expect(table.getByText("J. Rivera", { exact: true })).toBeVisible();
    await expect(table.getByText("R. Kim", { exact: true })).toBeVisible();
    await expect(demoRegion(page).getByText("2026-10-14")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The day's bookings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 skips attended and cancelled rows", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(page.getByRole("heading", { name: "CONFIRM ATTENDANCE FIRST" })).toBeVisible();
    const skipped = page.getByRole("list", { name: "Skipped rows" }).locator("li");
    await expect(skipped).toHaveCount(2);
    await expect(skipped.nth(0)).toContainText("A. Chen");
    await expect(skipped.nth(0)).toContainText("attended");
    await expect(skipped.nth(1)).toContainText("M. Ortiz");
    await expect(skipped.nth(1)).toContainText("cancelled");
  });

  test("step 3 names the rebooking prompt and holds sms_consent no", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    await expect(demo.getByText("Rebooking Draft Prompt")).toBeVisible();
    await expect(demo.getByText("Hi J., we missed you today. Would Thu 14:00 or Fri 09:30 work for Cut & color?")).toBeVisible();
    await expect(demo.getByText("NEEDS YOUR CHECK", { exact: true })).toBeVisible();
    await expect(demo.getByText("Email consent does not imply SMS consent.").first()).toBeVisible();
    await expect(demo.getByText("Nothing is sent automatically. You review and send.")).toBeVisible();
  });

  test("step 4 checks facts against the booking row", async ({ page }) => {
    await openDemoStep(page, 4);
    await page.getByRole("button", { name: "Check facts against the booking row" }).click();
    const table = page.getByRole("table", { name: "Fact check for J. Rivera" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText("status");
    await expect(rows.nth(0)).toContainText("no_show");
    await expect(rows.nth(1)).toContainText("sms_consent");
    await expect(rows.nth(1)).toContainText("yes");
    await expect(rows.nth(3)).toContainText("Matches");
  });

  test("step 5 flags the repeat no-show", async ({ page }) => {
    await openDemoStep(page, 5);
    await expect(page.getByText("FLAG FOR POLICY")).toBeVisible();
    await expect(page.getByText("Nothing is sent automatically.").first()).toBeVisible();
    await expect(demoRegion(page)).toContainText("L. Brooks");
  });

  test("step 6 says a person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      demoRegion(page).getByText("You review and send. Nothing is sent automatically.", { exact: true }),
    ).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
  });

  test("demo steps contain no price or checkout", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await page.getByRole("button", { name: "Next step" }).click();
      await expect(stepLabel(page, step)).toBeVisible();
      expect(await demoRegion(page).innerText()).not.toMatch(FORBIDDEN_COPY);
    }
  });

  test("demo does not scroll sideways", async ({ page }) => {
    await page.goto(DEMO_PATH);
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await page.getByRole("button", { name: "Next step" }).click();
      await expect(stepLabel(page, step)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("logged-out kit access redirects to auth and preserves next", async ({ page }) => {
    await page.goto(KIT_PATH);
    await expectAuthNext(page, KIT_PATH);
  });
});

test.describe("No-show Recovery Assistant Japanese public demo", () => {
  test("Japanese demo uses the launch labels and stays noindex", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { level: 1, name: "無断キャンセルの再予約" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー", { exact: true })).toBeVisible();
    await expect(page.getByText("確認済み", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("要確認", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AIの解釈", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("推奨アクション", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("メールの同意は SMS の同意を意味しません。").first()).toBeVisible();
    await expect(page.getByText("自動では送信しません。").first()).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    expect(robots).toContain("nofollow");
  });

  test("Japanese demo names the Rebooking Draft Prompt and links to the Japanese kit", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const next = page.getByRole("button", { name: "次へ" });
    await next.click();
    await next.click();
    await expect(page.getByText("ステップ 3 / 6", { exact: true })).toBeVisible();
    await expect(page.getByText("Rebooking Draft Prompt").first()).toBeVisible();
    await next.click();
    await next.click();
    await next.click();
    await expect(page.getByRole("link", { name: /プライベートプレビュー/ })).toHaveAttribute("href", JA_KIT_PATH);
  });

  test("Japanese demo does not scroll sideways", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const next = page.getByRole("button", { name: "次へ" });
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await next.click();
      await expect(page.getByText(`ステップ ${step} / ${TOTAL_STEPS}`, { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("logged-out Japanese kit access redirects to Japanese auth", async ({ page }) => {
    await page.goto(JA_KIT_PATH);
    await expect(page).toHaveURL(/\/ja\/auth\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/ja/auth");
    expect(url.searchParams.get("next")).toBe(JA_KIT_PATH);
  });
});
