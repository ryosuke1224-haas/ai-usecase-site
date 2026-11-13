import Stripe from "stripe";

export type WebhookAccount = "US" | "JP";

export type WebhookSecret = {
  account: WebhookAccount;
  secret: string;
  /** True only for the production webhook secret. Omitted secrets verify test-mode events. */
  livemode?: boolean;
};

/**
 * Verifies a Stripe signature with one configured secret.
 * A live event verifies only with a live secret.
 * A test-mode event verifies only with a sandbox secret.
 */
export function verifyStripeEvent(
  payload: string,
  signature: string | null,
  secrets: ReadonlyArray<WebhookSecret>,
): { ok: true; event: Stripe.Event; account: WebhookAccount } | { ok: false } {
  const header = signature?.trim() ?? "";
  if (!header) return { ok: false };
  const configured = secrets.filter((item) => item.secret.trim().startsWith("whsec_"));
  if (configured.length === 0) return { ok: false };
  for (const item of configured) {
    try {
      const event = Stripe.webhooks.constructEvent(payload, header, item.secret.trim());
      if (Boolean(event.livemode) !== (item.livemode === true)) continue;
      return { ok: true, event, account: item.account };
    } catch {
      continue;
    }
  }
  return { ok: false };
}
