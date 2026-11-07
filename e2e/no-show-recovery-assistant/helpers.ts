import { expect, type Locator, type Page } from "@playwright/test";
import { loadProductSpec } from "../support/product-spec";

export const DEMO_PATH = "/blueprints/no-show-recovery-assistant";
export const KIT_PATH = "/blueprints/no-show-recovery-assistant/kit";
export const JA_DEMO_PATH = "/ja/blueprints/no-show-recovery-assistant";
export const JA_KIT_PATH = "/ja/blueprints/no-show-recovery-assistant/kit";

export const FORBIDDEN_COPY =
  /checkout|buy now|purchase|Buy Premium|\/month|per month|\d+%|ROI|hours saved/i;

export const TOTAL_STEPS = 6;

type NoShowSpec = {
  id: string;
  routes: { guided_demo: string; kit: string };
  guided_demo: { sample_input: string; fictional_data_notice: string };
  kit_contents: { id: string; title: string }[];
};

export function loadNoShowSpec(): NoShowSpec {
  return loadProductSpec<NoShowSpec>("no-show-recovery-assistant");
}

/** Windows Chromium's clipboard.readText() inserts CR before LF. */
export function expectSameClipboardText(actual: string, expected: string) {
  expect(actual.replace(/\r\n/g, "\n")).toBe(expected.replace(/\r\n/g, "\n"));
}

export function sampleBookingsCsv(spec: NoShowSpec): string {
  return spec.guided_demo.sample_input.replace(/\r\n/g, "\n").replace(/\n$/, "");
}

export function demoRegion(page: Page): Locator {
  return page.getByRole("region", { name: "Guided demo" });
}

export function stepLabel(page: Page, step: number): Locator {
  return page.getByText(`Step ${step} of ${TOTAL_STEPS}`, { exact: true });
}

export async function openDemoStep(page: Page, step: number) {
  await page.goto(DEMO_PATH);
  await expect(stepLabel(page, 1)).toBeVisible();
  const next = page.getByRole("button", { name: "Next step" });
  for (let current = 1; current < step; current += 1) {
    await next.click();
    await expect(stepLabel(page, current + 1)).toBeVisible();
  }
}

export type FocusInfo = {
  tag: string;
  type: string;
  text: string;
  label: string;
  href: string;
  ring: boolean;
};

export async function describeFocus(page: Page): Promise<FocusInfo | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = window.getComputedStyle(el);
    const outlineVisible = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const shadowVisible = style.boxShadow !== "none" && style.boxShadow !== "";
    const input = el as HTMLInputElement;
    const label = input.labels && input.labels.length > 0 ? (input.labels[0].textContent ?? "").trim() : "";
    return {
      tag: el.tagName.toLowerCase(),
      type: input.type ?? "",
      text: (el.textContent ?? "").trim(),
      label,
      href: el.getAttribute("href") ?? "",
      ring: outlineVisible || shadowVisible,
    };
  });
}
