import { expect, test } from "@playwright/test";
import { expectAuthNext } from "../support/navigation";
import { JA_KIT_PATH, KIT_PATH } from "./helpers";

test.describe("Next-Pay Labor Check kit auth boundary", () => {
  test("logged-out kit access redirects to auth and preserves next", async ({
    page,
  }) => {
    await page.goto(KIT_PATH);
    await expectAuthNext(page, KIT_PATH);
  });

  test("logged-out Japanese kit access redirects to Japanese auth and preserves next", async ({
    page,
  }) => {
    await page.goto(JA_KIT_PATH);
    await expect(page).toHaveURL(/\/ja\/auth\?/);
    const url = new URL(page.url());
    expect(url.pathname).toBe("/ja/auth");
    expect(url.searchParams.get("next")).toBe(JA_KIT_PATH);
  });
});
