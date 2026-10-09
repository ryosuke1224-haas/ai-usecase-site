import { authSkipReason } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow, openAuthenticated } from "../support/navigation";
import {
  describeFocus,
  expectSameClipboardText,
  FORBIDDEN_COPY,
  KIT_PATH,
  loadCollectionsSpec,
  sampleAgingCsv,
} from "./helpers";

const spec = loadCollectionsSpec();
const skipReason = authSkipReason();

test.describe("AI Collections Assistant signed-in kit", () => {
  test.skip(Boolean(skipReason), skipReason ?? "");

  test.beforeEach(async ({ page }) => {
    await openAuthenticated(page, KIT_PATH);
  });

  test("kit loads with the private-preview label", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Collections Assistant Premium Kit" }),
    ).toBeVisible();
    await expect(page.getByText("Premium · Private preview", { exact: true })).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aiusecaseatlas.com/blueprints/ai-collections-assistant/kit",
    );
    await expect(
      page.getByText("Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.").first(),
    ).toBeVisible();
  });

  test("kit lists the eight resources", async ({ page }) => {
    for (const section of spec.kit_contents) {
      const region = page.locator(`#${section.id}`);
      await expect(region).toBeVisible();
      await expect(
        region.getByRole("heading", { level: 2, name: section.title }),
      ).toBeVisible();
      await expect(page.locator(`a[href="#${section.id}"]`)).toBeVisible();
    }
    await expect(page.locator("section[id]")).toHaveCount(8);
  });

  test("kit contains no price or checkout", async ({ page }) => {
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(FORBIDDEN_COPY);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
  });

  test("queue prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#queue-prompt");
    const pre = section.locator("pre");
    const required = [
      "SKIPPED",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "Apply the skip rules before ranking",
      "Use only the invoice number, amount, and due date",
      "Do not send",
      "Never threaten legal action",
      "Do not invent",
    ];
    const prompt = (await pre.textContent()) ?? "";
    for (const phrase of required) expect(prompt).toContain(phrase);
    await section.getByRole("button", { name: "Copy Prompt" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      prompt,
    );
  });

  test("week-to-week prompt names the outcome log", async ({ page }) => {
    const prompt = (await page.locator("#next-week-prompt pre").textContent()) ?? "";
    for (const phrase of ["outcome log", "promised", "disputed", "missed", "Do not send"]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Skip invoices under $150",
      "Friendly: 1-14 days",
      "Firm: 15-44 days",
      "Phone call recommended: 45+ days",
      "Never threaten legal action.",
      "Do not send anything.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Always skip");
    await expect(page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" })).toBeVisible();
  });

  test("worksheet can always-skip a customer", async ({ page }) => {
    await page.getByLabel("Customers to always skip (one per line)").fill("Cedar Row Vet");
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText("Always skip: Cedar Row Vet");
  });

  test("worksheet rejects an inverted ladder and an empty minimum", async ({ page }) => {
    await page.getByLabel("Friendly tone up to (days overdue)").fill("44");
    await page.getByLabel("Firm tone up to (days overdue)").fill("44");
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    await expect(page.getByText("Friendly limit must be lower than the firm limit.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum amount to chase (USD)").fill("");
    await page.getByLabel("Friendly tone up to (days overdue)").fill("14");
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("worksheet clears a rules block when the inputs change", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toBeVisible();
    await page.getByLabel("Minimum amount to chase (USD)").fill("200");
    await expect(page.getByText("Inputs changed. Generate again before you copy the rules.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
    await page.getByRole("button", { name: "Generate My Collections Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText("Skip invoices under $200");
  });

  test("outcome log copies a CSV header", async ({ page }) => {
    const section = page.locator("#outcome-log-template");
    const allowed = section.getByRole("list", { name: "Allowed outcomes" });
    for (const outcome of ["paid", "promised", "disputed", "payment plan", "no reply"]) {
      await expect(allowed.getByText(outcome, { exact: true })).toBeVisible();
    }
    for (const column of [
      "week_of",
      "invoice",
      "customer",
      "action_taken",
      "outcome",
      "promised_date",
      "notes",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = await page.evaluate(() => navigator.clipboard.readText());
    expect(csv.replace(/\r\n/g, "\n").trim()).toBe(
      "week_of,invoice,customer,action_taken,outcome,promised_date,notes",
    );
    expect(csv).not.toMatch(/INV-/);
  });

  test("sample aging report is fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-aging-report");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleAgingCsv(spec),
    );
  });

  test("review checklist counts and resets", async ({ page }) => {
    const section = page.locator("#draft-review-checklist");
    const boxes = section.getByRole("checkbox");
    await expect(boxes).toHaveCount(9);
    await expect(boxes.first()).toBeEnabled();
    await boxes.first().focus();
    await page.keyboard.press("Space");
    await expect(section.getByText("Checked 1 of 9")).toBeVisible();
    await section.getByRole("button", { name: "Reset checklist" }).click();
    await expect(section.getByText("Checked 0 of 9")).toBeVisible();
  });

  test("setup and safety name plan differences", async ({ page }) => {
    const notice =
      "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";
    await expect(page.locator("#setup-checklist")).toContainText(notice);
    await expect(page.locator("#safety-guidance")).toContainText(notice);
    const setup = page.locator("#setup-checklist");
    await expect(setup).toContainText("invoice, customer, amount, and due_date");
    await expect(setup).toContainText("A simple export with those four columns is enough to start.");
    await expect(setup).toContainText("If those columns are missing, leave them blank.");
    await expect(setup).toContainText("Do not invent a dispute, a promise, or a payment status.");
  });

  test("my blueprints does not link to this kit", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    await expect(
      page.locator("a[href*='/blueprints/ai-collections-assistant']"),
    ).toHaveCount(0);
  });

  test("kit does not scroll sideways at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await openAuthenticated(page, KIT_PATH);
    for (const section of spec.kit_contents) {
      await page.locator(`#${section.id}`).scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("kit controls are reachable from the keyboard", async ({ page }) => {
    const seen = new Set<string>();
    for (let tab = 0; tab < 90 && seen.size < 9; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" ? "copy"
        : focus.label.startsWith("Minimum amount") ? "minimum"
        : focus.label.startsWith("Friendly tone") ? "friendly"
        : focus.label.startsWith("Firm tone") ? "firm"
        : focus.label.startsWith("Customers to always skip") ? "skip"
        : focus.text.includes("Generate My Collections Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "firm", "friendly", "generate", "minimum", "reset", "skip", "toc"].sort(),
    );
  });
});
