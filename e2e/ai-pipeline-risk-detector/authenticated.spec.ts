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
  loadPipelineSpec,
  sampleDealExportCsv,
} from "./helpers";

const spec = loadPipelineSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Stalled Deal Rescue Queue signed-in kit", () => {
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
        name: "Stalled Deal Rescue Queue Premium Kit",
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

  test("stall queue prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#stall-queue-prompt");
    const pre = section.locator("pre");
    const required = [
      "SKIP RULES FIRST",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "days_in_stage",
      "last_activity",
      "next_step",
      "Do not invent",
      "Do not send",
      "Nothing is sent or written to the CRM",
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

  test("week-to-week outcome log prompt names the send rules", async ({ page }) => {
    const prompt = (await page.locator("#next-week-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "outcome log",
      "on_hold",
      "lost",
      "still_stalled",
      "Do not send",
      "Nothing is sent or written to the CRM",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await expect(page.getByLabel("Days in stage limit")).toHaveValue("14");
    await expect(page.getByLabel("Days since activity limit")).toHaveValue("14");
    await expect(page.getByLabel("Owner minimum amount (USD)")).toHaveValue("500");
    await expect(
      page.getByLabel("Statuses that are never chased (one per line)"),
    ).toHaveValue("closed-won\nclosed-lost\non-hold");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Skip closed-won, closed-lost, and on-hold.",
      "Skip amounts below $500.",
      "A deal is stalled when days_in_stage exceeds 14, or last_activity is older than 14 days before as_of, or next_step is blank.",
      "Rank stalled deals by amount, largest first.",
      "Recovery notes may use only deal name, amount, stage, and last activity date.",
      "Do not invent a contact, objection, or deadline.",
      "A stall flag does not prove the buyer lost interest.",
      "You send it. Nothing is sent or written to the CRM.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Always skip");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list a skip deal", async ({ page }) => {
    await page
      .getByLabel("Deals to always skip (one per line)")
      .fill("Harbor Lane discovery");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Always skip: Harbor Lane discovery",
    );
  });

  test("worksheet requires stall limits and a non-negative minimum", async ({ page }) => {
    await page.getByLabel("Days in stage limit").fill("");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.getByText("Enter a stall limit of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Days in stage limit").fill("14");
    await page.getByLabel("Days since activity limit").fill("0");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.getByText("Enter a stall limit of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Days since activity limit").fill("14");
    await page.getByLabel("Owner minimum amount (USD)").fill("");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Owner minimum amount (USD)").fill("   ");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Owner minimum amount (USD)").fill("-1");
    await page.getByRole("button", { name: "Generate My Stall Rules" }).click();
    await expect(page.getByText("Enter a minimum amount of 0 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("outcome log copies a CSV with the Harbor Lane row", async ({ page }) => {
    const section = page.locator("#outcome-log-template");
    for (const column of [
      "week_of",
      "deal",
      "amount",
      "action_taken",
      "outcome",
      "notes",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe(
      "week_of,deal,amount,action_taken,outcome,notes",
    );
    expect(csv).toContain("Harbor Lane discovery");
    expect(csv).toContain("2026-05-11");
    expect(csv).toContain("on_hold");
  });

  test("sample deal export is fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-deal-export");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleDealExportCsv(spec),
    );
  });

  test("review checklist counts and resets", async ({ page }) => {
    const section = page.locator("#recovery-review-checklist");
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
      has: page.getByRole("heading", { level: 2, name: "Stalled Deal Rescue Queue" }),
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
    for (let tab = 0; tab < 160 && seen.size < 10; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy rules" ? "copy"
        : focus.label === "Days in stage limit" ? "stage"
        : focus.label === "Days since activity limit" ? "activity"
        : focus.label === "Owner minimum amount (USD)" ? "minimum"
        : focus.label === "Statuses that are never chased (one per line)" ? "never"
        : focus.label === "Deals to always skip (one per line)" ? "skip"
        : focus.text.includes("Generate My Stall Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      [
        "activity",
        "checkbox",
        "copy",
        "generate",
        "minimum",
        "never",
        "reset",
        "skip",
        "stage",
        "toc",
      ].sort(),
    );
  });
});

test.describe("Stalled Deal Rescue Queue without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "Stalled Deal Rescue Queue" }),
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

