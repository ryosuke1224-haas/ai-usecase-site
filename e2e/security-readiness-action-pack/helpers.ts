import fs from "node:fs";
import path from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";

export const DEMO_PATH = "/blueprints/security-readiness-action-pack";
export const KIT_PATH = "/blueprints/security-readiness-action-pack/kit";

export const FORBIDDEN_COPY =
  /checkout|buy now|purchase|Buy Premium|\/month|per month|\d+%|ROI|hours saved/i;

export const TOTAL_STEPS = 6;

type ReadinessSpec = {
  id: string;
  routes: { guided_demo: string; kit: string };
  guided_demo: { sample_input: string; fictional_data_notice: string };
  kit_contents: { id: string; title: string }[];
};

export function loadReadinessSpec(): ReadinessSpec {
  const specPath = path.join(
    process.cwd(),
    "agent-specs",
    "security-readiness-action-pack.json",
  );
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8")) as ReadinessSpec;
  if (spec.id !== "security-readiness-action-pack") {
    throw new Error("Unexpected use case spec id");
  }
  return spec;
}

/**
 * Windows Chromium's clipboard.readText() inserts CR before LF.
 * The copied characters are otherwise unchanged.
 */
export function expectSameClipboardText(actual: string, expected: string) {
  expect(actual.replace(/\r\n/g, "\n")).toBe(expected.replace(/\r\n/g, "\n"));
}

/** Header plus the 4 account rows from guided_demo.sample_input. */
export function sampleInventoryCsv(spec: ReadinessSpec): string {
  const lines = spec.guided_demo.sample_input.split("\n");
  const start = lines.findIndex((line) =>
    line.startsWith("account,named_owner,still_with_company,"),
  );
  if (start < 0) throw new Error("Sample CSV header not found in spec");
  return lines
    .slice(start, start + 5)
    .map((line) => line.replace(/\r$/, ""))
    .join("\n");
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

/** Describes document.activeElement, including whether it shows a focus ring. */
export async function describeFocus(page: Page): Promise<FocusInfo | null> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = window.getComputedStyle(el);
    const outlineVisible =
      style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const shadowVisible = style.boxShadow !== "none" && style.boxShadow !== "";
    const input = el as HTMLInputElement;
    const label =
      input.labels && input.labels.length > 0
        ? (input.labels[0].textContent ?? "").trim()
        : "";
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
