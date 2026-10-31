import type { PreparedSession } from "../atlas-qa/auth-session";
import {
  acceptTrustedSecretFile,
  hashSecretBytes,
  isTrustedAuthSessionFile,
  repoRelativeSecretPath,
  restoreSecrets,
  secretFingerprint,
  TRUSTED_AUTH_SESSION_FILE,
  type Baseline,
  type WorkspaceIo,
} from "./workspace";

export const SECRET_FILE_BLOCKING_MESSAGE =
  "A local secret or session file changed and was restored. The loop does not read or print those files.";

export type SecretGuardResult =
  | { status: "continue"; baseline: Baseline; session: "reused" | "refreshed"; adopted: boolean }
  | { status: "AUTH_SESSION_FAILURE"; reason: string }
  | { status: "unexpected_secret_change"; files: string[]; baseline: Baseline };

export function adoptTrustedAuthSession(
  baseline: Baseline,
  prepared: PreparedSession,
  io?: WorkspaceIo,
): SecretGuardResult {
  if (prepared.status !== "ready") {
    return { status: "AUTH_SESSION_FAILURE", reason: prepared.reason };
  }
  const relative = repoRelativeSecretPath(prepared.path);
  if (!isTrustedAuthSessionFile(relative)) {
    return {
      status: "unexpected_secret_change",
      files: [relative],
      baseline,
    };
  }
  const before = hashSecretBytes(baseline.secrets.get(relative) ?? null);
  const after = secretFingerprint(relative, io);
  const changed = before !== after;
  if (!prepared.refreshed && !changed) {
    return { status: "continue", baseline, session: "reused", adopted: false };
  }
  return {
    status: "continue",
    baseline: acceptTrustedSecretFile(baseline, relative, io),
    session: "refreshed",
    adopted: true,
  };
}

export function blockUnexpectedSecretChanges(
  baseline: Baseline,
  io?: WorkspaceIo,
): { blocked: boolean; files: string[]; message: string } {
  const files = restoreSecrets(baseline, io);
  return {
    blocked: files.length > 0,
    files,
    message: SECRET_FILE_BLOCKING_MESSAGE,
  };
}

export function secretIssuePrintsContents(text: string, forbidden: string[]): boolean {
  return forbidden.some((item) => item.length > 0 && text.includes(item));
}

export { TRUSTED_AUTH_SESSION_FILE };
