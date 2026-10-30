import { expect, type Page } from "@playwright/test";
import { AUTH_SESSION_REFRESH_REQUIRED } from "./auth-state";

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

export async function openAuthenticated(page: Page, path: string) {
  await page.goto(path);
  if (new URL(page.url()).pathname === "/auth") {
    throw new Error(AUTH_SESSION_REFRESH_REQUIRED);
  }
}
