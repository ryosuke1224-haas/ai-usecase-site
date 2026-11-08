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
  loadPayrollSpec,
  sampleScheduleCsv,
} from "./helpers";

const spec = loadPayrollSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Next-Pay Labor Check signed-in kit", () => {
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
        name: "Next-Pay Labor Check Premium Kit",
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

  test("labor check prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#labor-check-prompt");
    const pre = section.locator("pre");
    const required = [
      "NEXT-PAY LABOR CHECK",
      "CONFIRMED",
      "OWNER-ENTERED",
      "CALCULATED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "loaded payroll",
      "Do not invent",
      "Do not edit",
      "minimum coverage",
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

  test("variance prompt names the later-run rules", async ({ page }) => {
    const prompt = (await page.locator("#variance-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "only after",
      "actual",
      "projected",
      "variance",
      "Do not invent",
      "Do not edit",
      "You edit the schedule",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Employer load factor: 1.20.",
      "Target labor % of revenue: 40.",
      "Overtime multiplier: 1.5.",
      "Overtime flag rule: flag if any role has overtime hours > 0.",
      "Flag only against your target and overtime rule. Do not flag a single busy day.",
      "Do not invent rates or savings.",
      "Do not edit shifts or payroll. You edit the schedule in your own tool. The kit changes nothing.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Minimum coverage");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy" }),
    ).toBeVisible();
  });

  test("worksheet includes minimum coverage when provided", async ({ page }) => {
    await page
      .getByLabel("Minimum coverage by role (optional, one per line)")
      .fill("stylist: 2 on floor Sat");
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Minimum coverage: stylist: 2 on floor Sat.",
    );
  });

  test("worksheet requires a load factor greater than 0", async ({ page }) => {
    await page.getByLabel("Employer load factor").fill("");
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    await expect(page.getByText("Enter a load factor greater than 0.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Employer load factor").fill("0");
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    await expect(page.getByText("Enter a load factor greater than 0.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("worksheet requires a target labor percentage from 0 to 100", async ({
    page,
  }) => {
    await page.getByLabel("Target labor % of revenue").fill("");
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    await expect(
      page.getByText("Enter a target labor percentage from 0 to 100."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Target labor % of revenue").fill("101");
    await page.getByRole("button", { name: "Generate My Labor Check Rules" }).click();
    await expect(
      page.getByText("Enter a target labor percentage from 0 to 100."),
    ).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("workbook copies a CSV with visible formulas", async ({ page }) => {
    const section = page.locator("#workbook-template");
    for (const column of [
      "role",
      "scheduled_hours",
      "regular_hours",
      "overtime_hours",
      "hourly_rate",
      "regular_pay_formula",
      "overtime_pay_formula",
      "role_subtotal",
      "load_factor",
      "loaded_payroll",
      "revenue_figure",
      "labor_pct_formula",
      "labor_pct",
      "target_pct",
      "flag",
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
    expect(csv.split("\n")[0].startsWith("role,scheduled_hours")).toBe(true);
    const stylistRow = csv.split("\n").find((line) => line.startsWith("stylist,"));
    expect(stylistRow).toBeTruthy();
    expect(stylistRow).toContain("128");
    expect(stylistRow).toContain("=124*22");
    expect(stylistRow).toContain("2728");
    expect(stylistRow).toContain("=4*33");
    expect(stylistRow).toContain("132");
  });

  test("sample exports are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-exports");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleScheduleCsv(spec),
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
      has: page.getByRole("heading", { level: 2, name: "Next-Pay Labor Check" }),
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
    for (let tab = 0; tab < 120 && seen.size < 7; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy" ? "copy"
        : focus.label === "Employer load factor" ? "load"
        : focus.label === "Target labor % of revenue" ? "target"
        : focus.text.includes("Generate My Labor Check Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "generate", "load", "reset", "target", "toc"].sort(),
    );
  });
});

test.describe("Next-Pay Labor Check without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "Next-Pay Labor Check" }),
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
