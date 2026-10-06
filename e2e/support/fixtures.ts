import { test as base, expect } from "@playwright/test";
import type { ConsoleMessage } from "@playwright/test";
import { isIgnoredConsoleError } from "./console";

export { expect };

/**
 * Fails the test when the Atlas page throws or logs an unexpected console error.
 * Third-party and missing-favicon noise is annotated, not failed.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const unexpected: string[] = [];
    const ignored: string[] = [];

    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== "error") return;
      const location = message.location().url ?? "";
      const entry = `${message.text()} @ ${location}`.slice(0, 500);
      if (isIgnoredConsoleError(message.text(), location)) ignored.push(entry);
      else unexpected.push(entry);
    };

    const onPageError = (error: Error) => {
      unexpected.push(error.message.slice(0, 500));
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    await use(page);

    for (const entry of unexpected) {
      testInfo.annotations.push({ type: "console-error", description: entry });
    }
    for (const entry of ignored) {
      testInfo.annotations.push({ type: "console-ignored", description: entry });
    }

    expect(
      unexpected,
      `Unexpected browser console errors:\n${unexpected.join("\n")}`,
    ).toEqual([]);
  },
});
