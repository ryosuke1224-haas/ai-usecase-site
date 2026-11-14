import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { blueprintCatalog } from "@/src/lib/blueprints";
import { japaneseUseCase } from "@/src/lib/i18n/catalog-labels";
import { LAUNCH_PRODUCTS } from "@/src/lib/payments/launch-catalog";
import { COLLECTIONS_PRODUCT_SLUG } from "@/src/lib/payments/products";

export type PerformanceProduct = {
  slug: string;
  titleJa: string;
  live: boolean;
};

export function premiumBlueprintCount(): number {
  return blueprintCatalog.filter((item) => item.access === "premium").length;
}

export function shippedBlueprintPage(slug: string): boolean {
  return existsSync(path.join(process.cwd(), "app", "blueprints", slug, "page.tsx"));
}

/** Checkout-enabled launch products, plus Collections. Security Readiness has no checkout. */
export function performanceProducts(): PerformanceProduct[] {
  const slugs = [...LAUNCH_PRODUCTS.map((item) => item.slug), COLLECTIONS_PRODUCT_SLUG];
  return slugs.map((slug) => {
    const titleJa = japaneseUseCase(slug)?.title;
    return {
      slug,
      titleJa: titleJa && titleJa !== slug ? titleJa : slug,
      live: shippedBlueprintPage(slug),
    };
  });
}

export function vercelAnalyticsInstalled(): boolean {
  try {
    const raw = readFileSync(path.join(process.cwd(), "package.json"), "utf8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return Boolean(pkg.dependencies?.["@vercel/analytics"] || pkg.devDependencies?.["@vercel/analytics"]);
  } catch {
    return false;
  }
}
