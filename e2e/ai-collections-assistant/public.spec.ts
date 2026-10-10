import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  demoRegion,
  loadCollectionsSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadCollectionsSpec();
const INVOICES = [
  "INV-3307",
  "INV-3312",
  "INV-3290",
  "INV-3315",
  "INV-3281",
  "INV-3309",
  "INV-3318",
  "INV-3301",
];
const QUEUE = [
  { invoice: "INV-3301", tone: "phone call recommended", days: "45" },
  { invoice: "INV-3281", tone: "phone call recommended", days: "54" },
  { invoice: "INV-3307", tone: "firm", days: "38" },
  { invoice: "INV-3309", tone: "firm", days: "28" },
  { invoice: "INV-3315", tone: "friendly", days: "11" },
  { invoice: "INV-3318", tone: "friendly", days: "7" },
];

test.describe("AI Collections Assistant public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Collections Assistant" }),
    ).toBeVisible();
    await expect(page.getByText("Private preview", { exact: true })).toBeVisible();
    await expect(page.getByText(spec.guided_demo.fictional_data_notice)).toBeVisible();
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to purchase", exact: true })).toHaveAttribute(
      "href",
      "/auth?next=%2Fblueprints%2Fai-collections-assistant",
    );
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
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aiusecaseatlas.com/blueprints/ai-collections-assistant",
    );
  });

  test("demo is not linked from the homepage or sitemap", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("a[href*='/blueprints/ai-collections-assistant']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-collections-assistant']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-collections-assistant");
  });

  test("step 1 shows the fictional export", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const table = page.getByRole("table", { name: "Fictional aging report export" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(8);
    for (const invoice of INVOICES) {
      await expect(table.getByText(invoice, { exact: true })).toBeVisible();
    }
    const demo = demoRegion(page);
    await expect(demo.getByText("2026-06-08")).toBeVisible();
    await expect(demo.getByText("$150")).toBeVisible();
    await expect(demo.getByText("friendly 1-14 days")).toBeVisible();
    await expect(demo.getByText("firm 15-44 days")).toBeVisible();
    await expect(demo.getByText("phone call recommended 45+ days")).toBeVisible();
    await expect(page.getByRole("heading", { name: "The export" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 lists the two skipped invoices", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(page.getByRole("heading", { name: "Skip rules first" })).toBeVisible();
    const skipped = page.getByRole("list", { name: "Skipped invoices" }).locator("li");
    await expect(skipped).toHaveCount(2);
    await expect(skipped.nth(0)).toContainText("INV-3312");
    await expect(skipped.nth(0)).toContainText("payment promised for 2026-06-12");
    await expect(skipped.nth(1)).toContainText("INV-3290");
    await expect(skipped.nth(1)).toContainText("disputed; needs your decision");
  });

  test("step 3 ranks the queue and labels the judgment", async ({ page }) => {
    await openDemoStep(page, 3);
    const items = page.getByRole("list", { name: "Collections queue" }).locator("li");
    await expect(items).toHaveCount(6);
    for (const [index, item] of QUEUE.entries()) {
      const row = items.nth(index);
      await expect(row).toContainText(item.invoice);
      await expect(row).toContainText(`Tone: ${item.tone}`);
      await expect(row).toContainText(`${item.days} days overdue`);
    }
    const demo = demoRegion(page);
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("no payment history was provided");
  });

  test("step 4 checks the draft against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(
      page.getByText(
        "Invoice INV-3307 for $3,900 was due on May 1. Could you confirm when payment will be sent?",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Check numbers against the export row" }).click();
    const table = page.getByRole("table", { name: "Number check for INV-3307" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("INV-3307");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("$3,900");
    await expect(rows.nth(1)).toContainText("3900");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("May 1");
    await expect(rows.nth(2)).toContainText("2026-05-01");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 carries the outcome log into next week", async ({ page }) => {
    await openDemoStep(page, 5);
    await expect(page.getByRole("cell", { name: "2026-06-19" })).toBeVisible();
    const skipped = page.getByRole("list", { name: "Next week skipped invoices" }).locator("li");
    await expect(skipped.nth(0)).toContainText("INV-3307");
    await expect(skipped.nth(0)).toContainText("payment promised for 2026-06-19");
    await expect(skipped.nth(1)).toContainText("INV-3290");
    await expect(skipped.nth(1)).toContainText("disputed");
    const queue = page.getByRole("list", { name: "Next week queue" }).locator("li");
    const order = ["INV-3301", "INV-3281", "INV-3309", "INV-3318"];
    for (const [index, invoice] of order.entries()) {
      await expect(queue.nth(index)).toContainText(invoice);
    }
  });

  test("step 6 says the person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(page.getByText("You send it. Nothing is sent automatically.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in required/i });
    await expect(kit).toHaveAttribute("href", "/blueprints/ai-collections-assistant/kit");
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
    await expect(page.getByRole("heading", { name: "Skip rules first" })).toBeFocused();
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
});
