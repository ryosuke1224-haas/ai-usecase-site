import { defineConfig, devices } from "@playwright/test";
import { storageStatePath } from "./e2e/support/auth-state";

const baseURL = "http://localhost:3100";
const storageState = storageStatePath();

function serverEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") env[key] = value;
  }
  env.SITE_MODE = "live";
  return env;
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "agent-reports/playwright-results.json" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx next start -H localhost -p 3100",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: serverEnv(),
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /authenticated.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: /authenticated.*\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "authenticated-desktop",
      testMatch: /authenticated\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...(storageState ? { storageState } : {}),
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "authenticated-mobile",
      testMatch: /authenticated-mobile\.spec\.ts/,
      use: {
        ...devices["Pixel 5"],
        ...(storageState ? { storageState } : {}),
      },
    },
  ],
});
