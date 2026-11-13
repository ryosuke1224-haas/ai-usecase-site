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
  loadStaffingSpec,
  sampleHourlyCsv,
} from "./helpers";

const spec = loadStaffingSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Shift Coverage vs Demand Check signed-in kit", () => {
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
        name: "Shift Coverage vs Demand Check Premium Kit",
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

  test("coverage check prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#coverage-check-prompt");
    const pre = section.locator("pre");
    const required = [
      "OWNER RULES FIRST",
      "CONFIRMED",
      "OWNER-ENTERED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "transactions per staff-hour",
      "3 of",
      "Do not invent",
      "Do not edit",
      "minimum",
      "You edit the schedule",
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

  test("re-check prompt names the later-run rules", async ({ page }) => {
    const prompt = (await page.locator("#recheck-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "re-check",
      "4 weeks",
      "target",
      "Do not invent",
      "Do not edit",
      "You edit the schedule",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Minimum staff on floor: 2.",
      "Target transactions per staff-hour: 15-25.",
      "Flag only when outside target in at least 3 of 4 weeks.",
      "Protected roles: keyholder.",
      "Do not invent transaction counts or savings.",
      "Do not edit schedules or contact staff. You edit the schedule in your own tool. The kit changes nothing.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Non-sales day-parts");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy" }),
    ).toBeVisible();
  });

  test("worksheet includes non-sales day-parts when provided", async ({ page }) => {
    await page
      .getByLabel("Non-sales day-parts (optional, one per line)")
      .fill("Tue 14:00-16:00 prep");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Non-sales day-parts: Tue 14:00-16:00 prep.",
    );
  });

  test("worksheet requires a minimum staff of 1 or more", async ({ page }) => {
    await page.getByLabel("Minimum staff on floor").fill("");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(page.getByText("Enter a minimum staff of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum staff on floor").fill("0");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(page.getByText("Enter a minimum staff of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Minimum staff on floor").fill("-1");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(page.getByText("Enter a minimum staff of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("worksheet requires a valid target range", async ({ page }) => {
    await page.getByLabel("Target transactions per staff-hour (low)").fill("");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(
      page.getByText("Enter a target range with low less than or equal to high."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Target transactions per staff-hour (low)").fill("30");
    await page.getByLabel("Target transactions per staff-hour (high)").fill("15");
    await page.getByRole("button", { name: "Generate My Staffing Rules" }).click();
    await expect(
      page.getByText("Enter a target range with low less than or equal to high."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("workbook copies a CSV with visible formulas", async ({ page }) => {
    const section = page.locator("#workbook-template");
    for (const column of [
      "day",
      "hour",
      "week1_tx",
      "week2_tx",
      "week3_tx",
      "week4_tx",
      "week1_staff",
      "week2_staff",
      "week3_staff",
      "week4_staff",
      "week1_tx_per_staff_formula",
      "week2_tx_per_staff_formula",
      "week3_tx_per_staff_formula",
      "week4_tx_per_staff_formula",
      "weeks_outside_target",
      "flag",
      "notes",
    ]) {
      await expect(
        section.getByRole("columnheader", { name: column, exact: true }),
      ).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      "\n",
    );
    expect(csv.split("\n")[0].startsWith("day,hour")).toBe(true);
    const tueRow = csv.split("\n").find((line) => line.startsWith("Tue,"));
    expect(tueRow).toBeTruthy();
    expect(tueRow).toContain("14:00");
    expect(tueRow).toContain("=12/4");
    expect(tueRow).toContain("3.0");
  });

  test("sample exports are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-exports");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleHourlyCsv(spec),
    );
  });

  test("review checklist counts and resets", async ({ page }) => {
    const section = page.locator("#schedule-review-checklist");
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
        name: "Shift Coverage vs Demand Check",
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
        : focus.label === "Minimum staff on floor" ? "minimum"
        : focus.label === "Target transactions per staff-hour (low)" ? "low"
        : focus.label === "Target transactions per staff-hour (high)" ? "high"
        : focus.label.includes("N of M weeks") ? "pattern"
        : focus.label === "Protected roles (one per line)" ? "roles"
        : focus.label === "Non-sales day-parts (optional, one per line)" ? "nonsales"
        : focus.text.includes("Generate My Staffing Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect(seen.has("toc")).toBe(true);
    expect(seen.has("copy")).toBe(true);
    expect(seen.has("minimum")).toBe(true);
    expect(seen.has("low")).toBe(true);
    expect(seen.has("high")).toBe(true);
    expect(seen.has("generate")).toBe(true);
    expect(seen.has("checkbox")).toBe(true);
    expect(seen.has("reset")).toBe(true);
  });
});

test.describe("Shift Coverage vs Demand Check without a premium entitlement", () => {
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
        name: "Shift Coverage vs Demand Check",
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
