import { expect, test } from "../support/fixtures";
import { loadUseCaseSpec } from "../support/load-spec";
import { expectNoHorizontalOverflow } from "../support/navigation";

const spec = loadUseCaseSpec();

test.describe("Daily Inbox Briefing quality", () => {
  test("use-case page has no unexpected console errors and fits the viewport", async ({
    page,
  }) => {
    await page.goto(spec.routes.publicUseCase);
    await expect(
      page.getByRole("heading", { level: 1, name: spec.identity.title }),
    ).toBeVisible();
    await page.locator(`#${spec.supademo.sectionId}`).scrollIntoViewIfNeeded();
    await expect(page.locator("iframe")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("auth page has no unexpected console errors and fits the viewport", async ({
    page,
  }) => {
    await page.goto(
      `${spec.routes.auth}?next=${encodeURIComponent(spec.routes.starterKit)}`,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: spec.auth.starterKitHeading,
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("primary navigation fits and stays reachable", async ({ page }) => {
    await page.goto(spec.routes.publicUseCase);
    const width = page.viewportSize()?.width ?? 0;
    const header = page.locator("header");

    if (width < 640) {
      await expect(header.getByRole("link", { name: "Business Areas" })).toHaveCount(0);
      await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
      await header.getByRole("button", { name: "Resources" }).click();
      await expect(header.getByRole("link", { name: "Business Areas" })).toBeVisible();
      await expect(header.getByRole("link", { name: "AI Blueprints" })).toBeVisible();
    } else {
      await expect(header.getByRole("link", { name: "Business Areas" })).toBeVisible();
      await expect(header.getByRole("link", { name: "AI Blueprints" })).toBeVisible();
    }

    await expectNoHorizontalOverflow(page);
  });
});
