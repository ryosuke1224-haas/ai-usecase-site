import assert from "node:assert/strict";
import test from "node:test";
import type { RegistryProduct } from "../../src/lib/payments/registry";
import {
  LIVE_STRIPE_PROVISIONING_BLOCKED,
  PRESERVED_US_ENV,
  PRODUCTION_VERCEL_UPDATE_BLOCKED,
  WEBHOOK_SECRET_REQUIRES_ROTATION,
  assertPreviewTarget,
  assessLocalSupabaseUrl,
  assessPreviewPage,
  envChanges,
  localSupabaseValues,
  overlayPreviewEnv,
  parseEnvAssignments,
  supabasePreviewChanges,
  supabasePreviewStatus,
  missingLocalConfig,
  parseSetupArgs,
  redactSetupText,
  renderSummary,
  runSetupPreview,
  type EnvRecord,
  type ListedWebhook,
  type SetupDeps,
} from "./setup";
import {
  assessVercelConnection,
  parsePreviewUrl,
  parseRedeployUrl,
  parseVercelEnvTable,
  previewDeploymentAppeared,
  previewRedeployArgs,
  projectNameFromLink,
  safeDeployReason,
  selectRedeployTarget,
} from "./vercel-cli";

const SECRET = "whsec_createdsecretvalue";
const JP_KEY = "sk_test_japanpreview";
const US_KEY = "sk_test_unitedstates";
const US_WEBHOOK = "whsec_unitedstates";

function product(overrides: Partial<RegistryProduct> = {}): RegistryProduct {
  return {
    product_slug: "ai-collections-assistant",
    name: "AI Collections Assistant",
    market: "US",
    locale: "en",
    stripe_product_id: "prod_united",
    stripe_price_id: "price_united",
    price_amount: 4900,
    suggested_price_amount: 4900,
    approved_price_amount: 4900,
    currency: "usd",
    payment_type: "ONE_TIME",
    stripe_environment: "SANDBOX",
    status: "ACTIVE",
    commercial_rationale: "Weekly collections queue.",
    created_at: "2026-10-10T00:00:00.000Z",
    updated_at: "2026-10-10T00:00:00.000Z",
    ...overrides,
  };
}

function japan(): RegistryProduct {
  return product({
    market: "JP",
    locale: "ja",
    currency: "jpy",
    stripe_product_id: "prod_japan",
    stripe_price_id: "price_japan",
  });
}

function endpoint(overrides: Partial<ListedWebhook> = {}): ListedWebhook {
  return {
    id: "we_existing",
    url: "https://private-preview.example/api/stripe/webhook",
    enabledEvents: ["checkout.session.completed"],
    disabled: false,
    livemode: false,
    secret: null,
    ...overrides,
  };
}

function harness(options: {
  dryRun?: boolean;
  market?: string;
  environment?: string;
  env?: NodeJS.ProcessEnv;
  endpoints?: ListedWebhook[];
  envRecords?: EnvRecord[];
  branch?: string;
  page?: string;
  vercel?: SetupDeps["vercel"] | null;
  previewEnv?: Record<string, string>;
} = {}): { deps: SetupDeps; calls: Record<string, number>; written: string[]; us: RegistryProduct } {
  const calls = { list: 0, create: 0, update: 0, upsert: 0, redeploy: 0, verify: 0, registry: 0 };
  const endpoints = [...(options.endpoints ?? [])];
  const records = [...(options.envRecords ?? [])];
  const written: string[] = [];
  const us = product();
  const env = {
    STRIPE_SECRET_KEY_JP_SANDBOX: JP_KEY,
    SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
    NEXT_PUBLIC_SUPABASE_URL: "https://hrxqgjdatkywmcybsbgv.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
    STRIPE_SECRET_KEY: US_KEY,
    STRIPE_WEBHOOK_SECRET: US_WEBHOOK,
    ...options.env,
  };
  const previewValues = { ...localSupabaseValues(env), ...options.previewEnv };
  const deps: SetupDeps = {
    env,
    branch: options.branch ?? "private-preview",
    dryRun: options.dryRun ?? false,
    market: options.market ?? "JP",
    environment: options.environment ?? "SANDBOX",
    verbose: false,
    async readRegistry() {
      calls.registry += 1;
      return [us, japan()];
    },
    stripe: {
      async list() {
        calls.list += 1;
        return endpoints.map((item) => ({ ...item, enabledEvents: [...item.enabledEvents] }));
      },
      async create(url) {
        calls.create += 1;
        const created = endpoint({ id: "we_new", url, secret: SECRET });
        endpoints.push({ ...created, secret: null });
        return created;
      },
      async updateEvents(id, events) {
        calls.update += 1;
        const found = endpoints.find((item) => item.id === id);
        if (found) found.enabledEvents = [...events];
      },
    },
    vercel: options.vercel === null ? null : options.vercel ?? {
      async verify() {
        calls.verify += 1;
        return { projectId: "prj_preview", projectName: "ai-usecase-site", previewUrl: "https://private-preview.example" };
      },
      async listEnv() {
        return records.map((item) => ({ ...item, target: [...item.target] }));
      },
      async readPreviewEnv() {
        return { ...previewValues };
      },
      async upsert(change) {
        calls.upsert += 1;
        written.push(change.key);
        if (change.key in previewValues) previewValues[change.key] = change.value;
        records.push({ id: `env_${records.length}`, key: change.key, target: ["preview"], gitBranch: "private-preview" });
      },
      async redeploy() {
        calls.redeploy += 1;
        return { id: "dpl_preview", url: "https://private-preview.example" };
      },
      async wait() {
        return "READY";
      },
    },
    probe: {
      async getPage() {
        return { status: 200, body: options.page ?? '<section aria-label="Premium access">¥4,900</section>' };
      },
      async postWebhook() {
        return { status: 400 };
      },
      async postCheckout() {
        return { status: 303, location: "https://private-preview.example/auth" };
      },
    },
  };
  return { deps, calls, written, us };
}

test("webhook provisioning is idempotent", async () => {
  const { deps, calls } = harness();
  const first = await runSetupPreview(deps);
  const second = await runSetupPreview(deps);
  assert.equal(first.webhook, "CREATED");
  assert.equal(second.webhook, "REUSED");
  assert.equal(calls.create, 1);
  assert.equal(first.liveStripeTouched, "NO");
  assert.equal(second.result, "READY_FOR_PAYMENT_TEST");
});

test("an existing sandbox webhook is reused", async () => {
  const { deps, calls } = harness({
    endpoints: [endpoint()],
    env: { STRIPE_WEBHOOK_SECRET_JP_SANDBOX: SECRET },
  });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.webhook, "REUSED");
  assert.equal(calls.create, 0);
  assert.equal(calls.update, 0);
});

test("an existing webhook with a different event list is narrowed and reused", async () => {
  const { deps, calls } = harness({
    endpoints: [endpoint({ enabledEvents: ["checkout.session.completed", "charge.succeeded"] })],
    env: { STRIPE_WEBHOOK_SECRET_JP_SANDBOX: SECRET },
  });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.webhook, "REUSED");
  assert.equal(calls.update, 1);
  assert.equal(calls.create, 0);
});

test("a missing signing secret stops for rotation and writes nothing", async () => {
  const { deps, calls } = harness({ endpoints: [endpoint()] });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, WEBHOOK_SECRET_REQUIRES_ROTATION);
  assert.equal(summary.modified, "nothing");
  assert.equal(calls.create, 0);
  assert.equal(calls.upsert, 0);
  assert.equal(calls.redeploy, 0);
});

test("Japan Preview env selection writes only the Japan keys", () => {
  const changes = envChanges({ stripeKey: JP_KEY, webhookSecret: SECRET });
  assert.deepEqual(changes.map((item) => item.key), [
    "ATLAS_COMMERCE_MARKET",
    "ATLAS_COMMERCE_LOCALE",
    "STRIPE_SECRET_KEY_JP_SANDBOX",
    "STRIPE_WEBHOOK_SECRET_JP_SANDBOX",
  ]);
  assert.equal(changes[0]?.value, "JP");
  assert.equal(changes[1]?.value, "ja");
  assert.equal(changes[2]?.sensitive, true);
  assert.equal(changes[3]?.sensitive, true);
  for (const key of PRESERVED_US_ENV) assert.equal(changes.some((item) => item.key === key), false);
});

test("Production Vercel targets are blocked", () => {
  assert.equal(assertPreviewTarget("production", "private-preview").ok, false);
  assert.equal(assertPreviewTarget("preview", "main").ok, false);
  assert.equal(assertPreviewTarget("preview", "private-preview").ok, true);
  const blocked = assertPreviewTarget("production", "main");
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, PRODUCTION_VERCEL_UPDATE_BLOCKED);
});

test("live Stripe is blocked before any client call", async () => {
  assert.equal(parseSetupArgs(["--market", "JP", "--environment", "LIVE"]).ok, false);
  const { deps, calls } = harness({ env: { STRIPE_SECRET_KEY_JP_SANDBOX: "sk_live_blocked" } });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, LIVE_STRIPE_PROVISIONING_BLOCKED);
  assert.equal(calls.registry, 0);
  assert.equal(calls.list, 0);
  assert.equal(calls.create, 0);
  const liveEndpoint = await runSetupPreview(harness({ endpoints: [endpoint({ livemode: true })] }).deps);
  assert.equal(liveEndpoint.result, LIVE_STRIPE_PROVISIONING_BLOCKED);
  assert.equal(liveEndpoint.modified, "nothing");
});

test("US Sandbox configuration is not changed", async () => {
  const { deps, calls, us } = harness({ market: "US" });
  const before = JSON.stringify(us);
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, "US_SANDBOX_UNCHANGED");
  assert.equal(summary.modified, "nothing");
  assert.equal(calls.registry, 0);
  assert.equal(calls.upsert, 0);
  assert.equal(JSON.stringify(us), before);
  assert.equal(deps.env.STRIPE_SECRET_KEY, US_KEY);
  assert.equal(deps.env.STRIPE_WEBHOOK_SECRET, US_WEBHOOK);
});

test("secrets are never printed", () => {
  const env = {
    STRIPE_SECRET_KEY_JP_SANDBOX: JP_KEY,
    STRIPE_WEBHOOK_SECRET_JP_SANDBOX: SECRET,
    VERCEL_TOKEN: "vercel-token-value",
  };
  const text = renderSummary(
    {
      market: "JP",
      dryRun: false,
      vercelConnection: "CONNECTED",
      vercelProject: "ai-usecase-site",
      supabase: "PASS",
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: "CREATED",
      vercelConfig: "UPDATED",
      vercelSecrets: "UPDATED",
      deployment: "READY",
      price: "¥4,900",
      liveStripeTouched: "NO",
      modified: "preview",
      result: "READY_FOR_PAYMENT_TEST",
      detail: `failed with ${JP_KEY} and ${SECRET} and vercel-token-value`,
    },
    env,
  );
  assert.equal(text.includes(JP_KEY), false);
  assert.equal(text.includes(SECRET), false);
  assert.equal(text.includes("vercel-token-value"), false);
  assert.equal(text.includes("whsec_"), false);
  assert.equal(text.includes("sk_test_"), false);
  assert.equal(redactSetupText(`sk_live_notprinted ${SECRET}`, env).includes("sk_live_"), false);
});

test("dry run modifies nothing", async () => {
  const { deps, calls } = harness({ dryRun: true });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, "WOULD_READY_FOR_PAYMENT_TEST");
  assert.equal(summary.webhook, "WOULD CREATE");
  assert.equal(summary.modified, "nothing");
  assert.equal(calls.create, 0);
  assert.equal(calls.update, 0);
  assert.equal(calls.upsert, 0);
  assert.equal(calls.redeploy, 0);
  assert.equal(calls.list, 1);
});

test("missing local config stops before Stripe or Vercel", async () => {
  const { deps, calls } = harness({ env: { STRIPE_SECRET_KEY_JP_SANDBOX: "" } });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, "LOCAL_CONFIG_MISSING");
  assert.match(missingLocalConfig({ STRIPE_SECRET_KEY_JP_SANDBOX: "" }) ?? "", /STRIPE_SECRET_KEY_JP_SANDBOX/);
  assert.equal(summary.detail.includes("sk_"), false);
  assert.equal(calls.list, 0);
  assert.equal(calls.verify, 0);
});

test("the Japan page check accepts yen and rejects the US dollar price", () => {
  assert.equal(assessPreviewPage('<section aria-label="Premium access">¥4,900</section>').ok, true);
  assert.equal(assessPreviewPage('<section aria-label="Premium access">$49</section>').ok, false);
});

test("Vercel is connected from whoami and the linked project, without a token", () => {
  const signedOut = assessVercelConnection({ whoamiOk: false, found: true, projectName: "ai-usecase-site" });
  assert.equal(signedOut.ok, false);
  if (!signedOut.ok) assert.equal(signedOut.code, "VERCEL_NOT_CONNECTED");
  const missing = assessVercelConnection({ whoamiOk: true, found: false, projectName: "" });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "VERCEL_NOT_CONNECTED");
  const mismatch = assessVercelConnection({ whoamiOk: true, found: true, projectName: "other-site" });
  assert.equal(mismatch.ok, false);
  if (!mismatch.ok) assert.equal(mismatch.code, "VERCEL_PROJECT_MISMATCH");
  assert.equal(assessVercelConnection({ whoamiOk: true, found: true, projectName: "ai-usecase-site" }).ok, true);
});

test("project.json and the CLI repo link both identify ai-usecase-site", () => {
  assert.equal(
    projectNameFromLink({ projectJson: { projectName: "ai-usecase-site", projectId: "prj_example" }, repoJson: null }).projectName,
    "ai-usecase-site",
  );
  assert.equal(
    projectNameFromLink({
      projectJson: null,
      repoJson: { projects: [{ name: "ai-usecase-site", directory: "." }] },
    }).projectName,
    "ai-usecase-site",
  );
  assert.equal(
    projectNameFromLink({
      projectJson: { projectName: "other-site" },
      repoJson: { projects: [{ name: "ai-usecase-site", directory: "." }] },
    }).projectName,
    "other-site",
  );
});

test("preview URL selection uses the private-preview branch alias", () => {
  const url = parsePreviewUrl({
    deployments: [
      {
        state: "READY",
        target: "production",
        url: "https://ai-usecase-site.vercel.app",
        meta: { githubCommitRef: "main", branchAlias: "ai-usecase-site.vercel.app" },
      },
      {
        state: "READY",
        target: null,
        url: "https://deployment-hash.vercel.app",
        meta: { githubCommitRef: "private-preview", branchAlias: "ai-usecase-site-git-private-preview-team.vercel.app" },
      },
    ],
  });
  assert.equal(url, "https://ai-usecase-site-git-private-preview-team.vercel.app");
});

test("env table parsing keeps names and drops secret values", () => {
  const records = parseVercelEnvTable(
    " STRIPE_WEBHOOK_SECRET_JP_SANDBOX     whsec_notprinted     Secret    Preview (private-preview)",
  );
  assert.equal(records[0]?.key, "STRIPE_WEBHOOK_SECRET_JP_SANDBOX");
  assert.equal(records[0]?.gitBranch, "private-preview");
  assert.equal(JSON.stringify(records).includes("whsec_"), false);
});

test("preview redeploy targets the newest private-preview deployment", () => {
  assert.deepEqual(previewRedeployArgs("ai-usecase-site-abc123.vercel.app"), [
    "redeploy",
    "ai-usecase-site-abc123.vercel.app",
    "--environment",
    "preview",
    "--no-wait",
  ]);
  assert.throws(() => previewRedeployArgs("ai-usecase-site.vercel.app"), /PRODUCTION_VERCEL_UPDATE_BLOCKED/);
  const selected = selectRedeployTarget({
    deployments: [
      {
        url: "ai-usecase-site.vercel.app",
        state: "READY",
        target: "production",
        createdAt: 300,
        meta: { githubCommitRef: "main" },
      },
      {
        url: "ai-usecase-site-old.vercel.app",
        state: "READY",
        target: null,
        createdAt: 100,
        meta: { githubCommitRef: "private-preview" },
      },
      {
        url: "ai-usecase-site-new.vercel.app",
        state: "READY",
        target: null,
        createdAt: 200,
        meta: { githubCommitRef: "private-preview" },
      },
    ],
  });
  assert.deepEqual(selected, { host: "ai-usecase-site-new.vercel.app", createdAt: 200 });
  assert.equal(
    parseRedeployUrl("Vercel CLI 65\nhttps://ai-usecase-site.vercel.app\nhttps://ai-usecase-site-created.vercel.app\n"),
    "https://ai-usecase-site-created.vercel.app",
  );
  assert.equal(
    previewDeploymentAppeared(
      {
        deployments: [
          {
            url: "ai-usecase-site-created.vercel.app",
            state: "READY",
            target: null,
            createdAt: 201,
            meta: { githubCommitRef: "private-preview" },
          },
        ],
      },
      "https://ai-usecase-site-created.vercel.app",
      200,
    ),
    true,
  );
  assert.equal(safeDeployReason("failed sk_test_secret whsec_secretvalue", "", { STRIPE_SECRET_KEY: "sk_test_secret" }).includes("sk_test_"), false);
});

test("a deployment failure keeps a non-secret reason", () => {
  const text = renderSummary(
    {
      market: "JP",
      dryRun: false,
      vercelConnection: "CONNECTED",
      vercelProject: "ai-usecase-site",
      supabase: "PASS",
      registry: "PASS",
      stripeProduct: "REUSED",
      webhook: "REUSED",
      vercelConfig: "UPDATED",
      vercelSecrets: "UPDATED",
      deployment: "FAILED",
      reason: "The Preview redeploy command failed.",
      price: "SKIPPED",
      liveStripeTouched: "NO",
      modified: "preview",
      result: "FAILED",
      detail: "",
    },
    {},
  );
  assert.match(text, /Preview deployment     FAILED/);
  assert.match(text, /Reason                  The Preview redeploy command failed\./);
  assert.doesNotMatch(text, /MANUAL_REVIEW_REQUIRED/);
});

test("a mismatched Vercel project stops before Stripe or Vercel writes", async () => {
  const { deps, calls } = harness({
    vercel: {
      async verify() {
        throw new Error("VERCEL_PROJECT_MISMATCH");
      },
      async listEnv() {
        return [];
      },
      async readPreviewEnv() {
        return {};
      },
      async upsert() {
        throw new Error("write");
      },
      async redeploy() {
        throw new Error("deploy");
      },
      async wait() {
        return "READY";
      },
    },
  });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.result, "VERCEL_PROJECT_MISMATCH");
  assert.equal(summary.modified, "nothing");
  assert.equal(calls.list, 0);
  assert.equal(calls.create, 0);
  assert.equal(calls.upsert, 0);
  assert.equal(calls.redeploy, 0);
});

test("a local Supabase project other than Atlas stops before Vercel writes", async () => {
  const { deps, calls } = harness({ env: { NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" } });
  const summary = await runSetupPreview(deps);
  assert.equal(assessLocalSupabaseUrl("https://other.supabase.co").ok, false);
  assert.equal(summary.result, "LOCAL_SUPABASE_PROJECT_MISMATCH");
  assert.equal(summary.modified, "nothing");
  assert.equal(calls.verify, 0);
  assert.equal(calls.upsert, 0);
});

test("a different Preview Supabase project is overridden for private-preview only", async () => {
  const { deps, calls, written } = harness({
    previewEnv: {
      NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_other",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-other",
    },
  });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.supabase, "UPDATED");
  assert.equal(summary.result, "READY_FOR_PAYMENT_TEST");
  assert.equal(supabasePreviewChanges(deps.env)[2]?.sensitive, true);
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    assert.equal(written.includes(key), true);
  }
  assert.equal(calls.redeploy, 1);
});

test("dry run plans a Supabase update and modifies nothing", async () => {
  const { deps, calls } = harness({
    dryRun: true,
    previewEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://other.supabase.co" },
  });
  const summary = await runSetupPreview(deps);
  assert.equal(summary.supabase, "WOULD UPDATE");
  assert.equal(summary.modified, "nothing");
  assert.equal(summary.result, "WOULD_READY_FOR_PAYMENT_TEST");
  assert.equal(calls.upsert, 0);
  assert.equal(calls.redeploy, 0);
});

test("an unreadable Preview secret does not count as a different Supabase project", () => {
  const local = {
    NEXT_PUBLIC_SUPABASE_URL: "https://hrxqgjdatkywmcybsbgv.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-value",
  };
  assert.equal(supabasePreviewStatus(local, { ...local, SUPABASE_SERVICE_ROLE_KEY: "[SENSITIVE]" }), "PASS");
  assert.equal(supabasePreviewStatus(local, { ...local, NEXT_PUBLIC_SUPABASE_URL: "[SENSITIVE]" }), "UPDATED");
});

test("a private-preview Supabase override wins over the shared Preview value", () => {
  const merged = overlayPreviewEnv(
    parseEnvAssignments('NEXT_PUBLIC_SUPABASE_URL="https://other.supabase.co"\n', ["NEXT_PUBLIC_SUPABASE_URL"]),
    parseEnvAssignments("NEXT_PUBLIC_SUPABASE_URL=https://hrxqgjdatkywmcybsbgv.supabase.co\n", ["NEXT_PUBLIC_SUPABASE_URL"]),
  );
  assert.equal(merged.NEXT_PUBLIC_SUPABASE_URL, "https://hrxqgjdatkywmcybsbgv.supabase.co");
});
