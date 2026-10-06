import { expect, test } from "@playwright/test";
import { loadUseCaseSpec } from "../support/load-spec";

const spec = loadUseCaseSpec();

test.describe("Daily Inbox Briefing public", () => {
  test("use-case page loads", async ({ page }) => {
    await page.goto(spec.routes.publicUseCase);
    await expect(page).not.toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { level: 1, name: spec.identity.title }),
    ).toBeVisible();
    await expect(page.getByText(spec.publicExperience.noSignupNote)).toBeVisible();
    await expect(page.getByText(spec.publicExperience.previewBadge)).toBeVisible();
  });

  test("guided demo is available without authentication", async ({ page }) => {
    await page.goto(spec.routes.publicUseCase);
    const section = page.locator(`#${spec.supademo.sectionId}`);
    await section.scrollIntoViewIfNeeded();
    await expect(
      section.getByRole("heading", { name: spec.supademo.heading }),
    ).toBeVisible();
    await expect(
      page.getByRole("tablist", { name: "Choose your AI tool" }),
    ).toBeVisible();
    await expect(page).not.toHaveURL(/\/auth/);
  });

  test("ChatGPT, Claude, and Gemini selector loads the selected Supademo", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const documents: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() !== "document") return;
      if (!response.url().includes("app.supademo.com/embed/")) return;
      documents.push({ url: response.url(), status: response.status() });
    });

    await page.goto(spec.routes.publicUseCase, { waitUntil: "domcontentloaded" });
    await page.locator(`#${spec.supademo.sectionId}`).scrollIntoViewIfNeeded();

    await expect(
      page.getByRole("tab", { name: "ChatGPT", exact: true }),
    ).toHaveAttribute("aria-selected", "true");

    for (const tool of spec.supademo.tools) {
      await page.getByRole("tab", { name: tool.label, exact: true }).click();
      const iframe = page.locator("iframe");
      await expect(iframe).toHaveCount(1);
      await expect(iframe).toHaveAttribute("src", tool.embedUrl);
      await expect(iframe).toHaveAttribute("title", tool.iframeTitle);
      await expect(page.getByText(tool.availabilityNote)).toBeVisible();
      const embedId = new URL(tool.embedUrl).pathname.split("/").pop() ?? tool.key;
      await expect
        .poll(
          () =>
            documents.some(
              (hit) => hit.url.includes(embedId) && hit.status < 400,
            ),
          { timeout: 30_000 },
        )
        .toBe(true);
    }
  });

  test("plan and permission claims stay qualified", async ({ page }) => {
    await page.goto(spec.routes.publicUseCase);
    await expect(
      page.getByRole("heading", {
        name: spec.publicExperience.responsibilitiesHeading,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: spec.publicExperience.safetyHeading }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: spec.publicExperience.offersHeading }),
    ).toBeVisible();
    await expect(
      page.getByText(spec.publicExperience.offersFootnoteIncludes),
    ).toBeVisible();
    await expect(page.getByText(spec.tier.automatedApp.priceLabel)).toBeVisible();
    await expect(page.getByText(spec.tier.automatedApp.badge)).toBeVisible();
    await expect(
      page.getByText(spec.publicExperience.freeAccountRequired).first(),
    ).toBeVisible();
  });

  test("FAQ disclosure opens without authentication", async ({ page }) => {
    await page.goto(spec.routes.publicUseCase);
    const question = page.getByText(spec.publicExperience.faqSample.question);
    await question.scrollIntoViewIfNeeded();
    await question.click();
    await expect(
      page.getByText(spec.publicExperience.faqSample.answerIncludes),
    ).toBeVisible();
  });
});
