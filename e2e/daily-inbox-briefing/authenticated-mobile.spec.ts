import { authSkipReason } from "../support/auth-state";
import { expect, test } from "../support/fixtures";
import { loadUseCaseSpec } from "../support/load-spec";
import {
  expectNoHorizontalOverflow,
  openAuthenticated,
} from "../support/navigation";

const spec = loadUseCaseSpec();

test.beforeEach(() => {
  const reason = authSkipReason();
  test.skip(reason !== null, reason ?? undefined);
});

test.describe("Daily Inbox Briefing authenticated mobile", () => {
  test("Starter Kit home fits a phone viewport", async ({ page }) => {
    await openAuthenticated(page, spec.routes.starterKit);
    await expect(
      page.getByRole("heading", { level: 1, name: spec.starterKit.title }),
    ).toBeVisible();
    await expect(
      page.getByText(spec.starterKit.readyLabel, { exact: true }),
    ).toHaveCount(spec.starterKit.resourceCount);
    await expectNoHorizontalOverflow(page);
  });

  test("My Blueprints fits a phone viewport", async ({ page }) => {
    await openAuthenticated(page, spec.routes.myBlueprints);
    await expect(
      page.getByRole("heading", { level: 1, name: "My Blueprints" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Starter Kit" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
