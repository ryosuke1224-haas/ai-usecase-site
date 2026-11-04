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
  loadQuoteSpec,
} from "./helpers";

const spec = loadQuoteSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Quote Request Assistant signed-in kit", () => {
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
        name: "Quote Request Assistant Premium Kit",
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

  test("scope extraction prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#extraction-prompt");
    const pre = section.locator("pre");
    const required = [
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "Do not invent",
      "Do not send",
      "Do not price",
      "Do not add a tracker row",
      "maybe 300",
      "Never put prices",
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

  test("fit review prompt names the fit rules", async ({ page }) => {
    const prompt = (await page.locator("#fit-review-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "Apply the qualification rules before any FIT label",
      "FIT YES",
      "FIT NO",
      "NEEDS YOUR CHECK",
      "Do not mark FIT NO",
      "Do not send",
      "Do not price",
      "You price it",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Qualification Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Service area: Riverside.",
      "Minimum size: 150 sq ft.",
      "Offered: deck replacement (wood or composite); railings.",
      "Out of scope: roofing.",
      "Never put prices, cost bands, markups, or supplier names in a draft.",
      "Apply these rules before any FIT label.",
      "If location is missing, write NEEDS YOUR CHECK. Do not assume the service area.",
      "If work is close but not in the catalog, write NEEDS YOUR CHECK. Do not mark FIT NO.",
      "Do not send, price, or add a tracker row.",
    ]) {
      expect(text).toContain(phrase);
    }
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list two out-of-scope lines", async ({ page }) => {
    await page
      .getByLabel("Work that is out of scope (one per line)")
      .fill("roofing\nnew-home construction");
    await page.getByRole("button", { name: "Generate My Qualification Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Out of scope: roofing; new-home construction.",
    );
  });

  test("worksheet requires a service area and a minimum size", async ({ page }) => {
    await page.getByLabel("Service area").fill("   ");
    await page.getByRole("button", { name: "Generate My Qualification Rules" }).click();
    await expect(page.getByText("Enter a service area.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Service area").fill("Riverside");
    await page.getByLabel("Minimum project size (sq ft)").fill("   ");
    await page.getByRole("button", { name: "Generate My Qualification Rules" }).click();
    await expect(page.getByText("Enter a minimum project size.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("tracker copies a CSV with the QR-1001 row", async ({ page }) => {
    const section = page.locator("#tracker-template");
    for (const column of [
      "request_id",
      "received",
      "requester",
      "location",
      "work_type",
      "size_sq_ft",
      "material",
      "timeline",
      "fit",
      "open_questions",
      "status",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe(
      "request_id,received,requester,location,work_type,size_sq_ft,material,timeline,fit,open_questions,status",
    );
    expect(csv).toContain("QR-1001");
    expect(csv).toContain("2026-05-12");
    expect(csv).toContain("Jordan Hale");
    expect(csv).toContain("Riverside");
    expect(csv).toContain("deck replacement");
    expect(csv).toContain("300");
    expect(csv).toContain("YES");
    expect(csv).toContain("needs pricing");
  });

  test("sample requests are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-request");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy text" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("Need our back deck redone, maybe 300 sq ft");
    expect(copied).toMatch(/roof/i);
    expect(copied).toContain("Mesa");
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
      has: page.getByRole("heading", { level: 2, name: "Quote Request Assistant" }),
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
    for (let tab = 0; tab < 90 && seen.size < 7; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy rules" || focus.text === "Copy text" ? "copy"
        : focus.label === "Service area" ? "service"
        : focus.label.startsWith("Minimum project size") ? "size"
        : focus.text.includes("Generate My Qualification Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "generate", "reset", "service", "size", "toc"].sort(),
    );
  });
});

test.describe("Quote Request Assistant without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "Quote Request Assistant" }),
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

