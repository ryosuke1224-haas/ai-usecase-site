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
  loadWinbackSpec,
  sampleCustomersCsv,
} from "./helpers";

const spec = loadWinbackSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Lapsed Customer Return Queue signed-in kit", () => {
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
        name: "Lapsed Customer Return Queue Premium Kit",
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

  test("kit lists the nine resources", async ({ page }) => {
    for (const section of spec.kit_contents) {
      const region = page.locator(`#${section.id}`);
      await expect(region).toBeVisible();
      await expect(
        region.getByRole("heading", { level: 2, name: section.title }),
      ).toBeVisible();
      await expect(page.locator(`a[href="#${section.id}"]`)).toBeVisible();
    }
    await expect(page.locator("section[id]")).toHaveCount(9);
  });

  test("kit contains no price or checkout", async ({ page }) => {
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(FORBIDDEN_COPY);
    await expect(page.locator("form[action*='pay'], form[action*='checkout']")).toHaveCount(0);
  });

  test("skip-rules prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#skip-rules-prompt");
    const pre = section.locator("pre");
    const required = [
      "SKIP RULES FIRST",
      "marketing_consent",
      "do_not_contact",
      "already contacted",
      "Do not queue someone whose last visit is after your lapse date",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "Do not invent",
      "Do not send",
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

  test("draft prompt names the VIP-first rules", async ({ page }) => {
    const prompt = (await page.locator("#draft-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "only after",
      "skip",
      "VIP",
      "occasional",
      "written offer",
      "Do not invent",
      "Do not send",
      "You send it",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("return check prompt names return outcomes", async ({ page }) => {
    const prompt = (await page.locator("#return-check-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "RETURNED",
      "still lapsed",
      "A return is not proof the message caused it",
      "Do not invent",
      "contact log",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await expect(page.getByLabel("Lapse if last visit before")).toHaveValue("2026-04-16");
    await expect(
      page.getByLabel("VIP if visits in 12 months at least"),
    ).toHaveValue("8");
    await expect(page.getByLabel("Skip one-time buyers")).toBeChecked();
    await expect(page.getByLabel("VIP offers (one per line)")).toHaveValue(
      "10% off next color",
    );
    await expect(page.getByLabel("Occasional offers (one per line)")).toHaveValue(
      "complimentary consult",
    );
    await page.getByRole("button", { name: "Generate My Winback Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Apply SKIP RULES FIRST before any draft.",
      "Skip when marketing_consent is no or missing.",
      "Skip when do_not_contact is yes.",
      "Skip when already contacted this period.",
      "Lapse if last visit before 2026-04-16.",
      "VIP if visits_12mo >= 8.",
      "Skip one-time buyers.",
      "VIP offers: 10% off next color.",
      "Occasional offers: complimentary consult.",
      "Do not send. You send it. Nothing is sent automatically.",
    ]) {
      expect(text).toContain(phrase);
    }
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy" }),
    ).toBeVisible();
  });

  test("worksheet formats custom occasional offers", async ({ page }) => {
    await page.getByLabel("VIP offers (one per line)").fill("10% off next color");
    await page
      .getByLabel("Occasional offers (one per line)")
      .fill("complimentary consult\nfree add-on");
    await page.getByRole("button", { name: "Generate My Winback Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("VIP offers: 10% off next color.");
    await expect(rules).toContainText(
      "Occasional offers: complimentary consult; free add-on.",
    );
  });

  test("worksheet validates lapse date, VIP floor, and offers", async ({ page }) => {
    await page.getByLabel("Lapse if last visit before").fill("   ");
    await page.getByRole("button", { name: "Generate My Winback Rules" }).click();
    await expect(page.getByText("Enter a lapse threshold date.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Lapse if last visit before").fill("2026-04-16");
    await page.getByLabel("VIP if visits in 12 months at least").fill("0");
    await page.getByRole("button", { name: "Generate My Winback Rules" }).click();
    await expect(
      page.getByText("Enter a VIP visit floor of 1 or more."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("VIP if visits in 12 months at least").fill("8");
    await page.getByLabel("VIP offers (one per line)").fill("   ");
    await page.getByLabel("Occasional offers (one per line)").fill("");
    await page.getByRole("button", { name: "Generate My Winback Rules" }).click();
    await expect(
      page.getByText("Enter at least one offer on your written offer list."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("contact log copies a CSV with the J. Rivera row", async ({ page }) => {
    const section = page.locator("#contact-log-template");
    for (const column of [
      "as_of",
      "first",
      "last_visit",
      "last_service",
      "visits_12mo",
      "segment",
      "offer_used",
      "action",
      "outcome",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      "\n",
    );
    expect(csv.split("\n")[0]).toBe(
      "as_of,first,last_visit,last_service,visits_12mo,segment,offer_used,action,outcome",
    );
    expect(csv).toContain("J. Rivera");
    expect(csv).toContain("2026-06-15");
    expect(csv).toContain("Cut & color");
    expect(csv).toContain("VIP");
    expect(csv.includes("drafted_not_sent") || csv.includes("returned")).toBe(true);
  });

  test("sample customers are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-customers");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleCustomersCsv(spec),
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
      has: page.getByRole("heading", {
        level: 2,
        name: "Lapsed Customer Return Queue",
      }),
    });
    await expect(card.getByRole("link", { name: "Open Blueprint" })).toHaveAttribute(
      "href",
      KIT_PATH,
    );
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
    for (let tab = 0; tab < 160 && seen.size < 9; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy" ? "copy"
        : focus.label === "Lapse if last visit before" ? "lapse"
        : focus.label === "VIP if visits in 12 months at least" ? "vip"
        : focus.label.includes("Skip one-time buyers") ? "skip"
        : focus.label === "VIP offers (one per line)" ? "vipOffers"
        : focus.label === "Occasional offers (one per line)" ? "occasional"
        : focus.text.includes("Generate My Winback Rules") ? "generate"
        : focus.type === "checkbox" && !focus.label.includes("Skip one-time") ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect(seen.has("toc")).toBe(true);
    expect(seen.has("copy")).toBe(true);
    expect(seen.has("lapse")).toBe(true);
    expect(seen.has("vip")).toBe(true);
    expect(seen.has("skip")).toBe(true);
    expect(seen.has("vipOffers")).toBe(true);
    expect(seen.has("occasional")).toBe(true);
    expect(seen.has("generate")).toBe(true);
    expect(seen.has("checkbox") || seen.has("reset")).toBe(true);
  });
});

test.describe("Lapsed Customer Return Queue without a premium entitlement", () => {
  test.beforeEach(async ({ page }) => {
    requireStoredSession();
    await page.setExtraHTTPHeaders({ [E2E_ENTITLEMENT_HEADER]: "deny" });
  });

  test("signed-in kit stays locked", async ({ page }) => {
    await openAuthenticated(page, KIT_PATH);
    await expect(page.getByRole("heading", { name: "Premium is locked" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buy Premium" })).toHaveCount(0);
    await expect(page.locator("#setup-checklist")).toHaveCount(0);
  });

  test("my blueprints keeps this premium kit locked", async ({ page }) => {
    await openAuthenticated(page, "/my-blueprints");
    const card = page.getByRole("listitem").filter({
      has: page.getByRole("heading", {
        level: 2,
        name: "Lapsed Customer Return Queue",
      }),
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
