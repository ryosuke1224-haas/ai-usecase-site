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
  loadNoShowSpec,
  sampleBookingsCsv,
} from "./helpers";

const spec = loadNoShowSpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("No-show Recovery Assistant signed-in kit", () => {
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
        name: "No-show Recovery Assistant Premium Kit",
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

  test("attendance prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#attendance-prompt");
    const pre = section.locator("pre");
    const required = [
      "CONFIRM ATTENDANCE FIRST",
      "CONFIRMED",
      "AI INTERPRETATION",
      "RECOMMENDED ACTION",
      "attended",
      "cancelled",
      "Do not message someone who attended",
      "Do not invent",
      "Do not send",
      "Confirm consent before any message",
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

  test("rebooking draft prompt names the send rules", async ({ page }) => {
    const prompt = (await page.locator("#rebooking-draft-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "only after",
      "attendance",
      "sms_consent",
      "open slots",
      "match the missed service",
      "FLAG FOR POLICY",
      "Do not send",
      "Do not invent",
      "You review and send",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await expect(
      page.getByLabel("Repeat no-show threshold including today"),
    ).toHaveValue("3");
    await expect(
      page.getByLabel("Statuses that are never a no-show (one per line)"),
    ).toHaveValue("cancelled");
    await page.getByRole("button", { name: "Generate My Recovery Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Confirm status = no_show against the booking row before any draft.",
      "Never draft for attended.",
      "Never treat cancelled as a no-show.",
      "SMS draft only when sms_consent = yes and contact_pref = sms.",
      "Confirm consent before any message.",
      "Flag when this miss reaches the repeat threshold of 3.",
      "Offer only open slots that match the missed service.",
      "Do not send. You review and send. The kit changes nothing.",
    ]) {
      expect(text).toContain(phrase);
    }
    expect(text).not.toContain("Always skip");
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list a skip client and extra never-a-no-show statuses", async ({
    page,
  }) => {
    await page.getByLabel("Clients to always skip (one per line)").fill("R. Kim");
    await page
      .getByLabel("Statuses that are never a no-show (one per line)")
      .fill("cancelled\nrescheduled");
    await page.getByRole("button", { name: "Generate My Recovery Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("Always skip: R. Kim");
    await expect(rules).toContainText("Never treat cancelled; rescheduled as a no-show.");
  });

  test("worksheet requires a repeat threshold of 1 or more", async ({ page }) => {
    await page.getByLabel("Repeat no-show threshold including today").fill("");
    await page.getByRole("button", { name: "Generate My Recovery Rules" }).click();
    await expect(page.getByText("Enter a repeat no-show threshold of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Repeat no-show threshold including today").fill("0");
    await page.getByRole("button", { name: "Generate My Recovery Rules" }).click();
    await expect(page.getByText("Enter a repeat no-show threshold of 1 or more.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("recovery log copies a CSV with the J. Rivera row", async ({ page }) => {
    const section = page.locator("#recovery-log-template");
    for (const column of [
      "as_of",
      "time",
      "client",
      "service",
      "status",
      "channel",
      "sms_consent",
      "prior_no_shows",
      "slots_offered",
      "action",
      "outcome",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe(
      "as_of,time,client,service,status,channel,sms_consent,prior_no_shows,slots_offered,action,outcome",
    );
    expect(csv).toContain("J. Rivera");
    expect(csv).toContain("2026-10-14");
    expect(csv).toContain("10:00");
    expect(csv).toContain("Cut & color");
    expect(csv).toContain("no_show");
    expect(csv).toContain("yes");
    expect(csv).toContain("drafted_not_sent");
  });

  test("sample bookings are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-bookings");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    expectSameClipboardText(
      await page.evaluate(() => navigator.clipboard.readText()),
      sampleBookingsCsv(spec),
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
      has: page.getByRole("heading", { level: 2, name: "No-show Recovery Assistant" }),
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
        : focus.label === "Repeat no-show threshold including today" ? "threshold"
        : focus.label === "Statuses that are never a no-show (one per line)" ? "never"
        : focus.label === "Clients to always skip (one per line)" ? "skip"
        : focus.text.includes("Generate My Recovery Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "generate", "never", "reset", "skip", "threshold", "toc"].sort(),
    );
  });
});

test.describe("No-show Recovery Assistant without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "No-show Recovery Assistant" }),
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

