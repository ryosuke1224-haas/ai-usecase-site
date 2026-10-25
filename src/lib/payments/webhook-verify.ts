import Stripe from "stripe";

export type WebhookAccount = "US" | "JP";

/**
 * Verifies a Stripe signature with one of the configured sandbox secrets.
 * An unsigned or mismatched payload never verifies. A livemode event is rejected.
 */
export function verifyStripeEvent(
  payload: string,
  signature: string | null,
  secrets: ReadonlyArray<{ account: WebhookAccount; secret: string }>,
): { ok: true; event: Stripe.Event; account: WebhookAccount } | { ok: false } {
  const header = signature?.trim() ?? "";
  if (!header) return { ok: false };
  const configured = secrets.filter((item) => item.secret.trim().startsWith("whsec_"));
  if (configured.length === 0) return { ok: false };
  for (const item of configured) {
    try {
      const event = Stripe.webhooks.constructEvent(payload, header, item.secret.trim());
      if (event.livemode) return { ok: false };
      return { ok: true, event, account: item.account };
    } catch {
      continue;
    }
  }
  return { ok: false };
}
