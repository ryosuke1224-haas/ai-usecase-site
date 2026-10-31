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
  loadReadinessSpec,
  sampleInventoryCsv,
} from "./helpers";

const spec = loadReadinessSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("Security Readiness Action Pack signed-in kit", () => {
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
        name: "Security Readiness Action Pack Premium Kit",
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
      "SKIPPED",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "Apply the skip rules before ranking",
      "Do not scan",
      "Do not certify",
      "Do not change passwords",
      "Do not disable accounts",
      "former staff",
      "This does not certify the company as secure",
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

  test("quarter-to-quarter prompt names the closure log", async ({ page }) => {
    const prompt = (await page.locator("#next-quarter-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "closure log",
      "closed",
      "still open",
      "former staff",
      "Do not scan",
      "Do not certify",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await page.getByRole("button", { name: "Generate My Readiness Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Skip personal-only accounts (holds customer or money data = no).",
      "HIGH: former staff still listed.",
      "HIGH: MFA off on an account that holds customer or money data.",
      "HIGH: backup restore never tested on an account that holds customer or money data.",
      "MEDIUM: shared login on an admin account.",
      "Never label the business secure, compliant, or certified.",
      "Do not scan, connect, change passwords, or disable accounts.",
      "Pick at most 5 actions this quarter.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Always skip");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can always-skip an account", async ({ page }) => {
    await page
      .getByLabel("Accounts to mark out of scope (one per line)")
      .fill("Owner personal streaming");
    await page.getByRole("button", { name: "Generate My Readiness Rules" }).click();
    await expect(page.locator("#rules-worksheet pre")).toContainText(
      "Always skip: Owner personal streaming",
    );
  });

  test("worksheet requires at least one HIGH rule", async ({ page }) => {
    await page.getByLabel("HIGH: former staff still listed").uncheck();
    await page.getByLabel("HIGH: MFA off on customer-or-money data").uncheck();
    await page.getByLabel("HIGH: restore never tested on customer-or-money data").uncheck();
    await page.getByRole("button", { name: "Generate My Readiness Rules" }).click();
    await expect(page.getByText("Turn on at least one HIGH rule.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("closure log copies a CSV header", async ({ page }) => {
    const section = page.locator("#closure-log-template");
    const allowed = section.getByRole("list", { name: "Allowed outcomes" });
    for (const outcome of ["closed", "still open", "skipped", "deferred"]) {
      await expect(allowed.getByText(outcome, { exact: true })).toBeVisible();
    }
    for (const column of [
      "quarter_of",
      "account",
      "named_owner",
      "action_taken",
      "outcome",
      "check_date",
      "notes",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = await page.evaluate(() => navigator.clipboard.readText());
    expect(csv.replace(/\r\n/g, "\n").trim()).toBe(
      "quarter_of,account,named_owner,action_taken,outcome,check_date,notes",
    );
  });

  test("sample inventory is fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-inventory");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleInventoryCsv(spec),
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
      has: page.getByRole("heading", { level: 2, name: "Security Readiness Action Pack" }),
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
    for (let tab = 0; tab < 90 && seen.size < 6; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" ? "copy"
        : focus.label.startsWith("Accounts to mark out of scope") ? "skip"
        : focus.text.includes("Generate My Readiness Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "generate", "reset", "skip", "toc"].sort(),
    );
  });
});

test.describe("Security Readiness Action Pack without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "Security Readiness Action Pack" }),
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
