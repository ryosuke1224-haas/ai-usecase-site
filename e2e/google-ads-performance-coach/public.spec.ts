import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadAdsSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadAdsSpec();

test.describe("Google Ads Performance Coach public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Google Ads Performance Coach" }),
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
      page.locator("a[href*='/blueprints/google-ads-performance-coach']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/google-ads-performance-coach']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/google-ads-performance-coach");
  });

  test("step 1 shows the fictional export tables", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const current = page.getByRole("table", { name: "Current-period campaign export" });
    const currentRows = current.locator("tbody tr");
    await expect(currentRows).toHaveCount(2);
    await expect(current.getByText("Spring Promo", { exact: true })).toBeVisible();
    await expect(current.getByText("Brand", { exact: true })).toBeVisible();

    const previous = page.getByRole("table", { name: "Previous-period campaign export" });
    const previousRows = previous.locator("tbody tr");
    await expect(previousRows).toHaveCount(2);
    await expect(previous.getByText("Spring Promo", { exact: true })).toBeVisible();
    await expect(previous.getByText("Brand", { exact: true })).toBeVisible();

    const actions = page.getByRole("table", { name: "Conversion-actions table" });
    await expect(actions.getByText("page_view", { exact: true })).toBeVisible();
    await expect(actions.getByText("form_submit", { exact: true })).toBeVisible();

    const ga4 = page.getByRole("table", { name: "GA4 landing-page table" });
    await expect(ga4.getByText("/spring-landing", { exact: true })).toBeVisible();
    await expect(ga4.getByText("/contact", { exact: true })).toBeVisible();

    const demo = demoRegion(page);
    await expect(demo.getByText("form_submit (completed contact form)")).toBeVisible();
    await expect(demo.getByText("2026-09-01 to 2026-09-30")).toBeVisible();
    await expect(demo.getByText("2026-08-01 to 2026-08-31")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The exports" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 runs measurement review first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "MEASUREMENT REVIEW FIRST" }),
    ).toBeVisible();
    const results = page.getByRole("list", { name: "Measurement results" }).locator("li");
    await expect(results.nth(0)).toContainText("Spring Promo");
    await expect(results.nth(0)).toContainText("failed");
    await expect(results.nth(0)).toContainText("page_view");
    await expect(results.nth(0)).toContainText("96");
    await expect(results.nth(0)).toContainText("12");
    await expect(results.nth(0)).toContainText("SKIPPED FOR EFFICIENCY");
    await expect(results.nth(1)).toContainText("Brand");
    await expect(results.nth(1)).toContainText("passed");
    await expect(results.nth(1)).toContainText("form_submit");
  });

  test("step 3 shows workbook formulas and labelled judgment", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const spring = page.getByRole("table", { name: "Calculation workbook" }).locator("tbody tr").nth(0);
    await expect(spring).toContainText("Spring Promo");
    await expect(spring).toContainText("=1860/96");
    await expect(spring).toContainText("19.38");
    await expect(spring).toContainText("no");
    const brand = page.getByRole("table", { name: "Calculation workbook" }).locator("tbody tr").nth(1);
    await expect(brand).toContainText("Brand");
    await expect(brand).toContainText("=290/22");
    await expect(brand).toContainText("13.18");
    await expect(brand).toContainText("yes");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("not meaningful until tracking changes");
    await expect(demo).toContainText("Do not change bids yet");
  });

  test("step 4 checks facts against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("primary_conversion = page_view")).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the export row" }).click();
    const table = page.getByRole("table", { name: "Fact check for Spring Promo" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("primary_conversion");
    await expect(rows.nth(0)).toContainText("page_view");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("conversions");
    await expect(rows.nth(1)).toContainText("96");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("cost");
    await expect(rows.nth(2)).toContainText("1860");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows what a later run needs", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("=275/19");
    await expect(demo).toContainText("14.47");
    await expect(demo).toContainText("=290-275");
    await expect(demo).toContainText("15");
    await expect(demo).toContainText("=22-19");
    await expect(demo).toContainText("3");
    await expect(demo).toContainText("Search-terms export: not provided");
    await expect(demo).toContainText(
      "Re-run after 14 days with a new campaign export. Do not change bids yet.",
    );
  });

  test("step 6 says the person changes it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You change it in Google Ads. The kit changes nothing."),
    ).toBeVisible();
    await expect(page.getByText("Do not change bids yet.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "You change it" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "MEASUREMENT REVIEW FIRST" })).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(page.getByRole("heading", { name: "The exports" })).toBeFocused();
  });

  test("demo steps contain no price or savings claims", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
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
