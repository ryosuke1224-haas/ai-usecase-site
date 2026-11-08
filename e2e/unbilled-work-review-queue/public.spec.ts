import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadUnbilledSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadUnbilledSpec();

test.describe("Unbilled Work Review Queue public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Unbilled Work Review Queue" }),
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
      page.locator("a[href*='/blueprints/unbilled-work-review-queue']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/unbilled-work-review-queue']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/unbilled-work-review-queue");
  });

  test("step 1 shows the job export table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    const jobs = page.getByRole("table", { name: "Completed jobs" });
    await expect(jobs.locator("tbody tr")).toHaveCount(4);
    await expect(jobs).toContainText("J-88");
    await expect(jobs).toContainText("J-91");
    await expect(jobs).toContainText("J-70");
    await expect(jobs).toContainText("J-94");
    await expect(jobs).toContainText("Northgate Clinic");
    await expect(jobs).toContainText("Pell & Co");
    await expect(jobs).toContainText("Harbor Lane");
    await expect(jobs).toContainText("Birchwood");
    await expect(demo.getByText("2026-05-11", { exact: true })).toBeVisible();
    await expect(demo.getByText("$150", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows skip rules first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(page.getByRole("heading", { name: "SKIP RULES FIRST" })).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("J-91");
    await expect(demo).toContainText("invoice_id");
    await expect(demo).toContainText("INV-220");
    await expect(demo).toContainText("J-70");
    await expect(demo).toContainText("warranty");
    await expect(demo).toContainText("J-94");
    await expect(demo).toContainText("$85");
    await expect(demo).toContainText("$150");
  });

  test("step 3 shows the ranked queue and labels", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const queue = page.getByRole("table", { name: "Ranked unbilled queue" });
    await expect(queue.locator("tbody tr")).toHaveCount(1);
    await expect(queue).toContainText("J-88");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("Northgate Clinic");
    await expect(demo).toContainText("J-88");
    await expect(demo).toContainText("2026-04-22");
    await expect(demo).toContainText("12");
    await expect(demo).toContainText("85");
    await expect(demo).toContainText("1020");
    await expect(demo).toContainText("Northgate Clinic, J-88, 12 hours at $85, $1,020, date 2026-04-22");
    await expect(demo).toContainText("Do not add tax or terms not in the export.");
    await expect(demo.getByText("NEEDS YOUR CHECK", { exact: true })).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("blank invoice id");
    await expect(demo).toContainText("does not prove");
  });

  test("step 4 checks numbers against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("J-88")).toBeVisible();
    await expect(
      page.getByText("Northgate Clinic, J-88, 12 hours at $85, $1,020, date 2026-04-22"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Check numbers against the export row" }).click();
    const table = page.getByRole("table", { name: "Number check against the export row" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("hours");
    await expect(rows.nth(0)).toContainText("12");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("rate");
    await expect(rows.nth(1)).toContainText("85");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("amount");
    await expect(rows.nth(2)).toContainText("1020");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows next week's billing log", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("J-88");
    await expect(demo).toContainText("invoiced");
    await expect(demo).toContainText("INV-241");
    await expect(demo).toContainText("2026-05-18");
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("INV-241");
    await expect(demo).toContainText("Logged invoiced work is not listed again.");
  });

  test("step 6 says the person creates the invoice", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You create the invoice. Nothing is sent or collected."),
    ).toBeVisible();
    await expect(page.getByText("Do not add tax or terms not in the export.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: "You create the invoice" }),
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
    await expect(page.getByRole("heading", { name: "SKIP RULES FIRST" })).toBeFocused();
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
