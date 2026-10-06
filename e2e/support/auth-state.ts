import fs from "node:fs";
import path from "node:path";

export const AUTH_NOT_CONFIGURED =
  "Authenticated storage state is not configured. Create agent-secrets/playwright-storage-state.json or set ATLAS_QA_STORAGE_STATE. Do not commit secrets.";

const DEFAULT_STORAGE_STATE = path.join(
  process.cwd(),
  "agent-secrets",
  "playwright-storage-state.json",
);

/** Local session file, if one has been created. Never invents credentials. */
export function storageStatePath(): string | undefined {
  const fromEnv = process.env.ATLAS_QA_STORAGE_STATE?.trim();
  if (fromEnv) {
    return fs.existsSync(fromEnv) ? fromEnv : undefined;
  }
  return fs.existsSync(DEFAULT_STORAGE_STATE)
    ? DEFAULT_STORAGE_STATE
    : undefined;
}

/** Reason to skip signed-in tests, or null when a storage state file exists. */
export function authSkipReason(): string | null {
  const fromEnv = process.env.ATLAS_QA_STORAGE_STATE?.trim();
  if (fromEnv && !fs.existsSync(fromEnv)) {
    return "ATLAS_QA_STORAGE_STATE is set but the file was not found. Fix the path. Do not commit secrets.";
  }
  if (!storageStatePath()) return AUTH_NOT_CONFIGURED;
  return null;
}
