import { expect, test } from "../support/fixtures";
import { expectAuthNext, expectNoHorizontalOverflow } from "../support/navigation";
import {
  DEMO_PATH,
  FORBIDDEN_COPY,
  JA_DEMO_PATH,
  JA_KIT_PATH,
  KIT_PATH,
  demoRegion,
  loadProposalSpec,
  openDemoStep,
  stepLabel,
  TOTAL_STEPS,
} from "./helpers";

const spec = loadProposalSpec();

test.describe("Quiet Proposal Chase Queue public demo", () => {
  test("demo loads logged out", async ({ page }) => {
    await page.goto(DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Quiet Proposal Chase Queue" }),
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
      page.locator("a[href*='/blueprints/ai-proposal-follow-up-assistant']"),
    ).toHaveCount(0);
    await expect(
      page.locator("header a[href*='/blueprints/ai-proposal-follow-up-assistant']"),
    ).toHaveCount(0);
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).not.toContain(
      "/blueprints/ai-proposal-follow-up-assistant",
    );
  });

  test("step 1 shows the proposal export table", async ({ page }) => {
    await page.goto(DEMO_PATH);
    const demo = demoRegion(page);
    const proposals = page.getByRole("table", { name: "Sent proposals" });
    await expect(proposals.locator("tbody tr")).toHaveCount(4);
    await expect(proposals).toContainText("P-441");
    await expect(proposals).toContainText("Northgate Clinic");
    await expect(proposals).toContainText("P-448");
    await expect(proposals).toContainText("Pell & Co");
    await expect(proposals).toContainText("P-430");
    await expect(proposals).toContainText("Harbor Lane");
    await expect(proposals).toContainText("P-452");
    await expect(proposals).toContainText("Birchwood");
    await expect(demo.getByText("2026-05-18", { exact: true })).toBeVisible();
    await expect(demo.getByText("2026-05-13", { exact: true })).toBeVisible();
    await expect(demo.getByText("$1,000", { exact: true })).toBeVisible();
    await expect(demo).toContainText("recap");
    await expect(demo).toContainText("check-in");
    await expect(demo).toContainText("close-the-loop");
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
    await expect(demo).toContainText("P-448");
    await expect(demo).toContainText("2026-05-16");
    await expect(demo).toContainText("silence");
    await expect(demo).toContainText("P-430");
    await expect(demo).toContainText("declined");
    await expect(demo).toContainText("P-452");
    await expect(demo).toContainText("$400");
    await expect(demo).toContainText("$1,000");
  });

  test("step 3 shows the ranked queue and labels", async ({ page }) => {
    await openDemoStep(page, 3);
    const demo = demoRegion(page);
    const queue = page.getByRole("table", { name: "Ranked silence queue" });
    await expect(queue.locator("tbody tr")).toHaveCount(1);
    await expect(queue.locator("tbody tr").nth(0)).toContainText("P-441");
    await expect(queue.locator("tbody tr").nth(0)).toContainText("Northgate Clinic");
    await expect(demo.getByText("CONFIRMED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText("P-441");
    await expect(demo).toContainText("Northgate Clinic");
    await expect(demo).toContainText("$8,400");
    await expect(demo).toContainText("2026-04-27");
    await expect(demo).toContainText("21");
    await expect(demo).toContainText("website rebuild");
    await expect(demo).toContainText("close-the-loop");
    await expect(demo).toContainText(
      "Following up on proposal P-441 for $8,400 (website rebuild) sent April 27. Should we keep this open or close it out?",
    );
    await expect(demo).toContainText(
      "Do not invent an objection, a competitor, or a deadline.",
    );
    await expect(demo.getByText("AI INTERPRETATION", { exact: true })).toBeVisible();
    await expect(demo.getByText("RECOMMENDED ACTION", { exact: true })).toBeVisible();
    await expect(demo).toContainText("silence does not prove");
  });

  test("step 4 checks numbers against the export row", async ({ page }) => {
    await openDemoStep(page, 4);
    await expect(
      page.getByText(
        "Following up on proposal P-441 for $8,400 (website rebuild) sent April 27. Should we keep this open or close it out?",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Check numbers against the export row" }).click();
    const table = page.getByRole("table", { name: "Number check against the export row" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toContainText("proposal id");
    await expect(rows.nth(0)).toContainText("P-441");
    await expect(rows.nth(0)).toContainText("Matches");
    await expect(rows.nth(1)).toContainText("amount");
    await expect(rows.nth(1)).toContainText("$8,400");
    await expect(rows.nth(1)).toContainText("8400");
    await expect(rows.nth(1)).toContainText("Matches");
    await expect(rows.nth(2)).toContainText("line item");
    await expect(rows.nth(2)).toContainText("website rebuild");
    await expect(rows.nth(2)).toContainText("Matches");
  });

  test("step 5 shows next week's outcome log", async ({ page }) => {
    await openDemoStep(page, 5);
    const demo = demoRegion(page);
    await expect(demo).toContainText("P-441");
    await expect(demo).toContainText("still_silent");
    await expect(demo).toContainText("P-430");
    await expect(demo).toContainText("declined");
    await expect(demo).toContainText("2026-05-25");
    await expect(demo.getByText("SKIPPED", { exact: true }).first()).toBeVisible();
    await expect(demo).toContainText(
      "Logged declined proposals are not chased again.",
    );
  });

  test("step 6 says the person sends it", async ({ page }) => {
    await openDemoStep(page, 6);
    await expect(
      page.getByText("You send it. Nothing is sent automatically."),
    ).toBeVisible();
    await expect(
      page.getByText("Do not invent an objection, a competitor, or a deadline."),
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

test.describe("Quiet Proposal Chase Queue Japanese public demo", () => {
  test("Japanese demo uses the launch labels and human-send boundary", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { level: 1, name: "提案フォローの下書き" })).toBeVisible();
    await expect(page.getByText("プライベートプレビュー", { exact: true })).toBeVisible();
    await expect(page.getByText("確認済み", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("AIの解釈", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("推奨アクション", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("対象外", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("自動では送信しません。").first()).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    expect(robots).toContain("nofollow");
  });

  test("Japanese demo keeps the canonical rows and links to the Japanese kit", async ({ page }) => {
    await page.goto(JA_DEMO_PATH);
    const table = page.getByRole("table", { name: "送付済み提案" });
    await expect(table.locator("tbody tr")).toHaveCount(4);
    await expect(table.getByText("Northgate Clinic", { exact: true }).first()).toBeVisible();
    const next = page.getByRole("button", { name: "次へ" });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText("ステップ 2 / 6", { exact: true })).toBeVisible();
    await expect(page.getByText("先にスキップルール").first()).toBeVisible();
    for (let step = 2; step < TOTAL_STEPS; step += 1) await next.click();
    await expect(page.getByText("ステップ 6 / 6", { exact: true })).toBeVisible();
    await expect(page.getByText("送るのはあなたです。自動では送信しません。").first()).toBeVisible();
    await expect(page.getByText("異議、競合名、期限は作らないでください。").first()).toBeVisible();
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

