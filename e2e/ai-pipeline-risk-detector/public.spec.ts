import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadPipelineSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadPipelineSpec();

test.describe("Stalled Deal Rescue Queue public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Stalled Deal Rescue Queue" }),
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
      page.locator("a[href*='/blueprints/ai-pipeline-risk-detector']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-pipeline-risk-detector']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-pipeline-risk-detector");
  });

  test("step 1 shows the deal export table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    const deals = page.getByRole("table", { name: "Open deals" });
    await expect(deals.locator("tbody tr")).toHaveCount(4);
    await expect(deals).toContainText("Northgate Clinic website rebuild");
    await expect(deals).toContainText("Pell & Co monthly books");
    await expect(deals).toContainText("Harbor Lane discovery");
    await expect(deals).toContainText("Birchwood retainers");
    await expect(demo.getByText("2026-05-11", { exact: true })).toBeVisible();
    await expect(demo.getByText("$500", { exact: true })).toBeVisible();
    await expect(demo).toContainText("14");
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
    await expect(demo).toContainText("Birchwood retainers");
    await expect(demo).toContainText("$400");
    await expect(demo).toContainText("$500");
    await expect(demo).toContainText("Pell & Co monthly books");
    await expect(demo).toContainText("2026-05-09");
    await expect(demo).toContainText("next step");
    await expect(demo).toContainText("not stalled");
  });

  test("step 3 shows the ranked queue and labels", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const queue = page.getByRole("table", { name: "Ranked stall queue" });
    await expect(queue.locator("tbody tr")).toHaveCount(2);
    await expect(queue.locator("tbody tr").nth(0)).toContainText(
      "Northgate Clinic website rebuild",
    );
    await expect(queue.locator("tbody tr").nth(1)).toContainText("Harbor Lane discovery");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("Northgate Clinic");
    await expect(demo).toContainText("$8,400");
    await expect(demo).toContainText("proposal");
    await expect(demo).toContainText("21");
    await expect(demo).toContainText("2026-04-18");
    await expect(demo).toContainText(
      "Checking in on the $8,400 website rebuild proposal last touched April 18. Is this still useful to discuss?",
    );
    await expect(demo).toContainText("Harbor Lane");
    await expect(demo).toContainText("$1,500");
    await expect(demo).toContainText("qualified");
    await expect(demo).toContainText("45");
    await expect(demo).toContainText("2026-03-20");
    await expect(demo).toContainText(
      "The Harbor Lane discovery item for $1,500 has had no recorded activity since March 20. Should we close this out or set a next step?",
    );
    await expect(demo).toContainText("Do not invent a contact, objection, or deadline.");
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("do not prove");
    await expect(demo).toContainText("lost interest");
  });

  test("step 4 checks numbers against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(
      page.getByText(
        "Checking in on the $8,400 website rebuild proposal last touched April 18. Is this still useful to discuss?",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Check numbers against the export row" }).click();
    const table = page.getByRole("table", { name: "Number check against the export row" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("amount");
    await expect(rows.nth(0)).toContainText("$8,400");
    await expect(rows.nth(0)).toContainText("8400");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("last activity");
    await expect(rows.nth(1)).toContainText("2026-04-18");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("days in stage");
    await expect(rows.nth(2)).toContainText("21");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows next week's outcome log", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("Harbor Lane discovery");
    await expect(demo).toContainText("on_hold");
    await expect(demo).toContainText("still_stalled");
    await expect(demo).toContainText("2026-05-18");
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("on_hold");
    await expect(demo).toContainText("Logged on-hold deals are not chased again.");
  });

  test("step 6 says the person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You send it. Nothing is sent or written to the CRM."),
    ).toBeVisible();
    await expect(
      page.getByText("Do not invent a contact, objection, or deadline."),
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
