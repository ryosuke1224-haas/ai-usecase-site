import { test } from "@playwright/test";
import { expectAuthNext } from "../support/navigation";
import { KIT_PATH } from "./helpers";

test.describe("Next-Pay Labor Check kit auth boundary", () => {
  test("logged-out kit access redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(KIT_PATH);
    await expectAuthNext(page, KIT_PATH);
  });
});
