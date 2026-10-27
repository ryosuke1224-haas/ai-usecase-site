import { LIVE_STRIPE_PROVISIONING_BLOCKED, assertSandboxStripeKey } from "../../src/lib/payments/provision";

export { LIVE_STRIPE_PROVISIONING_BLOCKED };
import { findRegistryMapping, type RegistryProduct } from "../../src/lib/payments/registry";
import { STRIPE_ACCOUNT_ENV } from "../atlas-commerce/stripe-accounts";

export const PRODUCTION_VERCEL_UPDATE_BLOCKED = "PRODUCTION_VERCEL_UPDATE_BLOCKED";
export const WEBHOOK_SECRET_REQUIRES_ROTATION = "WEBHOOK_SECRET_REQUIRES_ROTATION";
export const PREVIEW_PROJECT_NAME = "ai-usecase-site";
export const PREVIEW_BRANCH = "private-preview";
export const PREVIEW_TARGET = "preview";
export const WEBHOOK_EVENT = "checkout.session.completed";
export const WEBHOOK_PATH = "/api/stripe/webhook";
export const COLLECTIONS_PAGE_PATH = "/blueprints/ai-collections-assistant";

export const JP_PREVIEW_CONFIG = [
  { key: "ATLAS_COMMERCE_MARKET", value: "JP", sensitive: false },
  { key: "ATLAS_COMMERCE_LOCALE", value: "ja", sensitive: false },
] as const;

export const JP_PREVIEW_SECRET_KEYS = [
  STRIPE_ACCOUNT_ENV.JP_SANDBOX,
  "STRIPE_WEBHOOK_SECRET_JP_SANDBOX",
] as const;

export const ATLAS_SUPABASE_HOST = "hrxqgjdatkywmcybsbgv.supabase.co";

export const SUPABASE_PREVIEW_ENV = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", sensitive: false },
  { key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", sensitive: false },
  { key: "SUPABASE_SERVICE_ROLE_KEY", sensitive: true },
] as const;

export const PRESERVED_US_ENV = [
  "STRIPE_SECRET_KEY",
  "STRIPE_SECRET_KEY_US_SANDBOX",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export type SetupResultCode =
  | "READY_FOR_PAYMENT_TEST"
  | "WOULD_READY_FOR_PAYMENT_TEST"
  | typeof WEBHOOK_SECRET_REQUIRES_ROTATION
  | typeof LIVE_STRIPE_PROVISIONING_BLOCKED
  | typeof PRODUCTION_VERCEL_UPDATE_BLOCKED
  | "VERCEL_NOT_CONNECTED"
  | "VERCEL_PROJECT_MISMATCH"
  | "REGISTRY_MAPPING_MISSING"
  | "LOCAL_CONFIG_MISSING"
  | "LOCAL_SUPABASE_PROJECT_MISMATCH"
  | "SUPABASE_PROJECT_MISMATCH"
  | "US_SANDBOX_UNCHANGED"
  | "FAILED"
  | "MANUAL_REVIEW_REQUIRED"
  | "USAGE";

export type SetupSummary = {
  market: string;
  dryRun: boolean;
  registry: "PASS" | "FAIL" | "SKIPPED";
  stripeProduct: "REUSED" | "FAIL" | "SKIPPED";
  vercelConnection: "CONNECTED" | "SKIPPED";
  vercelProject: string;
  supabase: "PASS" | "UPDATED" | "WOULD UPDATE" | "FAIL" | "SKIPPED";
  webhook: "CREATED" | "REUSED" | "WOULD CREATE" | "WOULD REUSE" | "WEBHOOK_SECRET_REQUIRES_ROTATION" | "SKIPPED" | "FAIL";
  vercelConfig: "UPDATED" | "WOULD UPDATE" | "SKIPPED" | "FAIL";
  vercelSecrets: "UPDATED" | "WOULD UPDATE" | "UNCHANGED" | "SKIPPED" | "FAIL";
  deployment: "READY" | "FAILED" | "MANUAL_REVIEW_REQUIRED" | "WOULD DEPLOY" | "SKIPPED";
  reason?: string;
  price: "¥4,900" | "FAIL" | "SKIPPED";
  liveStripeTouched: "NO";
  modified: "nothing" | "preview";
  result: SetupResultCode;
  detail: string;
};

export type ListedWebhook = {
  id: string;
  url: string;
  enabledEvents: string[];
  disabled: boolean;
  livemode: boolean;
  secret: string | null;
};

export type EnvRecord = {
  id: string;
  key: string;
  target: string[];
  gitBranch: string | null;
};

export type SetupDeps = {
  env: NodeJS.ProcessEnv;
  branch: string;
  dryRun: boolean;
  market: string;
  environment: string;
  verbose: boolean;
  readRegistry: () => Promise<RegistryProduct[]>;
  stripe: {
    list: () => Promise<ListedWebhook[]>;
    create: (url: string) => Promise<ListedWebhook>;
    updateEvents: (id: string, events: string[]) => Promise<void>;
  } | null;
  vercel: {
    verify: () => Promise<{ projectId: string; projectName: string; previewUrl: string }>;
    listEnv: () => Promise<EnvRecord[]>;
    readPreviewEnv: (keys: readonly string[]) => Promise<Record<string, string>>;
    upsert: (change: { key: string; value: string; sensitive: boolean }) => Promise<void>;
    redeploy: () => Promise<{ id: string; url: string }>;
    wait: (id: string) => Promise<"READY" | "FAILED" | "MANUAL_REVIEW_REQUIRED">;
  } | null;
  probe: {
    getPage: (url: string) => Promise<{ status: number; body: string }>;
    postWebhook: (url: string) => Promise<{ status: number }>;
    postCheckout?: (url: string) => Promise<{ status: number; location: string }>;
  } | null;
};

export function parseSetupArgs(argv: string[]): {
  ok: true;
  market: string;
  dryRun: boolean;
  verbose: boolean;
  environment: string;
} | { ok: false; code: "USAGE" | typeof LIVE_STRIPE_PROVISIONING_BLOCKED } {
  let market = "";
  let dryRun = false;
  let verbose = false;
  let environment = "SANDBOX";
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token === "--verbose") {
      verbose = true;
      continue;
    }
    if (token === "--market" || token === "--environment") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) return { ok: false, code: "USAGE" };
      if (token === "--market") market = value;
      if (token === "--environment") environment = value;
      index += 1;
      continue;
    }
    return { ok: false, code: "USAGE" };
  }
  if (!market) return { ok: false, code: "USAGE" };
  if (environment.toUpperCase() === "LIVE") return { ok: false, code: LIVE_STRIPE_PROVISIONING_BLOCKED };
  if (environment.toUpperCase() !== "SANDBOX") return { ok: false, code: "USAGE" };
  return { ok: true, market, dryRun, verbose, environment: "SANDBOX" };
}

export function missingLocalConfig(env: NodeJS.ProcessEnv): string | null {
  const missing: string[] = [];
  if (!env.STRIPE_SECRET_KEY_JP_SANDBOX?.trim()) missing.push("STRIPE_SECRET_KEY_JP_SANDBOX");
  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (missing.length === 0) return null;
  return missing.length === 1 ? `${missing[0]} is not set.` : `${missing.join(", ")} are not set.`;
}

export function assessLocalSupabaseUrl(url: string): { ok: true } | { ok: false; code: "LOCAL_SUPABASE_PROJECT_MISMATCH" } {
  try {
    const host = new URL(url.trim()).host.toLowerCase();
    if (host === ATLAS_SUPABASE_HOST) return { ok: true };
  } catch {
    return { ok: false, code: "LOCAL_SUPABASE_PROJECT_MISMATCH" };
  }
  return { ok: false, code: "LOCAL_SUPABASE_PROJECT_MISMATCH" };
}

export function supabasePreviewStatus(local: Record<string, string>, preview: Record<string, string>): "PASS" | "UPDATED" {
  for (const item of SUPABASE_PREVIEW_ENV) {
    const previewValue = (preview[item.key] ?? "").trim();
    const localValue = (local[item.key] ?? "").trim();
    if (previewValue === localValue) continue;
    if (item.sensitive && previewValue === "[SENSITIVE]") continue;
    return "UPDATED";
  }
  return "PASS";
}

export function localSupabaseValues(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(SUPABASE_PREVIEW_ENV.map((item) => [item.key, env[item.key]?.trim() ?? ""]));
}

export function supabasePreviewChanges(env: NodeJS.ProcessEnv): Array<{ key: string; value: string; sensitive: boolean }> {
  return SUPABASE_PREVIEW_ENV.map((item) => ({
    key: item.key,
    value: env[item.key]?.trim() ?? "",
    sensitive: item.sensitive,
  }));
}

export function parseEnvAssignments(text: string, keys: readonly string[]): Record<string, string> {
  const wanted = new Set(keys);
  const values: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq);
    if (!wanted.has(key)) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function overlayPreviewEnv(shared: Record<string, string>, branch: Record<string, string>): Record<string, string> {
  return { ...shared, ...branch };
}

export function assertSandboxPreviewKey(env: NodeJS.ProcessEnv): { ok: true } | { ok: false; code: typeof LIVE_STRIPE_PROVISIONING_BLOCKED } {
  return assertSandboxStripeKey(env.STRIPE_SECRET_KEY_JP_SANDBOX?.trim() ?? "");
}

export function assessJapanRegistry(products: RegistryProduct[]): { ok: true } | { ok: false } {
  const row = findRegistryMapping(products, {
    product_slug: "ai-collections-assistant",
    market: "JP",
    locale: "ja",
    currency: "jpy",
    stripe_environment: "SANDBOX",
  });
  if (!row || row.status !== "ACTIVE" || row.price_amount !== 4900) return { ok: false };
  if (!row.stripe_product_id?.startsWith("prod_") || !row.stripe_price_id?.startsWith("price_")) return { ok: false };
  return { ok: true };
}

export function normalizeWebhookUrl(url: string): string {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.protocol}//${parsed.host}${path}`.toLowerCase();
}

export function previewWebhookUrl(previewUrl: string): string {
  return new URL(WEBHOOK_PATH, previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`).href;
}

export function webhookDecision(input: {
  endpoints: ListedWebhook[];
  webhookUrl: string;
  localSecret: string;
  vercelHasSecret: boolean;
}):
  | { action: "create" }
  | { action: "reuse"; endpoint: ListedWebhook; updateEvents: boolean; secret: string | null; rotation: boolean } {
  const wanted = normalizeWebhookUrl(input.webhookUrl);
  const match = input.endpoints.find((item) => !item.livemode && normalizeWebhookUrl(item.url) === wanted);
  if (!match) return { action: "create" };
  const eventsMatch =
    match.enabledEvents.length === 1 && match.enabledEvents[0] === WEBHOOK_EVENT && !match.disabled;
  const localSecret = input.localSecret.trim();
  const knownSecret = localSecret.startsWith("whsec_") ? localSecret : match.secret?.startsWith("whsec_") ? match.secret : "";
  return {
    action: "reuse",
    endpoint: match,
    updateEvents: !eventsMatch,
    secret: knownSecret || null,
    rotation: !knownSecret && !input.vercelHasSecret,
  };
}

export function assertPreviewTarget(target: string, branch: string): { ok: true } | { ok: false; code: typeof PRODUCTION_VERCEL_UPDATE_BLOCKED } {
  if (target !== PREVIEW_TARGET || branch !== PREVIEW_BRANCH) {
    return { ok: false, code: PRODUCTION_VERCEL_UPDATE_BLOCKED };
  }
  return { ok: true };
}

export function envChanges(input: { stripeKey: string; webhookSecret: string | null }): Array<{ key: string; value: string; sensitive: boolean }> {
  const changes: Array<{ key: string; value: string; sensitive: boolean }> = JP_PREVIEW_CONFIG.map((item) => ({ ...item }));
  changes.push({ key: STRIPE_ACCOUNT_ENV.JP_SANDBOX, value: input.stripeKey, sensitive: true });
  if (input.webhookSecret) {
    changes.push({ key: "STRIPE_WEBHOOK_SECRET_JP_SANDBOX", value: input.webhookSecret, sensitive: true });
  }
  for (const change of changes) {
    if ((PRESERVED_US_ENV as readonly string[]).includes(change.key)) {
      throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
    }
  }
  return changes;
}

export function assessPreviewPage(html: string): { ok: boolean } {
  const region = html.split('aria-label="Premium access"')[1]?.split("</section>")[0] ?? html;
  return { ok: region.includes("¥4,900") && !region.includes("$49") && !html.includes("$49") };
}

export function assessWebhookProbe(status: number): boolean {
  return status === 400;
}

export function assessCheckoutProbe(status: number, location: string, clientPriceId: string): boolean {
  return status === 303 && location.includes("/auth") && !location.includes("checkout.stripe.com") && !location.includes(clientPriceId);
}

export function redactSetupText(text: string, env: NodeJS.ProcessEnv = process.env): string {
  const secrets = [
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.STRIPE_SECRET_KEY,
    env.STRIPE_SECRET_KEY_US_SANDBOX,
    env.STRIPE_SECRET_KEY_JP_SANDBOX,
    env.STRIPE_SECRET_KEY_JP_LIVE,
    env.STRIPE_WEBHOOK_SECRET,
    env.STRIPE_WEBHOOK_SECRET_JP_SANDBOX,
    env.VERCEL_TOKEN,
    env.VERCEL_ACCESS_TOKEN,
    env.VERCEL_OIDC_TOKEN,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    env.NEXT_PUBLIC_SUPABASE_URL,
  ]
    .map((value) => value?.trim() ?? "")
    .filter((value) => value.length >= 8);
  let redacted = text;
  for (const secret of secrets) redacted = redacted.split(secret).join("[redacted]");
  return redacted
    .replace(/\bwhsec_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\b(?:sk|rk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, "[redacted]");
}

export function renderSummary(summary: SetupSummary, env: NodeJS.ProcessEnv = process.env): string {
  const lines = [
    `Atlas Preview Setup — ${summary.market}`,
    ...(summary.dryRun ? ["Dry run: yes"] : []),
    "",
    `Vercel connection     ${summary.vercelConnection}`,
    `Vercel project         ${summary.vercelProject}`,
    `Supabase project       ${summary.supabase}`,
    `Product registry       ${summary.registry}`,
    `Stripe Product/Price   ${summary.stripeProduct}`,
    `Stripe webhook         ${summary.webhook}`,
    `Vercel config          ${summary.vercelConfig}`,
    `Vercel secrets         ${summary.vercelSecrets}`,
    `Preview deployment     ${summary.deployment}`,
    ...(summary.reason ? [`Reason                  ${summary.reason}`] : []),
    `JP price               ${summary.price}`,
    "Live Stripe touched    NO",
    `Modified               ${summary.modified}`,
    "",
    "Result:",
    summary.result,
  ];
  if (summary.detail) lines.push("", summary.detail);
  return redactSetupText(lines.join("\n"), env);
}

function emptySummary(dryRun: boolean, result: SetupResultCode, detail: string): SetupSummary {
  return {
    market: "JP",
    dryRun,
    vercelConnection: "SKIPPED",
    vercelProject: "SKIPPED",
    supabase: "SKIPPED",
    registry: "SKIPPED",
    stripeProduct: "SKIPPED",
    webhook: "SKIPPED",
    vercelConfig: "SKIPPED",
    vercelSecrets: "SKIPPED",
    deployment: "SKIPPED",
    price: "SKIPPED",
    liveStripeTouched: "NO",
    modified: "nothing",
    result,
    detail,
  };
}

export async function runSetupPreview(deps: SetupDeps): Promise<SetupSummary> {
  const scope = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
  if (!scope.ok) return emptySummary(deps.dryRun, scope.code, "Preview setup cannot change Production.");
  if (deps.branch !== PREVIEW_BRANCH) {
    return emptySummary(deps.dryRun, "FAILED", "Atlas Preview Setup only runs on private-preview.");
  }
  if (deps.environment.toUpperCase() === "LIVE") {
    return emptySummary(deps.dryRun, LIVE_STRIPE_PROVISIONING_BLOCKED, "Live Stripe provisioning is blocked.");
  }
  if (deps.market.toUpperCase() !== "JP") {
    const unchanged = emptySummary(deps.dryRun, "US_SANDBOX_UNCHANGED", "This command only configures Japan Sandbox. The US Sandbox configuration was not changed.");
    unchanged.market = deps.market.toUpperCase();
    return unchanged;
  }
  const missing = missingLocalConfig(deps.env);
  if (missing) return emptySummary(deps.dryRun, "LOCAL_CONFIG_MISSING", missing);
  const sandboxKey = assertSandboxPreviewKey(deps.env);
  if (!sandboxKey.ok) return emptySummary(deps.dryRun, sandboxKey.code, "The Japan Sandbox key must be a test key.");
  const localSupabase = assessLocalSupabaseUrl(deps.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (!localSupabase.ok) {
    return emptySummary(deps.dryRun, localSupabase.code, "Local NEXT_PUBLIC_SUPABASE_URL is not the Atlas Supabase project. Nothing was changed.");
  }

  const products = await deps.readRegistry();
  if (!assessJapanRegistry(products).ok) {
    const summary = emptySummary(deps.dryRun, "REGISTRY_MAPPING_MISSING", "The Japan Sandbox Collections mapping is not in the product registry.");
    summary.registry = "FAIL";
    summary.stripeProduct = "FAIL";
    return summary;
  }

  if (!deps.vercel) {
    return {
      ...emptySummary(deps.dryRun, "VERCEL_NOT_CONNECTED", "Vercel is not connected. Run vercel login and link ai-usecase-site. Nothing was changed."),
      registry: "PASS",
      stripeProduct: "REUSED",
      price: "¥4,900",
    };
  }

  let previewUrl = "";
  let supabaseStatus: SetupSummary["supabase"] = "SKIPPED";
  const connected = (summary: Omit<SetupSummary, "vercelConnection" | "vercelProject" | "supabase">): SetupSummary => ({
    ...summary,
    vercelConnection: "CONNECTED",
    vercelProject: PREVIEW_PROJECT_NAME,
    supabase: supabaseStatus,
  });
  try {
    const project = await deps.vercel.verify();
    if (project.projectName !== PREVIEW_PROJECT_NAME) {
      return {
        ...emptySummary(deps.dryRun, "VERCEL_PROJECT_MISMATCH", "The linked Vercel project is not ai-usecase-site. Nothing was changed."),
        registry: "PASS",
        stripeProduct: "REUSED",
        price: "¥4,900",
      };
    }
    previewUrl = project.previewUrl;
    const previewSupabase = await deps.vercel.readPreviewEnv(SUPABASE_PREVIEW_ENV.map((item) => item.key));
    const compared = supabasePreviewStatus(localSupabaseValues(deps.env), previewSupabase);
    supabaseStatus = deps.dryRun && compared === "UPDATED" ? "WOULD UPDATE" : compared;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel verification failed.";
    const result = message.includes("VERCEL_PROJECT_MISMATCH")
      ? "VERCEL_PROJECT_MISMATCH"
      : message.includes("VERCEL_NOT_CONNECTED")
        ? "VERCEL_NOT_CONNECTED"
        : "FAILED";
    return {
      ...emptySummary(deps.dryRun, result, redactSetupText(message, deps.env)),
      registry: "PASS",
      stripeProduct: "REUSED",
      price: "¥4,900",
    };
  }

  const webhookUrl = previewWebhookUrl(previewUrl);
  if (!deps.stripe) {
    return connected(emptySummary(deps.dryRun, "FAILED", "Japan Sandbox Stripe is not available."));
  }
  const endpoints = await deps.stripe.list();
  if (endpoints.some((item) => item.livemode && normalizeWebhookUrl(item.url) === normalizeWebhookUrl(webhookUrl))) {
    return connected({
      ...emptySummary(deps.dryRun, LIVE_STRIPE_PROVISIONING_BLOCKED, "The matching webhook is live. Nothing was changed."),
      registry: "PASS",
      stripeProduct: "REUSED",
      price: "¥4,900",
    });
  }
  const existingEnv = deps.vercel ? await deps.vercel.listEnv() : [];
  const vercelHasSecret = existingEnv.some(
    (item) =>
      item.key === "STRIPE_WEBHOOK_SECRET_JP_SANDBOX" &&
      item.target.length === 1 &&
      item.target[0] === PREVIEW_TARGET &&
      item.gitBranch === PREVIEW_BRANCH,
  );
  const decision = webhookDecision({
    endpoints,
    webhookUrl,
    localSecret: deps.env.STRIPE_WEBHOOK_SECRET_JP_SANDBOX?.trim() ?? "",
    vercelHasSecret,
  });

  if (decision.action === "reuse" && decision.rotation) {
    return connected({
      ...emptySummary(
        deps.dryRun,
        WEBHOOK_SECRET_REQUIRES_ROTATION,
        "Stripe cannot return the signing secret for an existing webhook endpoint. Roll that Japan Sandbox endpoint secret in the Stripe Dashboard, save it as STRIPE_WEBHOOK_SECRET_JP_SANDBOX in .env.local, and run this command again. Nothing was changed.",
      ),
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: WEBHOOK_SECRET_REQUIRES_ROTATION,
      price: "¥4,900",
    });
  }

  const knownSecret = decision.action === "reuse" ? decision.secret : null;
  if (deps.dryRun) {
    return connected({
      market: "JP",
      dryRun: true,
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: decision.action === "create" ? "WOULD CREATE" : "WOULD REUSE",
      vercelConfig: "WOULD UPDATE",
      vercelSecrets: "WOULD UPDATE",
      deployment: "WOULD DEPLOY",
      price: "¥4,900",
      liveStripeTouched: "NO",
      modified: "nothing",
      result: "WOULD_READY_FOR_PAYMENT_TEST",
      detail: `Webhook URL path: ${WEBHOOK_PATH}`,
    });
  }

  let webhookSecret = knownSecret;
  let webhookStatus: SetupSummary["webhook"] = "REUSED";
  if (decision.action === "create") {
    const created = await deps.stripe.create(webhookUrl);
    if (created.livemode || !created.secret?.startsWith("whsec_")) {
      return connected({
        ...emptySummary(false, created.livemode ? LIVE_STRIPE_PROVISIONING_BLOCKED : "FAILED", "The new webhook did not return a sandbox signing secret."),
        registry: "PASS",
        stripeProduct: "REUSED",
        webhook: "FAIL",
        price: "¥4,900",
      });
    }
    webhookSecret = created.secret;
    webhookStatus = "CREATED";
  } else if (decision.updateEvents) {
    await deps.stripe.updateEvents(decision.endpoint.id, [WEBHOOK_EVENT]);
  }

  const changes = [
    ...(supabaseStatus === "UPDATED" ? supabasePreviewChanges(deps.env) : []),
    ...envChanges({
      stripeKey: deps.env.STRIPE_SECRET_KEY_JP_SANDBOX?.trim() ?? "",
      webhookSecret,
    }),
  ];
  for (const change of changes) {
    const allowed = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
    if (!allowed.ok) return emptySummary(false, allowed.code, "Preview setup cannot change Production.");
    await deps.vercel.upsert(change);
  }

  let deployment: SetupSummary["deployment"] = "MANUAL_REVIEW_REQUIRED";
  let deployUrl = previewUrl;
  try {
    const deploymentResult = await deps.vercel.redeploy();
    deployUrl = deploymentResult.url || previewUrl;
    deployment = await deps.vercel.wait(deploymentResult.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview redeploy failed.";
    const reason = redactSetupText(message, deps.env);
    return connected({
      market: "JP",
      dryRun: false,
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: webhookStatus,
      vercelConfig: "UPDATED",
      vercelSecrets: "UPDATED",
      deployment: "FAILED",
      reason,
      price: "SKIPPED",
      liveStripeTouched: "NO",
      modified: "preview",
      result: reason.includes(PRODUCTION_VERCEL_UPDATE_BLOCKED) ? PRODUCTION_VERCEL_UPDATE_BLOCKED : "FAILED",
      detail: "",
    });
  }

  if (deployment !== "READY" || !deps.probe) {
    return connected({
      market: "JP",
      dryRun: false,
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: webhookStatus,
      vercelConfig: "UPDATED",
      vercelSecrets: "UPDATED",
      deployment,
      reason: deployment === "FAILED" ? "The Preview deployment failed." : "The Preview deployment did not become READY.",
      price: "SKIPPED",
      liveStripeTouched: "NO",
      modified: "preview",
      result: deployment === "FAILED" ? "FAILED" : "MANUAL_REVIEW_REQUIRED",
      detail: "",
    });
  }

  const synced = await deps.vercel.readPreviewEnv(SUPABASE_PREVIEW_ENV.map((item) => item.key));
  if (supabasePreviewStatus(localSupabaseValues(deps.env), synced) === "UPDATED") {
    return connected({
      market: "JP",
      dryRun: false,
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: webhookStatus,
      vercelConfig: "UPDATED",
      vercelSecrets: "UPDATED",
      deployment,
      reason: "SUPABASE_PROJECT_MISMATCH",
      price: "SKIPPED",
      liveStripeTouched: "NO",
      modified: "preview",
      result: "SUPABASE_PROJECT_MISMATCH",
      detail: "Preview still points at a different Supabase project. Production was not changed.",
    });
  }

  const page = await deps.probe.getPage(new URL(COLLECTIONS_PAGE_PATH, deployUrl.endsWith("/") ? deployUrl : `${deployUrl}/`).href);
  const webhook = await deps.probe.postWebhook(previewWebhookUrl(deployUrl));
  const clientPriceId = "price_browser_supplied";
  const checkout = deps.probe.postCheckout
    ? await deps.probe.postCheckout(new URL("/api/stripe/checkout", deployUrl.endsWith("/") ? deployUrl : `${deployUrl}/`).href)
    : { status: 303, location: "/auth" };
  const pageOk = page.status === 200 && assessPreviewPage(page.body).ok;
  const webhookOk = assessWebhookProbe(webhook.status);
  const checkoutOk = assessCheckoutProbe(checkout.status, checkout.location, clientPriceId);
  return connected({
    market: "JP",
    dryRun: false,
    registry: "PASS",
    stripeProduct: "REUSED",
    webhook: webhookStatus,
    vercelConfig: "UPDATED",
    vercelSecrets: "UPDATED",
    deployment,
    price: pageOk ? "¥4,900" : "FAIL",
    liveStripeTouched: "NO",
    modified: "preview",
    result: pageOk && webhookOk && checkoutOk ? "READY_FOR_PAYMENT_TEST" : "MANUAL_REVIEW_REQUIRED",
    reason: pageOk && webhookOk && checkoutOk ? undefined : "The Collections page did not show ¥4,900, or the unsigned webhook or checkout probe did not match.",
    detail: "",
  });
}
