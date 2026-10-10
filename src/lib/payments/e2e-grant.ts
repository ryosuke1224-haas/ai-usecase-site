import { timingSafeEqual } from "node:crypto";

/** Request header honored only by the Playwright server, never by production. */
export const E2E_ENTITLEMENT_HEADER = "x-atlas-e2e-entitlement";

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isLocalHost(host: string): boolean {
  const hostname = host.split(":")[0]?.replace(/^\[|\]$/g, "").toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Test-only read bypass. It never writes an entitlement.
 * Ignored unless the server process sets ATLAS_PAYMENTS_E2E=1, the secret matches,
 * and the request host is local.
 */
export function isE2eEntitlementGrant(
  headerValue: string | null,
  env: NodeJS.ProcessEnv = process.env,
  host: string | null = null,
): boolean {
  if (env.ATLAS_PAYMENTS_E2E !== "1") return false;
  if (!host || !isLocalHost(host)) return false;
  const secret = env.ATLAS_PAYMENTS_E2E_SECRET?.trim() ?? "";
  if (secret.length < 16 || !headerValue) return false;
  return sameSecret(headerValue, secret);
}
