import { test } from "@playwright/test";
import { expectAuthNext } from "../support/navigation";
import { KIT_PATH, SUCCESS_PATH } from "./helpers";

test.describe("AI Collections Assistant kit auth boundary", () => {
  test("logged-out kit access redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(KIT_PATH);
    await expectAuthNext(page, KIT_PATH);
  });

  test("logged-out checkout success redirects to auth and does not unlock the kit", async ({
    page,
  }) => {
    await page.goto(SUCCESS_PATH);
    await expectAuthNext(page, SUCCESS_PATH);
  });
});
