import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { isPublicJapaneseCatalogUseCase } from "./japanese-catalog";

const useCaseDir = "content/published/use-cases";

type CatalogRecord = {
  slug: string;
  templateVersion?: string;
  experience?: unknown;
};

function publishedUseCases(): CatalogRecord[] {
  return readdirSync(useCaseDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(readFileSync(`${useCaseDir}/${file}`, "utf8")) as CatalogRecord);
}

test("Japanese public catalog lists shipped implementations and keeps the other records", () => {
  const records = publishedUseCases();
  const visible = records.filter(isPublicJapaneseCatalogUseCase).map((record) => record.slug).sort();
  const hidden = records.filter((record) => !isPublicJapaneseCatalogUseCase(record)).map((record) => record.slug).sort();

  assert.equal(records.length, 37);
  assert.equal(visible.length + hidden.length, records.length);
  assert.ok(visible.includes("ai-collections-assistant"));
  assert.ok(visible.includes("ai-daily-inbox-briefing"));
  for (const product of LAUNCH_PRODUCTS) {
    const published = records.some((record) => record.slug === product.slug);
    if (published) assert.ok(visible.includes(product.slug), product.slug);
  }
  assert.equal(existsSync(`${useCaseDir}/unbilled-work-review-queue.json`), false);
  assert.equal(isPublicJapaneseCatalogUseCase({ slug: "unbilled-work-review-queue" }), true);
  for (const slug of hidden) {
    assert.equal(existsSync(`${useCaseDir}/${slug}.json`), true, slug);
    assert.equal(visible.includes(slug), false);
  }
  assert.equal(visible.length, 12);
  assert.equal(hidden.length, 25);
});
