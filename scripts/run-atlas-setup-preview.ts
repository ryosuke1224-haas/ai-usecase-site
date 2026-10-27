/**
 * Atlas Preview Setup v1.
 * Configures private-preview for Japan Sandbox.
 * This script never commits, pushes, or deploys Production.
 */
import fs from "node:fs";
import { currentBranch } from "./atlas-agent/workspace";
import { readMergedRegistry } from "./atlas-commerce/save-registry";
import {
  LIVE_STRIPE_PROVISIONING_BLOCKED,
  parseSetupArgs,
  redactSetupText,
  renderSummary,
  runSetupPreview,
} from "./atlas-preview/setup";
import { stripeWebhookApi } from "./atlas-preview/stripe-webhooks";
import { createVercelCliSession, curlPreview } from "./atlas-preview/vercel-cli";

function loadLocalEnv(): void {
  const file = ".env.local";
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!match || process.env[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const USAGE = "Usage: npm run atlas:setup-preview -- --market JP [--dry-run] [--verbose]";

async function main(): Promise<void> {
  if (currentBranch() !== "private-preview") {
    console.error("Atlas Preview Setup only runs on private-preview.");
    process.exit(1);
  }
  loadLocalEnv();
  const parsed = parseSetupArgs(process.argv.slice(2).filter((arg) => arg !== "--"));
  if (!parsed.ok) {
    console.error(parsed.code === LIVE_STRIPE_PROVISIONING_BLOCKED ? LIVE_STRIPE_PROVISIONING_BLOCKED : USAGE);
    process.exit(1);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY_JP_SANDBOX?.trim() ?? "";
  const sandboxKey = stripeKey.startsWith("sk_test_") || stripeKey.startsWith("rk_test_");
  const summary = await runSetupPreview({
    env: process.env,
    branch: currentBranch(),
    dryRun: parsed.dryRun,
    market: parsed.market,
    environment: parsed.environment,
    verbose: parsed.verbose,
    readRegistry: readMergedRegistry,
    stripe: sandboxKey ? stripeWebhookApi(stripeKey) : null,
    vercel: createVercelCliSession({ dryRun: parsed.dryRun }),
    probe: {
      async getPage(url) {
        const response = curlPreview({ url });
        return { status: response.status, body: response.body };
      },
      async postWebhook(url) {
        const response = curlPreview({ url, method: "POST", body: "{}" });
        return { status: response.status };
      },
      async postCheckout(url) {
        const response = curlPreview({
          url,
          method: "POST",
          body: JSON.stringify({ productSlug: "ai-collections-assistant", priceId: "price_browser_supplied" }),
        });
        return { status: response.status, location: response.location };
      },
    },
  });
  console.log(renderSummary(summary));
  process.exitCode = summary.result === "READY_FOR_PAYMENT_TEST" || summary.result === "WOULD_READY_FOR_PAYMENT_TEST" ? 0 : 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Atlas Preview Setup failed.";
  console.error(redactSetupText(message));
  process.exit(1);
});
