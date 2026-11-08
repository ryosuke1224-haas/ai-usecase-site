import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadNoShowSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadNoShowSpec();

test.describe("No-show Recovery Assistant public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "No-show Recovery Assistant" }),
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
      page.locator("a[href*='/blueprints/no-show-recovery-assistant']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/no-show-recovery-assistant']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/no-show-recovery-assistant");
  });

  test("step 1 shows the booking table and open slots", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    const bookings = page.getByRole("table", { name: "Day's bookings" });
    await expect(bookings.locator("tbody tr")).toHaveCount(5);
    await expect(bookings).toContainText("J. Rivera");
    await expect(bookings).toContainText("A. Chen");
    await expect(bookings).toContainText("M. Okonkwo");
    await expect(bookings).toContainText("S. Patel");
    await expect(bookings).toContainText("R. Kim");
    const slots = page.getByRole("table", { name: "Open slots" });
    await expect(slots).toContainText("Thu");
    await expect(slots).toContainText("Fri");
    await expect(slots).toContainText("Cut & color");
    await expect(slots).toContainText("Consult");
    await expect(slots).toContainText("Color");
    await expect(slots).toContainText("9:30");
    await expect(slots).toContainText("11:00");
    await expect(slots).toContainText("15:00");
    const slotText = await slots.innerText();
    expect(slotText.includes("2:00") || slotText.includes("14:00")).toBe(true);
    await expect(demo.getByText("2026-10-14", { exact: true })).toBeVisible();
    await expect(demo.getByText("3", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The day's bookings" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows confirm attendance first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "CONFIRM ATTENDANCE FIRST" }),
    ).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo).toContainText("J. Rivera");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("A. Chen");
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("attended");
    await expect(demo).toContainText("Do not message someone who attended.");
    await expect(demo).toContainText("S. Patel");
    await expect(demo).toContainText("cancelled");
    await expect(demo).toContainText("M. Okonkwo");
    await expect(demo.getByText("SKIPPED FOR SMS", { exact: true })).toBeVisible();
    await expect(demo).toContainText("sms_consent");
    await expect(demo).toContainText("no");
    await expect(demo).toContainText("R. Kim");
    await expect(demo.getByText("FLAG FOR POLICY", { exact: true })).toBeVisible();
    await expect(demo).toContainText("prior_no_shows");
    await expect(demo).toContainText("2");
  });

  test("step 3 shows the draft and labels", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    await expect(demo).toContainText(
      "Hi J., we missed you today. Would Thu 2:00 or Fri 9:30 work instead?",
    );
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("J. Rivera");
    await expect(demo).toContainText("10:00");
    await expect(demo).toContainText("Cut & color");
    await expect(demo).toContainText("no_show");
    await expect(demo).toContainText("yes");
    await expect(demo).toContainText("no arrival time");
    await expect(demo).toContainText("not a promise they remain open");
    await expect(demo).toContainText("Do not send this draft.");
    await expect(demo).toContainText(
      "Thu 11:00 Consult is not offered because the service does not match.",
    );
  });

  test("step 4 checks facts against the booking row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("J. Rivera")).toBeVisible();
    await expect(page.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the booking row" }).click();
    const table = page.getByRole("table", { name: "Fact check against the booking row" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("status");
    await expect(rows.nth(0)).toContainText("no_show");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("sms_consent");
    await expect(rows.nth(1)).toContainText("yes");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("open slots");
    await expect(rows.nth(2)).toContainText("Thu 2:00");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows repeat policy and missing consent", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo.getByText("FLAG FOR POLICY", { exact: true })).toBeVisible();
    await expect(demo).toContainText("R. Kim");
    await expect(demo).toContainText("prior_no_shows");
    await expect(demo).toContainText("2");
    await expect(demo).toContainText(
      "A third no-show is a policy decision, not an automatic text.",
    );
    await expect(demo).toContainText("Confirm consent before any message.");
    await expect(demo).toContainText("M. Okonkwo");
    await expect(demo).toContainText("sms_consent");
    await expect(demo).toContainText("No deposit is charged from this kit.");
  });

  test("step 6 says the person reviews and sends", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You review and send. The kit changes nothing."),
    ).toBeVisible();
    await expect(page.getByText("Do not send this draft.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(
      page.getByRole("heading", { name: "You review and send" }),
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
      page.getByRole("heading", { name: "CONFIRM ATTENDANCE FIRST" }),
    ).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The day's bookings" }),
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
