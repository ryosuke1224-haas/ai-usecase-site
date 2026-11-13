/**
 * Supabase allows http://127.0.0.1:3001 and http://localhost:3000.
 * http://localhost:3001 is not on that list, so a magic link using it falls
 * back to the production Site URL. Cookies cannot cross those two hosts, so
 * local port 3001 sign-in stays on the allowlisted host for the whole flow.
 */
const LOCAL_PORT_3001 = "3001";
const ALLOWED_PORT_3001_ORIGIN = "http://127.0.0.1:3001";

export function magicLinkRedirectOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.protocol === "http:" && url.hostname === "localhost" && url.port === LOCAL_PORT_3001) {
      return ALLOWED_PORT_3001_ORIGIN;
    }
  } catch {
    return origin;
  }
  return origin;
}

export function magicLinkRedirectTo(origin: string, nextPath: string): string {
  const redirectOrigin = magicLinkRedirectOrigin(origin);
  return `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/** Moves a localhost:3001 auth page onto the allowlisted host. */
export function localSandboxAuthUrl(
  host: string | null,
  pathname: string,
  search: string,
): string | null {
  if (host !== "localhost:3001") return null;
  const query = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  return `${ALLOWED_PORT_3001_ORIGIN}${pathname}${query}`;
}

export function authPageForNext(nextPath: string): string {
  if (nextPath === "/ja" || nextPath.startsWith("/ja/")) return "/ja/auth";
  if (nextPath === "/en" || nextPath.startsWith("/en/")) return "/en/auth";
  return "/auth";
}
