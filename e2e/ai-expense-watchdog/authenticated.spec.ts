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
  loadExpenseSpec,
  sampleExportsCsv,
} from "./helpers";

const spec = loadExpenseSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("AI Expense Watchdog signed-in kit", () => {
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
        name: "AI Expense Watchdog Premium Kit",
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

  test("recurring ledger prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#ledger-prompt");
    const pre = section.locator("pre");
    const required = [
      "RECURRING LEDGER FIRST",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "two months",
      "Do not cancel",
      "Do not invent",
      "Do not claim savings",
      "unused",
      "You cancel it",
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

  test("price change and overlap prompt names the later-run rules", async ({ page }) => {
    const prompt = (await page.locator("#increase-review-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "only after",
      "ledger",
      "price change",
      "overlap",
      "not a savings figure",
      "Do not cancel",
      "Do not invent",
      "You cancel it",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Expense Review Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Always keep: ZoomMeet.",
      "Watch for overlap in: design tools.",
      "List a price change only when the later amount minus the earlier amount is 5.00 or more.",
      "Group a vendor as recurring only when it appears in at least two months.",
      "One-time charges are not subscriptions.",
      "Do not invent savings.",
      "Do not cancel. You cancel it. The kit changes nothing.",
    ]) {
      expect(text).toContain(phrase);
    }
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list two keep-list vendors", async ({ page }) => {
    await page
      .getByLabel("Essential vendors to never flag for cancel (one per line)")
      .fill("ZoomMeet\nHarbor Office Supply");
    await page.getByRole("button", { name: "Generate My Expense Review Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Always keep: ZoomMeet; Harbor Office Supply.",
    );
  });

  test("worksheet omits Always keep when essential vendors are empty", async ({ page }) => {
    await page
      .getByLabel("Essential vendors to never flag for cancel (one per line)")
      .fill("");
    await page.getByRole("button", { name: "Generate My Expense Review Rules" }).click();
    const text = (await page.locator("#rules-worksheet pre").textContent()) ?? "";
    expect(text).not.toContain("Always keep");
  });

  test("worksheet requires a minimum amount of 0 or more", async ({ page }) => {
    await page.getByLabel("Minimum amount to list as a price change (USD)").fill("");
    await page.getByRole("button", { name: "Generate My Expense Review Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum amount to list as a price change (USD)").fill("-1");
    await page.getByRole("button", { name: "Generate My Expense Review Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("ledger copies a CSV with visible formulas", async ({ page }) => {
    const section = page.locator("#ledger-template");
    for (const column of [
      "vendor",
      "jul",
      "aug",
      "sep",
      "cadence",
      "change_formula",
      "change_result",
      "keep_list",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe(
      "vendor,jul,aug,sep,cadence,change_formula,change_result,keep_list",
    );
    expect(csv).toContain("DesignHub Pro");
    expect(csv).toContain("29.00");
    expect(csv).toContain("39.00");
    expect(csv).toContain("=39.00-29.00");
    expect(csv).toContain("10.00");
  });

  test("sample exports are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-exports");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleExportsCsv(spec),
    );
  });

  test("review checklist counts and resets", async ({ page }) => {
    const section = page.locator("#action-review-checklist");
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
      has: page.getByRole("heading", { level: 2, name: "AI Expense Watchdog" }),
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
    for (let tab = 0; tab < 100 && seen.size < 8; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy rules" ? "copy"
        : focus.label.startsWith("Essential vendors") ? "essential"
        : focus.label.startsWith("Overlap-watch") ? "overlap"
        : focus.label.startsWith("Minimum amount") ? "minimum"
        : focus.text.includes("Generate My Expense Review Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "essential", "generate", "minimum", "overlap", "reset", "toc"].sort(),
    );
  });
});

test.describe("AI Expense Watchdog without a premium entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in kit stays locked", async ({ page }) => {
    await openAuthenticated(page, KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premium is locked" })).toBeVisible();
    await expect(page.getByText(/One-time purchase is on the guided demo/i)).toBeVisible();
    await expect(page.getByText(/Access is granted by entitlement/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
  });

  test("my blueprints keeps this premium kit locked", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    const card = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { level: 2, name: "AI Expense Watchdog" }),
    });
    await expect(card.getByRole("link", { name: "Available to purchase" })).toHaveAttribute(
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

