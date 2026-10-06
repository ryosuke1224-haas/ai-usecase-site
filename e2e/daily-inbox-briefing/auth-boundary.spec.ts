import { expect, test } from "@playwright/test";
import { loadUseCaseSpec, resourcePath } from "../support/load-spec";
import { expectAuthNext } from "../support/navigation";

const spec = loadUseCaseSpec();

test.describe("Daily Inbox Briefing auth boundary", () => {
  test("logged-out Starter Kit access redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(spec.routes.starterKit);
    await expectAuthNext(page, spec.routes.starterKit);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: spec.auth.starterKitHeading,
      }),
    ).toBeVisible();
  });

  test("public Starter Kit call to action preserves the intended destination", async ({
    page,
  }) => {
    await page.goto(spec.routes.publicUseCase);
    await page
      .getByRole("link", { name: spec.publicExperience.starterCtaLabel })
      .first()
      .click();
    await expectAuthNext(page, spec.routes.starterKit);
  });

  test("protected resource access redirects to auth and preserves next", async ({
    page,
  }) => {
    const resource = spec.starterKit.resources.find(
      (item) => item.slug === "initial-prompt",
    );
    expect(resource).toBeTruthy();
    const path = resourcePath(spec, resource!.slug);
    await page.goto(path);
    await expectAuthNext(page, path);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: spec.auth.starterKitHeading,
      }),
    ).toBeVisible();
  });

  test("logged-out My Blueprints redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(spec.routes.myBlueprints);
    await expectAuthNext(page, spec.routes.myBlueprints);
    await expect(
      page.getByRole("heading", { level: 1, name: spec.auth.genericHeading }),
    ).toBeVisible();
  });

  test("signed-out Sign in link preserves My Blueprints as next", async ({
    page,
  }) => {
    await page.goto(spec.routes.publicUseCase);
    const href = await page.getByRole("link", { name: "Sign in" }).getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!, "http://localhost");
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("next")).toBe(spec.auth.signedOutSignInDestination);
  });
});
