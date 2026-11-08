import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadStaffingSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadStaffingSpec();

test.describe("Shift Coverage vs Demand Check public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Shift Coverage vs Demand Check",
      }),
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
      page.locator("a[href*='/blueprints/ai-staffing-optimizer']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-staffing-optimizer']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-staffing-optimizer");
  });

  test("step 1 shows the fictional hourly table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional hourly export" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Tue 14:00");
    await expect(rows.nth(0)).toContainText("12");
    await expect(rows.nth(0)).toContainText("10");
    await expect(rows.nth(0)).toContainText("11");
    await expect(rows.nth(0)).toContainText("4");
    await expect(rows.nth(1)).toContainText("Sat 12:00");
    await expect(rows.nth(1)).toContainText("90");
    await expect(rows.nth(1)).toContainText("82");
    await expect(rows.nth(1)).toContainText("88");
    await expect(rows.nth(1)).toContainText("92");
    await expect(rows.nth(1)).toContainText("3");

    const demo = demoRegion(page);
    await expect(demo.getByText(/minimum 2/i)).toBeVisible();
    await expect(demo.getByText("15-25")).toBeVisible();
    await expect(demo.getByText(/3\+ of 4 weeks/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The exports" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows owner rules first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "OWNER RULES FIRST", exact: true }),
    ).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo.getByText("OWNER-ENTERED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("15-25")).toBeVisible();
    await expect(demo).toContainText(
      "A single week outside the target is not enough to flag",
    );
  });

  test("step 3 shows coverage flags", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    await expect(demo.getByText("=12/4")).toBeVisible();
    await expect(demo.getByText("3.0")).toBeVisible();
    await expect(demo.getByText("=10/4")).toBeVisible();
    await expect(demo.getByText("2.5")).toBeVisible();
    await expect(demo.getByText("=11/4").first()).toBeVisible();
    await expect(demo.getByText("2.8").first()).toBeVisible();
    await expect(demo).toContainText("below your 15-25 target in 4 of 4 weeks");
    await expect(demo.getByText("=90/3")).toBeVisible();
    await expect(demo.getByText("30.0")).toBeVisible();
    await expect(demo.getByText("=82/3")).toBeVisible();
    await expect(demo.getByText("27.3")).toBeVisible();
    await expect(demo.getByText("=88/3")).toBeVisible();
    await expect(demo.getByText("29.3")).toBeVisible();
    await expect(demo.getByText("=92/3")).toBeVisible();
    await expect(demo.getByText("30.7")).toBeVisible();
    await expect(demo).toContainText("above target in 4 of 4 weeks");
    await expect(demo.getByText("Overstaffed pattern", { exact: true })).toBeVisible();
    await expect(demo.getByText("Understaffed pattern", { exact: true })).toBeVisible();
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("OWNER-ENTERED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
  });

  test("step 4 checks facts against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText(/Tue 14:00/)).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the export row" }).click();
    const table = page.getByRole("table", { name: "Fact check for Tue 14:00" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0)).toContainText("12");
    await expect(rows.nth(0)).toContainText("4");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("10");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("11");
    await expect(rows.nth(2)).toContainText("Matches");
    await expect(rows.nth(3)).toContainText("11");
    await expect(rows.nth(3)).toContainText("Matches");
    const demo = demoRegion(page);
    await expect(demo).toContainText("prep");
    await expect(demo).toContainText("POS export does not show");
  });

  test("step 5 shows recommendation and re-check", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("2 on floor");
    await expect(demo).toContainText("Tue 14:00");
    await expect(demo).toContainText("adding 1");
    await expect(demo).toContainText("22");
    await expect(demo).toContainText("inside 15-25");
    await expect(demo).toContainText("still below target");
    await expect(demo).toContainText(
      "Re-check the same blocks after 4 weeks with a new export.",
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
      page.getByText("Do not cut below your minimum staff.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Check local scheduling and break rules before changing posted shifts.",
        { exact: true },
      ),
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
      page.getByRole("heading", { level: 2, name: "OWNER RULES FIRST", exact: true }),
    ).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "The exports", exact: true }),
    ).toBeFocused();
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
