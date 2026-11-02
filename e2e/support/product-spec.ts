import fs from "node:fs";
import path from "node:path";

export const SHARED_E2E_DIRS = ["daily-inbox-briefing", "payments", "support"] as const;
export const REQUIRED_SHARED_SPEC_ID = "daily-inbox-briefing";

export class ProductSpecMissingError extends Error {
  readonly productId: string;
  readonly specPath: string;
  readonly code = "PRODUCT_SPEC_MISSING";

  constructor(productId: string) {
    const specPath = productSpecRelativePath(productId);
    super(`Product spec missing: ${specPath}`);
    this.name = "ProductSpecMissingError";
    this.productId = productId;
    this.specPath = specPath;
  }
}

export function productSpecRelativePath(id: string): string {
  return `agent-specs/${id}.json`;
}

export function productSpecPath(id: string): string {
  return path.join(process.cwd(), "agent-specs", `${id}.json`);
}

export function productSpecExists(id: string): boolean {
  return fs.existsSync(productSpecPath(id));
}

export function currentAtlasQaProduct(): string | undefined {
  const value = process.env.ATLAS_QA_PRODUCT?.trim();
  return value || undefined;
}

export function loadProductSpec<T extends { id: string }>(id: string): T {
  const specPath = productSpecPath(id);
  if (!fs.existsSync(specPath)) {
    throw new ProductSpecMissingError(id);
  }
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8")) as T;
  if (spec.id !== id) {
    throw new Error(`Unexpected use case spec id in ${productSpecRelativePath(id)}: ${String(spec.id)}`);
  }
  return spec;
}

export function tryLoadProductSpec<T extends { id: string }>(id: string): T | null {
  if (!productSpecExists(id)) return null;
  return loadProductSpec<T>(id);
}

export function listProductE2EIds(): string[] {
  const e2eRoot = path.join(process.cwd(), "e2e");
  if (!fs.existsSync(e2eRoot)) return [];
  return fs
    .readdirSync(e2eRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => !SHARED_E2E_DIRS.includes(name as (typeof SHARED_E2E_DIRS)[number]))
    .sort();
}

export function missingProductSpecIds(requiredId?: string): string[] {
  return listProductE2EIds().filter((id) => id !== requiredId && !productSpecExists(id));
}

export function playwrightIgnoreForMissingSpecs(requiredId = currentAtlasQaProduct()): RegExp | undefined {
  const missing = missingProductSpecIds(requiredId);
  if (missing.length === 0) return undefined;
  const escaped = missing.map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?:^|[/\\\\])(?:${escaped.join("|")})[/\\\\]`);
}

export function requiredSharedSpecIssues(): string[] {
  if (productSpecExists(REQUIRED_SHARED_SPEC_ID)) return [];
  return [
    `Required shared spec missing: ${productSpecRelativePath(REQUIRED_SHARED_SPEC_ID)}. Atlas QA cannot run until this tracked artifact is restored.`,
  ];
}

export function currentProductSpecIssues(productId = currentAtlasQaProduct()): string[] {
  if (!productId) return [];
  if (productSpecExists(productId)) return [];
  return [
    `Current product spec missing: ${productSpecRelativePath(productId)}. This is a product spec persistence failure for ${productId}, not a Playwright runner failure.`,
  ];
}
