import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  JA_DEMO_PATH,
  JA_KIT_PATH,
  KIT_PATH,
  demoRegion,
  loadReplySpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadReplySpec();

test.describe("On-brand Reply Review Queue public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "On-brand Reply Review Queue" }),
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
      page.locator("a[href*='/blueprints/ai-customer-response-assistant']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-customer-response-assistant']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain("/blueprints/ai-customer-response-assistant");
  });

  test("step 1 shows the FAQ, tone sheet, and message", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    await expect(demo).toContainText("color visits run 90 minutes");
    await expect(demo).toContainText("cancellations need 24 hours");
    await expect(demo).toContainText("we do not quote refunds by email");
    await expect(demo).toContainText("refund demand");
    await expect(demo).toContainText("injury");
    await expect(demo).toContainText("legal threat");
    await expect(demo).toContainText("warm, short, no slang");
    await expect(demo.getByText("R. Cole", { exact: true })).toBeVisible();
    await expect(demo.getByText("2026-10-27", { exact: true })).toBeVisible();
    await expect(demo).toContainText(
      "Can a color appointment be done in 45 minutes this Friday? Also I want my last visit refunded, the wait was too long.",
    );
    await expect(
      page.getByRole("heading", { name: "The FAQ, tone sheet, and message" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next step" })).toBeEnabled();
  });

  test("step 2 shows escalate rules first", async ({ page }) => {
    await openDemoStep(page, 2);
    await expect(stepLabel(page, 2)).toBeVisible();
    await expect(page.getByRole("heading", { name: "ESCALATE RULES FIRST" })).toBeVisible();
    const demo = demoRegion(page);
    await expect(demo.getByText("ESCALATE", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("REVIEW QUEUE (fictional) — 1 message");
    await expect(demo).toContainText("refund demand");
    await expect(demo).toContainText("I want my last visit refunded");
    await expect(demo.getByText("Do not draft a customer-facing reply about money.")).toBeVisible();
    await expect(demo.getByText("INTERNAL NOTE", { exact: true })).toBeVisible();
    await expect(demo).toContainText("refund request");
    await expect(demo).toContainText("timing question");
  });

  test("step 3 shows FAQ-only timing and labels", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    await expect(demo.getByText("CONFIRMED", { exact: true })).toBeVisible();
    await expect(demo).toContainText("45 minutes");
    await expect(demo).toContainText("this Friday");
    await expect(demo).toContainText("color");
    await expect(demo.getByText("FAQ FACT", { exact: true })).toBeVisible();
    await expect(demo).toContainText("90 minutes");
    const draft = page.getByRole("blockquote", { name: "Partial draft" });
    await expect(draft).toHaveText(
      "Color visits are booked for 90 minutes. I cannot confirm Friday from this message alone.",
    );
    expect((await draft.innerText())).not.toMatch(/refund|discount|\$/i);
    await expect(demo.getByText("NEEDS YOUR CHECK", { exact: true })).toBeVisible();
    await expect(demo).toContainText("Friday");
    await expect(demo).toContainText("not in the FAQ");
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("long wait");
    await expect(demo).toContainText("not independently verified");
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
  });

  test("step 4 checks facts against the FAQ", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(page.getByText("90 minutes")).toBeVisible();
    await page.getByRole("button", { name: "Check facts against the FAQ" }).click();
    const table = page.getByRole("table", { name: "Fact check against the FAQ" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("duration");
    await expect(rows.nth(0)).toContainText("90 minutes");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("escalate match");
    await expect(rows.nth(1)).toContainText("refund demand");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("refund policy");
    await expect(rows.nth(2)).toContainText("we do not quote refunds by email");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows missing answers stay labelled", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo.getByText("NEEDS YOUR CHECK", { exact: true })).toBeVisible();
    await expect(demo).toContainText("Friday");
    await expect(demo).toContainText("not in the FAQ");
    await expect(demo.getByText("Do not invent Friday availability.")).toBeVisible();
    await expect(demo.getByText("A long wait is not independently verified here.")).toBeVisible();
    await expect(
      demo.getByText(
        "A how-to-only message with no escalate match would get a FAQ draft, not an escalate stop.",
      ),
    ).toBeVisible();
  });

  test("step 6 says the person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(page.getByText("You send it. Nothing is sent automatically.")).toBeVisible();
    await expect(page.getByText("Do not send this draft.")).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "ESCALATE RULES FIRST" })).toBeFocused();
    const previous = page.getByRole("button", { name: "Previous step" });
    for (let tab = 0; tab < 6; tab += 1) {
      await page.keyboard.press("Shift+Tab");
      if (await previous.evaluate((element) => element === document.activeElement)) break;
    }
    await page.keyboard.press("Enter");
    await expect(stepLabel(page, 1)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The FAQ, tone sheet, and message" }),
    ).toBeFocused();
  });

  test("demo steps contain no price or savings claims", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
    await expect(page.getByText("$49", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in to purchase", exact: true })).toBeVisible();
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

test.describe("On-brand Reply Review Queue Japanese public demo", () => {
  test("Japanese demo uses the launch labels and approval before send", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { level: 1, name: "問い合わせ返信レビュー" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー", { exact: true })).toBeVisible();
    await expect(page.getByText("確認済み", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("要確認", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AIの解釈", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("推奨アクション", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("送信はあなたがします。自動では送りません。").first()).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    expect(robots).toContain("nofollow");
  });

  test("Japanese demo keeps the canonical message and links to the Japanese kit", async ({
    page,
  }) => {
    await page.goto(JA_DEMO_PATH);
    await expect(page.getByText("R. Cole").first()).toBeVisible();
    await expect(
      page.getByText(/Can a color appointment be done in 45 minutes this Friday/).first(),
    ).toBeVisible();
    const next = page.getByRole("button", { name: "次へ" });
    await expect(next).toBeEnabled();
    for (let step = 1; step < TOTAL_STEPS; step += 1) await next.click();
    await expect(page.getByText("ステップ 6 / 6", { exact: true })).toBeVisible();
    await expect(page.getByText("送信はあなたがします。自動では送りません。").first()).toBeVisible();
    await expect(page.getByText("この下書きは送らないでください。").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /プライベートプレビュー/ })).toHaveAttribute(
      "href",
      JA_KIT_PATH,
    );
  });

  test("Japanese demo does not scroll sideways", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const next = page.getByRole("button", { name: "次へ" });
    await expect(next).toBeEnabled();
    for (let step = 1; step <= TOTAL_STEPS; step += 1) {
      if (step > 1) await next.click();
      await expect(page.getByText(`ステップ ${step} / ${TOTAL_STEPS}`, { exact: true })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("logged-out Japanese kit access redirects to Japanese auth", async ({ page }) => {
    await page.goto(JA_KIT_PATH);
    await expect(page).toHaveURL(/\/ja\/auth\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/ja/auth");
    expect(url.searchParams.get("next")).toBe(JA_KIT_PATH);
  });
});
