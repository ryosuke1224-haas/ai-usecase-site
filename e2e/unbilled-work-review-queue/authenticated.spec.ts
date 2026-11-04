import { AUTH_SESSION_REFRESH_REQUIRED, inspectStorageState } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { expectNoHorizontalOverflow, openAuthenticated } from "../support/navigation";
import {
  E2E_ENTITLEMENT_HEADER,
  E2E_ENTITLEMENT_SECRET,
} from "../support/payments-e2e";
import {
  DEMO_PATH,
  describeFocus,
  expectSameClipboardText,
  FORBIDDEN_COPY,
  KIT_PATH,
  loadUnbilledSpec,
  sampleJobExportCsv,
} from "./helpers";

const spec = loadUnbilledSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Unbilled Work Review Queue signed-in kit", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({
      [E2E_ENTITLEMENT_HEADER]: E2E_ENTITLEMENT_SECRET,
    });
    await openAuthenticated(page, KIT_PATH);
  });

  test("kit loads with the private-preview label", async ({ page }) => {
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Unbilled Work Review Queue Premium Kit",
      }),
    ).toBeVisible();
    await expect(page.getByText("Premium · Private preview", { exact: true })).toBeVisible();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");
    await expect(
      page
        .getByText(
          "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.",
        )
        .first(),
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
      "SKIP RULES FIRST",
      "CONFIRMED",
      "NEEDS YOUR CHECK",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "invoice_id",
      "warranty",
      "oldest",
      "Do not invent",
      "Do not add tax",
      "Do not send",
      "Nothing is sent or collected",
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

  test("week-to-week billing log prompt names the send rules", async ({ page }) => {
    const prompt = (await page.locator("#next-week-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "billing log",
      "invoiced",
      "write-off",
      "hold",
      "invoice_id",
      "Do not send",
      "Nothing is sent or collected",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await expect(page.getByLabel("Minimum amount to bill (USD)")).toHaveValue("150");
    await expect(
      page.getByLabel("Statuses that are never billed (one per line)"),
    ).toHaveValue("warranty");
    await page.getByRole("button", { name: "Generate My Unbilled Skip Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Skip when invoice_id is present.",
      "Never bill statuses: warranty.",
      "Skip amounts below $150.",
      "Skip dates after the as-of date.",
      "Skip disputed jobs.",
      "Rank remaining rows by oldest completion date first.",
      "Invoice outline uses only customer, id, date, hours, rate, and amount from the export.",
      "Do not invent tax, terms, or line items.",
      "A blank invoice id is not proof the customer was never billed off-export.",
      "You create the invoice. Nothing is sent or collected.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Always skip");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list a skip customer and extra never-billed statuses", async ({
    page,
  }) => {
    await page
      .getByLabel("Jobs or customers to always skip (one per line)")
      .fill("Northgate Clinic");
    await page
      .getByLabel("Statuses that are never billed (one per line)")
      .fill("warranty\nwrite-off");
    await page.getByRole("button", { name: "Generate My Unbilled Skip Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("Always skip: Northgate Clinic");
    await expect(rules).toContainText("Never bill statuses: warranty; write-off.");
  });

  test("worksheet requires a minimum amount of 0 or more", async ({ page }) => {
    await page.getByLabel("Minimum amount to bill (USD)").fill("");
    await page.getByRole("button", { name: "Generate My Unbilled Skip Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum amount to bill (USD)").fill("   ");
    await page.getByRole("button", { name: "Generate My Unbilled Skip Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum amount to bill (USD)").fill("-1");
    await page.getByRole("button", { name: "Generate My Unbilled Skip Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("billing log copies a CSV with the J-88 row", async ({ page }) => {
    const section = page.locator("#billing-log-template");
    for (const column of [
      "week_of",
      "job",
      "customer",
      "action_taken",
      "outcome",
      "invoice_id",
      "notes",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe(
      "week_of,job,customer,action_taken,outcome,invoice_id,notes",
    );
    expect(csv).toContain("J-88");
    expect(csv).toContain("2026-05-11");
    expect(csv).toContain("Northgate Clinic");
    expect(csv).toContain("invoiced");
    expect(csv).toContain("INV-241");
  });

  test("sample job export is fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-job-export");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleJobExportCsv(spec),
    );
  });

  test("review checklist counts and resets", async ({ page }) => {
    const section = page.locator("#outline-review-checklist");
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
  });

  test("my blueprints unlocks this premium kit", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    const card = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { level: 2, name: "Unbilled Work Review Queue" }),
    });
    await expect(card.getByRole("link", { name: "Open Blueprint" })).toHaveAttribute("href", KIT_PATH);
    await expect(card.getByText("PREMIUM", { exact: true })).toBeVisible();
    await expect(card.getByText("Unlocked", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Starter Kit" })).toHaveAttribute(
      "href",
      "/blueprints/daily-inbox-briefing/starter-kit",
    );
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
    for (let tab = 0; tab < 120 && seen.size < 8; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy rules" ? "copy"
        : focus.label === "Minimum amount to bill (USD)" ? "minimum"
        : focus.label === "Statuses that are never billed (one per line)" ? "never"
        : focus.label === "Jobs or customers to always skip (one per line)" ? "skip"
        : focus.text.includes("Generate My Unbilled Skip Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "generate", "minimum", "never", "reset", "skip", "toc"].sort(),
    );
  });
});

test.describe("Unbilled Work Review Queue without a premium entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in kit stays locked", async ({ page }) => {
    await openAuthenticated(page, KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premium is locked" })).toBeVisible();
    await expect(page.getByText(/currently no checkout/i)).toBeVisible();
    await expect(page.getByText(/Access is granted by entitlement/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
  });

  test("my blueprints keeps this premium kit locked", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    const card = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { level: 2, name: "Unbilled Work Review Queue" }),
    });
    await expect(card.getByRole("link", { name: "Private preview" })).toHaveAttribute(
      "href",
      DEMO_PATH,
    );
    await expect(card.locator(`a[href='${KIT_PATH}']`)).toHaveCount(0);
    await expect(card.getByText("Locked", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Starter Kit" })).toHaveAttribute(
      "href",
      "/blueprints/daily-inbox-briefing/starter-kit",
    );
  });
});

