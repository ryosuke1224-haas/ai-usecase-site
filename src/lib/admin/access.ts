/**
 * Server allowlist for /admin/project.
 * Set ATLAS_ADMIN_EMAILS to a comma-separated list of owner emails.
 * An empty list allows nobody. Do not prefix the variable with NEXT_PUBLIC_.
 */
export const ADMIN_PROJECT_PATH = "/admin/project";

export type AdminAccess = "anonymous" | "forbidden" | "allow";

export function parseAdminAllowlist(raw: string | undefined): string[] {
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    const email = part.trim().toLowerCase();
    if (!email.includes("@")) continue;
    seen.add(email);
  }
  return [...seen];
}

export function adminAccessDecision(
  user: { email?: string | null } | null,
  allowlist: readonly string[],
): AdminAccess {
  if (!user) return "anonymous";
  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email || !allowlist.includes(email)) return "forbidden";
  return "allow";
}
