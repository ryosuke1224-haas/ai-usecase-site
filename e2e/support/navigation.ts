import { expect, type Page } from "@playwright/test";

export async function expectAuthNext(page: Page, nextPath: string) {
  await expect(page).toHaveURL(/\/auth\?/);
  const url = new URL(page.url());
  expect(url.pathname).toBe("/auth");
  expect(url.searchParams.get("next")).toBe(nextPath);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow, `Page overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

const SESSION_EXPIRED =
  "Stored QA session is missing or expired. Refresh it with npm run qa:save-session. Do not commit that file.";

export async function openAuthenticated(page: Page, path: string) {
  await page.goto(path);
  if (new URL(page.url()).pathname === "/auth") {
    throw new Error(SESSION_EXPIRED);
  }
}
