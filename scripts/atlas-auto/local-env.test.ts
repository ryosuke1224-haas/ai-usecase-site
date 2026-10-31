import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resetEnv, updateInitialEnv } from "@next/env";
import { LIVE_STRIPE_PROVISIONING_BLOCKED, assertSandboxStripeKey } from "../../src/lib/payments/provision";
import { selectProvisioningAccount, usSandboxSecret } from "../atlas-commerce/stripe-accounts";
import { loadAtlasLocalEnv } from "./local-env";

const FIXTURE_TEST_KEY = "sk_test_atlas_auto_env_fixture_not_real";
const FIXTURE_LIVE_KEY = "sk_live_atlas_auto_env_fixture_blocked";
const SHELL_TEST_KEY = "sk_test_atlas_auto_shell_precedence";

function writeLocalEnv(dir: string, body: string) {
  writeFileSync(path.join(dir, ".env.local"), body);
  writeFileSync(path.join(dir, ".env.test.local"), body);
}

function withCleanStripeEnv(run: () => void) {
  const previous = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_US_SANDBOX: process.env.STRIPE_SECRET_KEY_US_SANDBOX,
  };
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY_US_SANDBOX;
  try {
    run();
  } finally {
    resetEnv();
    if (previous.STRIPE_SECRET_KEY === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous.STRIPE_SECRET_KEY;
    if (previous.STRIPE_SECRET_KEY_US_SANDBOX === undefined) delete process.env.STRIPE_SECRET_KEY_US_SANDBOX;
    else process.env.STRIPE_SECRET_KEY_US_SANDBOX = previous.STRIPE_SECRET_KEY_US_SANDBOX;
  }
}

test("STRIPE_SECRET_KEY from local env is visible to Atlas Auto commerce provisioning", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-auto-env-"));
  writeLocalEnv(dir, `STRIPE_SECRET_KEY=${FIXTURE_TEST_KEY}\n`);
  withCleanStripeEnv(() => {
    const loaded = loadAtlasLocalEnv({ dir, forceReload: true });
    assert.ok(loaded.loadedFileNames.includes(".env.local") || loaded.loadedFileNames.includes(".env.test.local"));
    assert.equal(usSandboxSecret(), FIXTURE_TEST_KEY);
    const account = selectProvisioningAccount({ market: "US", environment: "SANDBOX" });
    assert.equal(account.ok, true);
    if (!account.ok) return;
    assert.equal(account.envName, "STRIPE_SECRET_KEY");
    assert.equal(assertSandboxStripeKey(account.key).ok, true);
    assert.equal(account.key.startsWith("sk_test_"), true);
    const output = JSON.stringify(loaded);
    assert.equal(output.includes(FIXTURE_TEST_KEY), false);
    assert.equal(output.includes("sk_test_"), false);
  });
});

test("missing local Stripe key still produces STRIPE_NOT_CONFIGURED", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-auto-env-missing-"));
  withCleanStripeEnv(() => {
    loadAtlasLocalEnv({ dir, forceReload: true });
    const account = selectProvisioningAccount({ market: "US", environment: "SANDBOX" });
    assert.deepEqual(account, {
      ok: false,
      code: "STRIPE_NOT_CONFIGURED",
      envName: "STRIPE_SECRET_KEY",
    });
  });
});

test("sk_live_ from local env remains blocked and is never printed", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-auto-env-live-"));
  writeLocalEnv(dir, `STRIPE_SECRET_KEY=${FIXTURE_LIVE_KEY}\n`);
  withCleanStripeEnv(() => {
    const loaded = loadAtlasLocalEnv({ dir, forceReload: true });
    const account = selectProvisioningAccount({ market: "US", environment: "SANDBOX" });
    assert.equal(account.ok, false);
    if (account.ok) return;
    assert.equal(account.code, LIVE_STRIPE_PROVISIONING_BLOCKED);
    const output = `${JSON.stringify(loaded)} ${JSON.stringify(account)}`;
    assert.equal(output.includes(FIXTURE_LIVE_KEY), false);
    assert.equal(output.includes("sk_live_"), false);
  });
});

test("existing shell Stripe variables take precedence over .env.local", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-auto-env-shell-"));
  writeLocalEnv(dir, `STRIPE_SECRET_KEY=${FIXTURE_TEST_KEY}\n`);
  const previous = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = SHELL_TEST_KEY;
  updateInitialEnv({ STRIPE_SECRET_KEY: SHELL_TEST_KEY });
  try {
    loadAtlasLocalEnv({ dir, forceReload: true });
    assert.equal(usSandboxSecret(), SHELL_TEST_KEY);
    const account = selectProvisioningAccount({ market: "US", environment: "SANDBOX" });
    assert.equal(account.ok, true);
    if (account.ok) assert.equal(account.key, SHELL_TEST_KEY);
  } finally {
    resetEnv();
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  }
});
