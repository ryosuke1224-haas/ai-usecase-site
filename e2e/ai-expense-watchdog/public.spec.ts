import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadExpenseSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadExpenseSpec();

test.describe("AI Expense Watchdog public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Expense Watchdog" }),
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
      page.locator("a[href*='/blueprints/ai-expense-watchdog']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-expense-watchdog']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-expense-watchdog");
  });

  test("step 1 shows the fictional export table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional card export" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(10);
    await expect(table.getByText("DesignHub Pro", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("CanvaLite Teams", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("ZoomMeet", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("Harbor Office Supply", { exact: true })).toBeVisible();

    const demo = demoRegion(page);
    await expect(demo.getByText("2026-07-01 to 2026-09-30")).toBeVisible();
    await expect(demo.getByText("2026-09-30", { exact: true })).toBeVisible();
    await expect(demo.getByText("ZoomMeet", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("design tools", { exact: true })).toBeVisible();
    await expect(demo.getByText("5.00", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 runs recurring ledger first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "RECURRING LEDGER FIRST" }),
    ).toBeVisible();
    const results = page.getByRole("list", { name: "Recurring ledger results" }).locator("li");
    await expect(results.nth(0)).toContainText("DesignHub Pro");
    await expect(results.nth(0)).toContainText("recurring");
    await expect(results.nth(1)).toContainText("CanvaLite Teams");
    await expect(results.nth(1)).toContainText("recurring");
    await expect(results.nth(2)).toContainText("ZoomMeet");
    await expect(results.nth(2)).toContainText("recurring");
    await expect(results.nth(2)).toContainText("SKIPPED FOR CANCEL REVIEW");
    await expect(results.nth(3)).toContainText("Harbor Office Supply");
    await expect(results.nth(3)).toContainText("NOT RECURRING");
    await expect(results.nth(3)).toContainText("84.00");
    await expect(results.nth(3)).toContainText("one charge");
  });

  test("step 3 shows ledger formulas and labelled judgment", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const table = page.getByRole("table", { name: "Recurring ledger" });
    const designHub = table.locator("tbody tr").nth(0);
    await expect(designHub).toContainText("DesignHub Pro");
    await expect(designHub).toContainText("=39.00-29.00");
    await expect(designHub).toContainText("10.00");
    const canva = table.locator("tbody tr").nth(1);
    await expect(canva).toContainText("CanvaLite Teams");
    await expect(canva).toContainText("=30.00-30.00");
    await expect(canva).toContainText("0.00");
    const zoom = table.locator("tbody tr").nth(2);
    await expect(zoom).toContainText("ZoomMeet");
    await expect(zoom).toContainText("=15.99-15.99");
    await expect(zoom).toContainText("0.00");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("may overlap");
    await expect(demo).toContainText("not a savings figure");
    await expect(demo).toContainText("confirm who uses");
    await expect(demo).toContainText("Do not cancel from a guess.");
  });

  test("step 4 checks facts against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("29.00")).toBeVisible();
    await expect(page.getByText("39.00").first()).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the export row" }).click();
    const table = page.getByRole("table", { name: "Fact check for DesignHub Pro" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("2026-07-03");
    await expect(rows.nth(0)).toContainText("29.00");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("2026-08-03");
    await expect(rows.nth(1)).toContainText("39.00");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("2026-09-03");
    await expect(rows.nth(2)).toContainText("39.00");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows what a later run needs", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("No new export was provided.");
    await expect(demo).toContainText("no usage column");
    await expect(demo.getByText("ZoomMeet", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText(
      "Re-run next month with a new export. Do not cancel from a guess.",
    );
  });

  test("step 6 says the person cancels it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You cancel it. The kit changes nothing."),
    ).toBeVisible();
    await expect(page.getByText("Do not cancel from a guess.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "You cancel it" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "RECURRING LEDGER FIRST" })).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(page.getByRole("heading", { name: "The export" })).toBeFocused();
  });

  test("demo steps contain no price or savings claims", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await page.getByRole("button", { name: "Next step" }).click();
      await expect(stepLabel(page, step)).toBeVisible();
      const text = await page.locator("body").innerText();
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
