import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  KIT_PATH,
  demoRegion,
  loadQuoteSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadQuoteSpec();

test.describe("Quote Request Assistant public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Quote Request Assistant" }),
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
      page.locator("a[href*='/blueprints/quote-request-assistant']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/quote-request-assistant']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/quote-request-assistant");
  });

  test("step 1 shows the request and the rules", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    await expect(demo).toContainText(
      "Need our back deck redone, maybe 300 sq ft, composite if not crazy expensive. Hoping before July. We're in Riverside.",
    );
    await expect(demo.getByText("Jordan Hale", { exact: true })).toBeVisible();
    await expect(demo.getByText("2026-05-12", { exact: true })).toBeVisible();
    await expect(demo).toContainText("Riverside");
    await expect(demo).toContainText("150");
    await expect(demo).toContainText("deck replacement");
    await expect(demo).toContainText("railings");
    await expect(demo).toContainText("roofing");
    await expect(demo).toContainText("new-home construction");
    await expect(
      page.getByRole("heading", { name: "The request and the rules" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows extraction labels", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo).toContainText("deck replacement");
    await expect(demo).toContainText("maybe 300 sq ft");
    await expect(demo).toContainText("Riverside");
    await expect(demo).toContainText("hoping before July");
    await expect(demo).toContainText("composite");
    await expect(demo).toContainText("Jordan Hale");
    await expect(demo).toContainText("if not crazy expensive");
    await expect(demo).toContainText("requested window, not a booked start date");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
  });

  test("step 3 shows FIT YES and the contrast cases", async ({ page }) => {
    await openDemoStep(page, 3);
    await expect(page.getByRole("heading", { name: "FIT: YES" })).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo).toContainText("Riverside");
    await expect(demo).toContainText("150");
    await expect(demo).toContainText("deck replacement");
    await expect(demo).toContainText(
      "A roofing request in Mesa would be FIT NO (out of catalog; outside service area).",
    );
    await expect(demo).toContainText(
      "A curved custom deck in Riverside that is not listed as a catalog item would be NEEDS YOUR CHECK, not FIT NO.",
    );
  });

  test("step 4 checks facts against the request", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("location = Riverside")).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the request" }).click();
    const table = page.getByRole("table", { name: "Fact check against the request" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("location");
    await expect(rows.nth(0)).toContainText("Riverside");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("size");
    await expect(rows.nth(1)).toContainText("maybe 300 sq ft");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("work_type");
    await expect(rows.nth(2)).toContainText("deck replacement");
    await expect(rows.nth(2)).toContainText("back deck redone");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows questions and a draft that is not sent", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    const questions = demo.getByRole("listitem");
    await expect(questions).toHaveCount(2);
    await expect(questions.nth(0)).toContainText("condition of the existing deck");
    await expect(questions.nth(1)).toContainText("railing replacement");
    const draft = page.getByRole("blockquote", { name: "Draft acknowledgment" });
    await expect(draft).toContainText("Jordan");
    await expect(draft).toContainText("Riverside");
    await expect(draft).toContainText("300 sq ft");
    await expect(draft).toContainText("before July");
    expect((await draft.innerText())).not.toMatch(/\$|cost band|markup/i);
    await expect(demo.getByText("Do not send this draft.")).toBeVisible();
  });

  test("step 6 shows the tracker and says the person prices and sends", async ({
    page,
  }) => {
    await openDemoStep(page, 6);
    const demo = demoRegion(page);
    await expect(demo).toContainText("QR-1001");
    await expect(demo).toContainText("2026-05-12");
    await expect(demo).toContainText("Jordan Hale");
    await expect(demo).toContainText("Riverside");
    await expect(demo).toContainText("deck replacement");
    await expect(demo).toContainText("300");
    await expect(demo).toContainText("composite");
    await expect(demo).toContainText("before July");
    await expect(demo).toContainText("YES");
    await expect(demo).toContainText("needs pricing");
    await expect(
      page.getByText("You price it. You send it. The kit changes nothing."),
    ).toBeVisible();
    await expect(page.getByText("Do not send this draft.")).toBeVisible();
    const kit = page.getByRole("link", { name: /sign-in is required/i });
    await expect(kit).toHaveAttribute("href", KIT_PATH);
    await expect(kit).toContainText(/private preview/i);
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "You price and send" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Extract with labels" })).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The request and the rules" }),
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
