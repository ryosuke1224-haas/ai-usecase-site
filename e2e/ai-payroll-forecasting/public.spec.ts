import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  JA_DEMO_PATH,
  JA_KIT_PATH,
  KIT_PATH,
  demoRegion,
  loadPayrollSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadPayrollSpec();

test.describe("Next-Pay Labor Check public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Next-Pay Labor Check" }),
    ).toBeVisible();
    await expect(page.getByText("Private preview", { exact: true })).toBeVisible();
    await expect(page.getByText(spec.guided_demo.fictional_data_notice)).toBeVisible();
    await expect(stepLabel(page, 1)).toBeVisible();
    const notice = page.getByText(spec.guided_demo.fictional_data_notice);
    const step = stepLabel(page, 1);
    expect(
      (await notice.boundingBox())!.y < (await step.boundingBox())!.y,
    ).toBe(true);
  });

  test("demo is noindex", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const content = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(content).toContain("noindex");
    expect(content).toContain("nofollow");
  });

  test("demo is not linked from the homepage or sitemap", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("a[href*='/blueprints/ai-payroll-forecasting']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-payroll-forecasting']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-payroll-forecasting");
  });

  test("step 1 shows the fictional schedule table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional schedule export" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("stylist");
    await expect(rows.nth(0)).toContainText("128");
    await expect(rows.nth(0)).toContainText("22");
    await expect(rows.nth(0)).toContainText("4");
    await expect(rows.nth(1)).toContainText("front_desk");
    await expect(rows.nth(1)).toContainText("64");
    await expect(rows.nth(1)).toContainText("18");
    await expect(rows.nth(1)).toContainText("0");

    const demo = demoRegion(page);
    await expect(demo.getByText("2026-04-06 to 2026-04-19")).toBeVisible();
    await expect(demo.getByText("9800", { exact: true })).toBeVisible();
    await expect(demo.getByText("1.20", { exact: true })).toBeVisible();
    await expect(demo.getByText("40", { exact: true })).toBeVisible();
    await expect(demo.getByText("1.5", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The schedule export" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows visible formulas", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "NEXT-PAY LABOR CHECK", exact: true }),
    ).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo.getByText("=124*22")).toBeVisible();
    await expect(demo.getByText("2728")).toBeVisible();
    await expect(demo.getByText("=4*33")).toBeVisible();
    await expect(demo.getByText("132")).toBeVisible();
    await expect(demo.getByText("2860")).toBeVisible();
    await expect(demo.getByText("=64*18")).toBeVisible();
    await expect(demo.getByText("1152")).toBeVisible();
    await expect(demo.getByText("=4012*1.20")).toBeVisible();
    await expect(demo.getByText("4814.40")).toBeVisible();
  });

  test("step 3 shows target and overtime flags", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    await expect(demo.getByText("=4814.40/9800")).toBeVisible();
    await expect(demo.getByText("49.1%")).toBeVisible();
    await expect(demo).toContainText("above the 40% target");
    await expect(demo).toContainText("stylist");
    await expect(demo).toContainText("4");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("OWNER-ENTERED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("CALCULATED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
  });

  test("step 4 checks facts against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText(/stylist regular =124\*22/)).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the export row" }).click();
    const table = page.getByRole("table", { name: "Fact check for stylist" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("scheduled_hours");
    await expect(rows.nth(0)).toContainText("128");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("hourly_rate");
    await expect(rows.nth(1)).toContainText("22");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("overtime_hours_in_schedule");
    await expect(rows.nth(2)).toContainText("4");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows interpretation and variance", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("hours");
    await expect(demo).toContainText(
      "cannot say whether the $9,800 revenue figure is realistic",
    );
    await expect(demo.getByText("4814.40").first()).toBeVisible();
    await expect(demo.getByText("actual_payroll_total: 4960.")).toBeVisible();
    await expect(demo.getByText("=4960-4814.40")).toBeVisible();
    await expect(demo.getByText("145.60")).toBeVisible();
    await expect(demo).toContainText(
      "Re-check against the actual pay-run total after 2026-04-19.",
    );
  });

  test("step 6 says the person edits the schedule", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You edit the schedule in your own tool. The kit changes nothing.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Do not cut hours that break your minimum coverage.", {
        exact: true,
      }),
    ).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(
      page.getByRole("heading", { level: 2, name: "You edit the schedule", exact: true }),
    ).toBeVisible();
  });

  test("keyboard moves between steps and focuses the heading", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const next = page.getByRole("button", { name: "Next step" });
    await expect(next).toBeEnabled();
    for (let tab = 0; tab < 20; tab += 1) {
      await page.keyboard.press("Tab");
      if (await next.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "NEXT-PAY LABOR CHECK", exact: true }),
    ).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "The schedule export", exact: true }),
    ).toBeFocused();
  });

  test("demo steps contain no price or savings claims", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
    await expect(page.getByText("$49", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to purchase", exact: true })).toBeVisible();
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await page.getByRole("button", { name: "Next step" }).click();
      await expect(stepLabel(page, step)).toBeVisible();
      const text = await demoRegion(page).innerText();
      expect(text).not.toMatch(FORBIDDEN_COPY);
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

  test("logged-out kit access redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(KIT_PATH);
    await expectAuthNext(page, KIT_PATH);
  });
});

test.describe("Next-Pay Labor Check Japanese public demo", () => {
  test("Japanese demo uses the launch labels and keeps forecast framing", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { level: 1, name: "次回人件費チェック" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー", { exact: true })).toBeVisible();
    await expect(page.getByText("確認済み", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("要確認", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AIの解釈", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("推奨アクション", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/給与の送信や編集は自動では行いません/)).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    expect(robots).toContain("nofollow");
  });

  test("Japanese demo keeps the canonical rows and links to the Japanese kit", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const table = page.getByRole("table", { name: "架空のシフト書き出し" });
    await expect(table.locator("tbody tr")).toHaveCount(2);
    await expect(table.getByText("stylist", { exact: true }).first()).toBeVisible();
    const next = page.getByRole("button", { name: "次へ" });
    await expect(next).toBeEnabled();
    for (let step = 1; step < TOTAL_STEPS; step += 1) await next.click();
    await expect(page.getByText("ステップ 6 / 6", { exact: true })).toBeVisible();
    await expect(page.getByText("最少カバーを下回る削減はしません。").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /プライベートプレビュー/ })).toHaveAttribute(
      "href",
      JA_KIT_PATH,
    );
  });

  test("Japanese demo does not scroll sideways", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const next = page.getByRole("button", { name: "次へ" });
    await expect(next).toBeEnabled();
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
