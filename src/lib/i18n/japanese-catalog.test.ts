import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { japaneseUseCase } from "./catalog-labels";
import { JAPANESE_FEATURED_SLUGS, japaneseFeaturedCta } from "./featured-launch";
import { facetsUsedByCatalog, isPublicJapaneseCatalogUseCase, japaneseCatalogHref, useCaseMatchesProcess, useCasesForReference } from "./japanese-catalog";

const useCaseDir = "content/published/use-cases";

type CatalogRecord = {
  slug: string;
  accessTier?: string;
  templateVersion?: string;
  experience?: unknown;
  requiredDataSources: string[];
  requiredApis: string[];
  difficulty: string;
  automationLevel: string;
  primaryBusinessProcess?: string;
  relatedBusinessProcesses?: string[];
  businessProcesses?: string[];
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

  assert.equal(records.length, 38);
  assert.equal(visible.length + hidden.length, records.length);
  assert.ok(visible.includes("ai-collections-assistant"));
  assert.ok(visible.includes("ai-daily-inbox-briefing"));
  for (const product of LAUNCH_PRODUCTS) {
    assert.ok(visible.includes(product.slug), product.slug);
  }
  assert.equal(existsSync(`${useCaseDir}/unbilled-work-review-queue.json`), true);
  for (const slug of hidden) {
    assert.equal(existsSync(`${useCaseDir}/${slug}.json`), true, slug);
    assert.equal(visible.includes(slug), false);
  }
  assert.equal(visible.length, 13);
  assert.equal(hidden.length, 25);
});

test("Japanese catalog cards open the shipped experience", () => {
  const records = publishedUseCases();
  const bySlug = (slug: string) => records.find((record) => record.slug === slug);
  for (const product of LAUNCH_PRODUCTS) {
    assert.equal(japaneseCatalogHref(bySlug(product.slug)!), `/ja/blueprints/${product.slug}`);
  }
  assert.equal(japaneseCatalogHref(bySlug("ai-collections-assistant")!), "/ja/blueprints/ai-collections-assistant");
  assert.equal(
    japaneseCatalogHref(bySlug("ai-daily-inbox-briefing")!),
    "/blueprints/daily-inbox-briefing/starter-kit",
  );
  assert.equal(japaneseCatalogHref(bySlug("ai-sop-builder")!), "/ja/use-cases/ai-sop-builder");
});

test("Japanese catalog filters use only visible products", () => {
  const records = publishedUseCases();
  const visible = records.filter(isPublicJapaneseCatalogUseCase);
  const hidden = records.filter((record) => !isPublicJapaneseCatalogUseCase(record));
  const facets = facetsUsedByCatalog(
    visible,
    records.flatMap((record) => record.requiredDataSources).map((slug) => ({ slug })),
    records.flatMap((record) => record.requiredApis).map((slug) => ({ slug })),
    ["Beginner", "Intermediate", "Advanced"],
    ["Manual trigger", "Semi-automated", "Fully automated"],
  );
  const visibleData = new Set(visible.flatMap((record) => record.requiredDataSources));
  const hiddenOnlyData = hidden
    .flatMap((record) => record.requiredDataSources)
    .filter((slug) => !visibleData.has(slug));
  for (const facet of facets.dataSources) {
    assert.equal(visibleData.has(facet.slug), true, facet.slug);
  }
  for (const slug of hiddenOnlyData) {
    assert.equal(facets.dataSources.some((facet) => facet.slug === slug), false, slug);
  }
  assert.ok(hiddenOnlyData.length > 0);
});

test("process matching includes related products and excludes empty categories", () => {
  const visible = publishedUseCases().filter(isPublicJapaneseCatalogUseCase);
  const slugs = (process: string) =>
    visible.filter((record) => useCaseMatchesProcess(record, process)).map((record) => record.slug).sort();

  assert.deepEqual(slugs("Quotes & Proposals"), ["ai-proposal-follow-up-assistant", "quote-request-assistant"]);
  assert.deepEqual(slugs("Sales Forecasting"), ["ai-pipeline-risk-detector"]);
  assert.deepEqual(slugs("Follow-Up & Outreach"), ["ai-proposal-follow-up-assistant"]);
  assert.deepEqual(slugs("Lead Capture & Qualification"), []);
  assert.equal(useCaseMatchesProcess(visible[0], ""), true);
});

test("Japanese featured products and reference directories stay on shipped work", () => {
  const records = publishedUseCases().filter(isPublicJapaneseCatalogUseCase);
  assert.equal(japaneseUseCase("ai-collections-assistant")?.title, "入金フォローの下書き");
  for (const slug of JAPANESE_FEATURED_SLUGS) {
    const record = records.find((item) => item.slug === slug);
    assert.ok(record, slug);
    assert.equal(japaneseFeaturedCta(slug).length > 0, true);
    const href = japaneseCatalogHref(record!);
    assert.equal(href.startsWith("/ja/use-cases/"), false);
  }

  const apis = new Set(records.flatMap((record) => record.requiredApis));
  for (const slug of apis) {
    const products = useCasesForReference(records, "requiredApis", slug);
    assert.ok(products.length > 0, slug);
  }
  assert.ok(useCasesForReference(records, "requiredApis", "google-ads-api").some((item) => item.slug === "google-ads-performance-coach"));
  assert.ok(useCasesForReference(records, "requiredApis", "quickbooks-api").some((item) => item.slug === "ai-expense-watchdog"));
  assert.ok(useCasesForReference(records, "requiredApis", "gmail-api").some((item) => item.slug === "ai-daily-inbox-briefing"));
  assert.equal(useCasesForReference(records, "requiredApis", "linkedin-api").length, 0);

  const sources = new Set(records.flatMap((record) => record.requiredDataSources));
  for (const slug of sources) {
    assert.ok(useCasesForReference(records, "requiredDataSources", slug).length > 0, slug);
  }
  const invoices = useCasesForReference(records, "requiredDataSources", "invoices").map((item) => item.slug);
  assert.ok(invoices.includes("ai-collections-assistant"));
  assert.ok(invoices.includes("unbilled-work-review-queue"));
  assert.ok(useCasesForReference(records, "requiredDataSources", "credit-card-transactions").some((item) => item.slug === "ai-expense-watchdog"));
  assert.ok(useCasesForReference(records, "requiredDataSources", "staff-schedules").some((item) => item.slug === "ai-staffing-optimizer"));
  assert.equal(useCasesForReference(records, "requiredDataSources", "linkedin-profiles").length, 0);
});
