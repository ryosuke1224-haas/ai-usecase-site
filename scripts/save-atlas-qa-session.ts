/**
 * Saves a local Playwright session after you sign in with the normal magic link.
 * Does not ask for a password, does not print the link, and does not commit anything.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "@playwright/test";

const appUrl = process.env.ATLAS_QA_APP_URL?.trim() || "http://localhost:3000";
const outputPath = path.resolve(
  process.env.ATLAS_QA_STORAGE_STATE?.trim() ||
    path.join(process.cwd(), "agent-secrets", "playwright-storage-state.json"),
);
const timeoutMs = Number(process.env.ATLAS_QA_SESSION_TIMEOUT_MS || 5 * 60 * 1000);
const headless = process.env.ATLAS_QA_SESSION_HEADLESS === "1";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/my-blueprints" ||
    pathname.startsWith("/blueprints/daily-inbox-briefing/starter-kit")
  );
}

function safePath(pageUrl: string): string {
  try {
    return new URL(pageUrl).pathname;
  } catch {
    return "(unreadable)";
  }
}

/** Signed-in UI on a protected route. Ignores the short-lived /auth/callback URL. */
async function findAuthenticatedPage(
  context: BrowserContext,
  expectedHost: string,
): Promise<Page | null> {
  for (const page of context.pages()) {
    if (page.isClosed()) continue;
    let current: URL;
    try {
      current = new URL(page.url());
    } catch {
      continue;
    }
    if (current.hostname !== expectedHost || !isProtectedPath(current.pathname)) continue;
    try {
      const signedIn = await page.getByText("Signed in as", { exact: false }).first().isVisible();
      if (signedIn) return page;
    } catch {
      // The page may be navigating. The next poll will look again.
    }
  }
  return null;
}

async function main() {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error("ATLAS_QA_SESSION_TIMEOUT_MS must be a positive number of milliseconds.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  const start = new URL("/auth", appUrl);
  start.searchParams.set("next", "/my-blueprints");
  const expectedHost = new URL(appUrl).hostname;

  console.log(`Opening ${start.toString()}`);
  console.log("Request the magic link in this window, then open that link in this same window.");
  console.log("Do not paste the link into chat or commit it.");
  console.log(
    `Waiting up to ${Math.round(timeoutMs / 1000)}s for /my-blueprints or the Starter Kit to show "Signed in as".`,
  );
  console.log(`Session file: ${outputPath}`);

  try {
    await page.goto(start.toString(), { waitUntil: "domcontentloaded" });
  } catch {
    await browser.close();
    console.error(
      `Could not open the local app. Start it with npm run dev, then use ${appUrl}.`,
    );
    process.exit(1);
  }

  const started = Date.now();
  let lastReport = 0;
  let authenticatedPage: Page | null = null;
  while (Date.now() - started < timeoutMs) {
    authenticatedPage = await findAuthenticatedPage(context, expectedHost);
    if (authenticatedPage) break;
    const elapsed = Date.now() - started;
    if (elapsed - lastReport >= 10_000) {
      lastReport = elapsed;
      const paths = context
        .pages()
        .filter((openPage) => !openPage.isClosed())
        .map((openPage) => safePath(openPage.url()));
      console.log(
        `Still waiting (${Math.round(elapsed / 1000)}s). Open page paths: ${paths.join(", ") || "(none)"}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!authenticatedPage) {
    const paths = context
      .pages()
      .filter((openPage) => !openPage.isClosed())
      .map((openPage) => safePath(openPage.url()));
    await browser.close();
    console.error(
      `Timed out after ${Math.round(timeoutMs / 1000)}s. Last open paths: ${paths.join(", ") || "(none)"}. No session file was written.`,
    );
    process.exit(1);
  }

  await context.storageState({ path: outputPath });
  await browser.close();

  let cookieCount = 0;
  try {
    const saved = JSON.parse(fs.readFileSync(outputPath, "utf8")) as { cookies?: unknown[] };
    cookieCount = Array.isArray(saved.cookies) ? saved.cookies.length : 0;
  } catch {
    cookieCount = 0;
  }
  if (!fs.existsSync(outputPath) || cookieCount === 0) {
    if (fs.existsSync(outputPath)) fs.rmSync(outputPath);
    console.error("storageState() did not write a session file with cookies. No session was saved.");
    process.exit(1);
  }

  console.log(`Saved storage state to: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
