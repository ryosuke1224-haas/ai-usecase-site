import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadWinbackSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadWinbackSpec();

test.describe("Lapsed Customer Return Queue public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Lapsed Customer Return Queue" }),
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
      page.locator("a[href*='/blueprints/inactive-customer-winback']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/inactive-customer-winback']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/inactive-customer-winback");
  });

  test("step 1 shows the customer table and rules", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    const customers = page.getByRole("table", { name: "Customer export" });
    await expect(customers.locator("tbody tr")).toHaveCount(8);
    for (const name of [
      "J. Rivera",
      "L. Park",
      "T. Brooks",
      "A. Chen",
      "M. Ortiz",
      "K. Singh",
      "S. Diaz",
      "R. Wells",
    ]) {
      await expect(customers).toContainText(name);
    }
    await expect(demo.getByText("2026-06-15", { exact: true })).toBeVisible();
    await expect(demo.getByText("2026-04-16", { exact: true })).toBeVisible();
    await expect(demo.getByText("8", { exact: true })).toBeVisible();
    await expect(demo).toContainText("10% off next color");
    await expect(demo).toContainText("complimentary consult");
    await expect(
      page.getByRole("heading", { name: "The customer export" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows skip rules first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(page.getByRole("heading", { name: "SKIP RULES FIRST" })).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("A. Chen");
    await expect(demo).toContainText("2026-06-01");
    await expect(demo).toContainText(
      "Do not queue someone whose last visit is after your lapse date.",
    );
    await expect(demo).toContainText("M. Ortiz");
    await expect(demo).toContainText("marketing_consent");
    await expect(demo).toContainText("no");
    await expect(demo).toContainText("K. Singh");
    await expect(demo).toContainText("do_not_contact");
    await expect(demo).toContainText("yes");
    await expect(demo).toContainText("S. Diaz");
    const diazText = await demo.innerText();
    expect(diazText.includes("one-time") || diazText.includes("1")).toBe(true);
    await expect(demo).toContainText("R. Wells");
    await expect(demo).toContainText("already contacted");
  });

  test("step 3 shows the VIP-first queue and drafts", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const queue = page.getByRole("table", { name: "VIP-first winback queue" });
    await expect(queue.locator("tbody tr")).toHaveCount(3);
    await expect(queue.locator("tbody tr").nth(0)).toContainText("J. Rivera");
    await expect(queue.locator("tbody tr").nth(1)).toContainText("L. Park");
    await expect(queue.locator("tbody tr").nth(2)).toContainText("T. Brooks");
    await expect(demo).toContainText(
      "It has been a while since your Cut & color on Feb 3. If useful, a 10% off next color is available.",
    );
    await expect(demo).toContainText("Massage");
    await expect(demo).toContainText("Mar 1");
    await expect(demo).toContainText("complimentary consult");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("2026-02-03");
    await expect(demo).toContainText("Cut & color");
    await expect(demo).toContainText("11");
    await expect(demo).toContainText("yes");
    await expect(demo).toContainText("days since visit");
    await expect(demo).toContainText("do not prove why");
  });

  test("step 4 checks facts against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("J. Rivera")).toBeVisible();
    await expect(page.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the export row" }).click();
    const table = page.getByRole("table", { name: "Fact check against the export row" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("last visit");
    await expect(rows.nth(0)).toContainText("2026-02-03");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("last service");
    await expect(rows.nth(1)).toContainText("Cut & color");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("offer");
    await expect(rows.nth(2)).toContainText("10% off next color");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows the return check", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("J. Rivera");
    await expect(demo).toContainText("RETURNED");
    await expect(demo).toContainText("2026-07-01");
    await expect(demo).toContainText("L. Park");
    await expect(demo).toContainText("still lapsed");
    await expect(demo).toContainText("T. Brooks");
    await expect(demo).toContainText("A return is not proof the message caused it.");
    await expect(demo).toContainText("Confirm consent before any message.");
  });

  test("step 6 says the person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You send it. Nothing is sent automatically."),
    ).toBeVisible();
    await expect(
      page.getByText("Do not invent a discount that is not on your offer list."),
    ).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "You send it" })).toBeVisible();
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
    await expect(
      page.getByRole("heading", { name: "The customer export" }),
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
