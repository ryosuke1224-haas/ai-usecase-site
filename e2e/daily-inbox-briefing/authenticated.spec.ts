import { authSkipReason } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { loadUseCaseSpec, resourcePath } from "../support/load-spec";
import {
  expectAuthNext,
  expectNoHorizontalOverflow,
  openAuthenticated,
} from "../support/navigation";

const spec = loadUseCaseSpec();

test.beforeEach(() => {
  const reason = authSkipReason();
  test.skip(reason !== null, reason ?? undefined);
});

test.describe("Daily Inbox Briefing authenticated", () => {
  test("Starter Kit home loads", async ({ page }) => {
    await openAuthenticated(page, spec.routes.starterKit);
    await expect(
      page.getByRole("heading", { level: 1, name: spec.starterKit.title }),
    ).toBeVisible();
    await expect(page.getByText("Signed in as")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("all Starter Kit resources are READY", async ({ page }) => {
    await openAuthenticated(page, spec.routes.starterKit);
    await expect(
      page.getByText(spec.starterKit.readyLabel, { exact: true }),
    ).toHaveCount(spec.starterKit.resourceCount);
    for (const resource of spec.starterKit.resources) {
      await expect(
        page.getByRole("link", { name: new RegExp(resource.title) }),
      ).toHaveAttribute("href", resourcePath(spec, resource.slug));
    }
  });

  test("Initial Prompt loads", async ({ page }) => {
    await openAuthenticated(page, spec.routes.starterKit);
    await page
      .getByRole("link", { name: /Initial Daily Inbox Briefing Prompt/ })
      .click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Initial Daily Inbox Briefing Prompt",
      }),
    ).toBeVisible();
    const prompt = page.locator("pre").first();
    for (const phrase of spec.starterKit.initialPromptMustInclude) {
      await expect(prompt).toContainText(phrase);
    }
  });

  test("Copy Prompt works", async ({ page }) => {
    await openAuthenticated(
      page,
      resourcePath(spec, "initial-prompt"),
    );
    await page
      .getByRole("button", { name: spec.starterKit.copyPrompt.label })
      .first()
      .click();
    await expect(
      page.getByRole("button", { name: spec.starterKit.copyPrompt.copiedLabel }).first(),
    ).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("CONFIRMED FACT");
    expect(copied).toContain("Do not send emails.");
  });

  test("Priority Rules Prompt loads", async ({ page }) => {
    await openAuthenticated(page, resourcePath(spec, "priority-rules-prompt"));
    await expect(
      page.getByRole("heading", { level: 1, name: "Priority Rules Prompt" }),
    ).toBeVisible();
    const prompt = page.locator("pre").first();
    for (const phrase of spec.starterKit.priorityRulesPromptMustInclude) {
      await expect(prompt).toContainText(phrase);
    }
  });

  test("Priority Rules Worksheet accepts input", async ({ page }) => {
    const worksheet = spec.starterKit.priorityWorksheet;
    await openAuthenticated(page, resourcePath(spec, "priority-worksheet"));
    const field = page.getByRole("textbox", { name: worksheet.filledExample.label });
    await field.fill(worksheet.filledExample.value);
    await expect(field).toHaveValue(worksheet.filledExample.value);
  });

  test("generated prompt omits empty rules", async ({ page }) => {
    const worksheet = spec.starterKit.priorityWorksheet;
    await openAuthenticated(page, resourcePath(spec, "priority-worksheet"));

    await page.getByRole("button", { name: worksheet.generateButton }).click();
    // role="alert" does not take its accessible name from its text, so match the message itself.
    await expect(page.getByText(worksheet.emptyError, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: worksheet.generatedHeading }),
    ).toHaveCount(0);

    await page
      .getByRole("textbox", { name: worksheet.filledExample.label })
      .fill(worksheet.filledExample.value);
    await page
      .getByRole("textbox", { name: worksheet.whitespaceOnly.label })
      .fill(worksheet.whitespaceOnly.value);
    await page.getByRole("button", { name: worksheet.generateButton }).click();

    const generated = page.locator("pre").filter({
      hasText: worksheet.filledExample.value,
    });
    await expect(generated).toBeVisible();
    await expect(generated).toContainText(worksheet.filledExample.headingInPrompt);
    for (const heading of worksheet.omittedHeadingsWhenEmpty) {
      await expect(generated).not.toContainText(heading);
    }
    for (const line of worksheet.retainedSafetyLines) {
      await expect(generated).toContainText(line);
    }
  });

  test("Review Checklist interaction works", async ({ page }) => {
    const checklist = spec.starterKit.reviewChecklist;
    await openAuthenticated(page, resourcePath(spec, "review-checklist"));
    const total = checklist.items.length;
    await expect(page.getByText(`Checked 0 of ${total}.`)).toBeVisible();
    await page.getByRole("checkbox", { name: checklist.items[0] }).check();
    await expect(page.getByText(`Checked 1 of ${total}.`)).toBeVisible();
    await page.getByRole("button", { name: checklist.resetLabel }).click();
    await expect(page.getByText(`Checked 0 of ${total}.`)).toBeVisible();
  });

  test("My Blueprints shows the free Starter Kit", async ({ page }) => {
    await openAuthenticated(page, spec.routes.myBlueprints);
    await expect(
      page.getByRole("heading", { level: 1, name: "My Blueprints" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: spec.identity.title }),
    ).toBeVisible();
    const starterKitCard = page.getByRole("listitem").filter({
      has: page.getByRole("heading", { level: 2, name: spec.identity.title }),
    });
    await expect(
      starterKitCard.getByText(spec.tier.starterKit.badge, { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Starter Kit" })).toHaveAttribute(
      "href",
      spec.routes.starterKit,
    );
    await expectNoHorizontalOverflow(page);
  });

  test("Sign out removes access", async ({ page }) => {
    await openAuthenticated(page, spec.routes.myBlueprints);
    // AccountMenu calls supabase.auth.signOut() with the default global scope,
    // which revokes the shared QA refresh token. Satisfy that call in the
    // browser so this context loses access and the saved session stays reusable.
    await page.route("**/auth/v1/logout**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      }),
    );
    await page.locator("header").getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.goto(spec.routes.starterKit);
    await expectAuthNext(page, spec.routes.starterKit);
    await page.goto(spec.routes.myBlueprints);
    await expectAuthNext(page, spec.routes.myBlueprints);
  });
});
