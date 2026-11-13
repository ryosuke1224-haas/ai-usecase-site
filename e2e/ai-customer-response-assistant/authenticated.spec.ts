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
  loadReplySpec,
} from "./helpers";

const spec = loadReplySpec();

function requireStoredSession() {
  if (inspectStorageState().status === "missing") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}

test.describe("On-brand Reply Review Queue signed-in kit", () => {
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
        name: "On-brand Reply Review Queue Premium Kit",
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

  test("escalate-first prompt copies its exact text", async ({ page }) => {
    const section = page.locator("#escalate-prompt");
    const pre = section.locator("pre");
    const required = [
      "ESCALATE RULES FIRST",
      "refund demand",
      "injury",
      "legal threat",
      "Do not draft a customer-facing reply about money",
      "INTERNAL NOTE",
      "STOP",
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

  test("faq-only draft prompt names the send rules", async ({ page }) => {
    const prompt = (await page.locator("#draft-prompt pre").textContent()) ?? "";
    for (const phrase of [
      "only after",
      "escalate",
      "FAQ",
      "NEEDS YOUR CHECK",
      "PARTIAL DRAFT",
      "Do not invent",
      "Do not send",
      "Never promise a refund",
      "You send it",
    ]) {
      expect(prompt).toContain(phrase);
    }
  });

  test("worksheet generates the default rules", async ({ page }) => {
    await expect(page.getByLabel("Tone rules")).toHaveValue("warm, short, no slang");
    await expect(page.getByLabel("FAQ facts (one per line)")).toHaveValue(
      "color visits run 90 minutes\ncancellations need 24 hours\nwe do not quote refunds by email",
    );
    await expect(page.getByLabel("Escalate list (one per line)")).toHaveValue(
      "refund demand\ninjury\nlegal threat",
    );
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toBeVisible();
    const text = (await rules.textContent()) ?? "";
    for (const phrase of [
      "Apply ESCALATE RULES FIRST before any customer-facing draft.",
      "Escalate and STOP when: refund demand; injury; legal threat.",
      "Answer only with FAQ facts the owner pasted.",
      "If the FAQ does not cover the question, write NEEDS YOUR CHECK. Do not invent a policy, price, or appointment time.",
      "Tone: warm, short, no slang.",
      "Never promise a refund, discount, or deadline that is not in the FAQ.",
      "Do not send. You send it. Nothing is sent automatically.",
    ]) {
      expect(text).toContain(phrase);
    }
    await expect(
      page.locator("#rules-worksheet").getByRole("button", { name: "Copy rules" }),
    ).toBeVisible();
  });

  test("worksheet can list a custom escalate list and FAQ fact", async ({ page }) => {
    await page.getByLabel("Escalate list (one per line)").fill("refund demand\ninjury");
    await page.getByLabel("FAQ facts (one per line)").fill("color visits run 90 minutes");
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    const rules = page.locator("#rules-worksheet pre");
    await expect(rules).toContainText("Escalate and STOP when: refund demand; injury.");
    await expect(rules).toContainText("FAQ facts: color visits run 90 minutes.");
  });

  test("worksheet requires escalate rules and FAQ facts", async ({ page }) => {
    await page.getByLabel("Escalate list (one per line)").fill("");
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    await expect(page.getByText("Enter at least one escalate rule.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("Escalate list (one per line)").fill("   ");
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    await expect(page.getByText("Enter at least one escalate rule.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page
      .getByLabel("Escalate list (one per line)")
      .fill("refund demand\ninjury\nlegal threat");
    await page.getByLabel("FAQ facts (one per line)").fill("");
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    await expect(page.getByText("Enter at least one FAQ fact.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);

    await page.getByLabel("FAQ facts (one per line)").fill("   ");
    await page.getByRole("button", { name: "Generate My Reply Rules" }).click();
    await expect(page.getByText("Enter at least one FAQ fact.")).toBeVisible();
    await expect(page.locator("#rules-worksheet pre")).toHaveCount(0);
  });

  test("consistency log copies a CSV with the R. Cole row", async ({ page }) => {
    const section = page.locator("#reply-log-template");
    for (const column of [
      "week_of",
      "sender",
      "topic",
      "escalate_rule",
      "action",
      "outcome",
    ]) {
      await expect(section.getByRole("columnheader", { name: column })).toBeVisible();
    }
    await section.getByRole("button", { name: "Copy CSV" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const csv = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
    expect(csv.split("\n")[0]).toBe("week_of,sender,topic,escalate_rule,action,outcome");
    expect(csv).toContain("R. Cole");
    expect(csv).toContain("2026-10-27");
    expect(csv).toContain("refund demand");
    expect(csv).toContain("escalated");
    expect(csv).toContain("owner_handled");
  });

  test("sample messages are fictional and copyable", async ({ page }) => {
    const section = page.locator("#sample-messages");
    await expect(section.getByText("Fictional", { exact: true })).toBeVisible();
    await section.getByRole("button", { name: "Copy text" }).click();
    await expect(section.getByRole("button", { name: "Copied" })).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(
      "Can a color appointment be done in 45 minutes this Friday? Also I want my last visit refunded, the wait was too long.",
    );
    expect(copied).toContain("A. Nguyen");
    expect(copied).toContain("How long is a color visit");
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
      has: page.getByRole("heading", { level: 2, name: "On-brand Reply Review Queue" }),
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
    for (let tab = 0; tab < 150 && seen.size < 8; tab += 1) {
      await page.keyboard.press("Tab");
      const focus = await describeFocus(page);
      if (!focus) continue;
      const kind =
        focus.href.startsWith("#") ? "toc"
        : focus.text === "Copy Prompt" || focus.text === "Copy CSV" || focus.text === "Copy rules" || focus.text === "Copy text" ? "copy"
        : focus.label === "Tone rules" ? "tone"
        : focus.label === "FAQ facts (one per line)" ? "faq"
        : focus.label === "Escalate list (one per line)" ? "escalate"
        : focus.text.includes("Generate My Reply Rules") ? "generate"
        : focus.type === "checkbox" ? "checkbox"
        : focus.text === "Reset checklist" ? "reset"
        : "";
      if (!kind) continue;
      expect(focus.ring, `No focus ring on ${kind}`).toBe(true);
      seen.add(kind);
    }
    expect([...seen].sort()).toEqual(
      ["checkbox", "copy", "escalate", "faq", "generate", "reset", "toc", "tone"].sort(),
    );
  });
});

test.describe("On-brand Reply Review Queue without a premium entitlement", () => {
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
      has: page.getByRole("heading", { level: 2, name: "On-brand Reply Review Queue" }),
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

