import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadReadinessSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadReadinessSpec();
const ACCOUNTS = [
  "Business bank portal",
  "POS admin",
  "Payroll",
  "Owner personal streaming",
];
const QUEUE = [
  { account: "Payroll", high: "former staff still listed" },
  { account: "Business bank portal", high: "MFA" },
  { account: "POS admin", high: "MFA off" },
];

test.describe("Security Readiness Action Pack public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Security Readiness Action Pack" }),
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
      page.locator("a[href*='/blueprints/security-readiness-action-pack']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/security-readiness-action-pack']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/security-readiness-action-pack");
  });

  test("step 1 shows the fictional inventory", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional account inventory" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(4);
    for (const account of ACCOUNTS) {
      await expect(table.getByText(account, { exact: true })).toBeVisible();
    }
    const demo = demoRegion(page);
    await expect(demo.getByText("2026-04-06")).toBeVisible();
    await expect(demo.getByText("former staff still listed")).toBeVisible();
    await expect(demo.getByText("MFA off on customer-or-money data")).toBeVisible();
    await expect(demo.getByText("restore test = never on customer-or-money data")).toBeVisible();
    await expect(demo.getByText("shared login on an admin account")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The inventory" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 lists the skipped account", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(page.getByRole("heading", { name: "Skip rules first" })).toBeVisible();
    const skipped = page.getByRole("list", { name: "Skipped accounts" }).locator("li");
    await expect(skipped).toHaveCount(1);
    await expect(skipped.nth(0)).toContainText("Owner personal streaming");
    await expect(skipped.nth(0)).toContainText("personal-only");
    await expect(skipped.nth(0)).toContainText("holds customer or money data = no");
  });

  test("step 3 ranks the queue and labels the judgment", async ({ page }) => {
    await openDemoStep(page, 3);
    const items = page.getByRole("list", { name: "Readiness queue" }).locator("li");
    await expect(items).toHaveCount(3);
    for (const [index, item] of QUEUE.entries()) {
      const row = items.nth(index);
      await expect(row).toContainText(item.account);
      await expect(row).toContainText("HIGH");
      await expect(row).toContainText(item.high);
    }
    await expect(items.nth(1)).toContainText("never");
    await expect(items.nth(2)).toContainText("MEDIUM");
    await expect(items.nth(2)).toContainText("shared");
    const demo = demoRegion(page);
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo.getByText("This does not certify the company as secure.")).toBeVisible();
    await expect(demo).toContainText("none of these rows prove an account was misused");
    await expect(demo).toContainText("They only repeat what you entered");
  });

  test("step 4 checks facts against the inventory row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("still_with_company = no")).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the inventory row" }).click();
    const table = page.getByRole("table", { name: "Fact check for Payroll" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("still_with_company");
    await expect(rows.nth(0)).toContainText("no");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("named_owner");
    await expect(rows.nth(1)).toContainText("J. Reed");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("holds_customer_or_money_data");
    await expect(rows.nth(2)).toContainText("yes");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 carries the closure log into next quarter", async ({ page }) => {
    await openDemoStep(page, 5);
    await expect(page.getByRole("cell", { name: "closed", exact: true })).toBeVisible();
    await expect(page.getByText("2026-07-06")).toBeVisible();
    await expect(page.getByText("access removed on 2026-04-18")).toBeVisible();
    const queue = page.getByRole("list", { name: "Next quarter queue" }).locator("li");
    await expect(queue.nth(0)).toContainText("Business bank portal");
    await expect(queue.nth(0)).toContainText("HIGH");
    await expect(queue.nth(0)).toContainText("MFA still off");
    await expect(queue.nth(1)).toContainText("POS admin");
    await expect(queue.nth(1)).toContainText("HIGH");
    await expect(queue.nth(1)).toContainText("MFA still off");
    const skipped = page.getByRole("list", { name: "Next quarter skipped accounts" }).locator("li");
    await expect(skipped).toHaveCount(1);
    await expect(skipped.nth(0)).toContainText("Owner personal streaming");
    await expect(skipped.nth(0)).toContainText("personal-only");
  });

  test("step 6 says the person changes it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You change it in the real product. The kit changes nothing."),
    ).toBeVisible();
    await expect(page.getByText("This does not certify the company as secure.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", "/blueprints/security-readiness-action-pack/kit");
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
    await expect(page.getByRole("heading", { name: "Skip rules first" })).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(page.getByRole("heading", { name: "The inventory" })).toBeFocused();
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
