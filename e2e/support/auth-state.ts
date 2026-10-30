import fs from "node:fs";
import path from "node:path";

export const AUTH_NOT_CONFIGURED =
  "Authenticated storage state is not configured. Create agent-secrets/playwright-storage-state.json or set ATLAS_QA_STORAGE_STATE. Do not commit secrets.";

export const AUTH_SESSION_REFRESH_REQUIRED =
  "AUTH_SESSION_REFRESH_REQUIRED. The stored Playwright session is missing or expired and could not be refreshed. Run npm run qa:save-session, then retry QA. This is an authentication-infrastructure failure, not a product failure.";

const DEFAULT_STORAGE_STATE = path.join(
  process.cwd(),
  "agent-secrets",
  "playwright-storage-state.json",
);

export type StorageCookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
};

export type StorageStateFile = {
  cookies?: StorageCookie[];
  origins?: { origin: string; localStorage?: { name: string; value: string }[] }[];
};

export type SessionInspection = {
  path: string | undefined;
  status: "missing" | "expired" | "present";
  hasRefreshToken: boolean;
  expiresAt: number | null;
};

/** Local session file, if one has been created. Never invents credentials. */
export function storageStatePath(): string | undefined {
  const fromEnv = process.env.ATLAS_QA_STORAGE_STATE?.trim();
  if (fromEnv) {
    return fs.existsSync(fromEnv) ? fromEnv : undefined;
  }
  return fs.existsSync(DEFAULT_STORAGE_STATE) ? DEFAULT_STORAGE_STATE : undefined;
}

export function defaultStorageStatePath(): string {
  return process.env.ATLAS_QA_STORAGE_STATE?.trim() || DEFAULT_STORAGE_STATE;
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

export function isAuthCookieName(name: string): boolean {
  return /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i.test(name);
}

export function readStorageState(file: string): StorageStateFile | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as StorageStateFile;
  } catch {
    return null;
  }
}

export function sessionFromStorageState(state: StorageStateFile | null): {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
} | null {
  if (!state?.cookies?.length) return null;
  const chunks = state.cookies
    .filter((cookie) => isAuthCookieName(cookie.name))
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  if (chunks.length === 0) return null;
  const raw = chunks.map((cookie) => cookie.value).join("");
  for (const candidate of cookiePayloadCandidates(raw)) {
    const parsed = parseSessionPayload(candidate);
    if (parsed) return parsed;
  }
  return null;
}

export function encodeAuthCookieValue(session: unknown): string {
  return `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64")}`;
}

export function inspectStorageState(file = storageStatePath()): SessionInspection {
  if (!file || !fs.existsSync(file)) {
    return { path: file, status: "missing", hasRefreshToken: false, expiresAt: null };
  }
  const session = sessionFromStorageState(readStorageState(file));
  if (!session?.access_token && !session?.refresh_token) {
    return { path: file, status: "expired", hasRefreshToken: false, expiresAt: null };
  }
  const expiresAt = sessionExpiresAt(session);
  const expired = expiresAt != null && expiresAt * 1000 <= Date.now() + 60_000;
  return {
    path: file,
    status: expired && !session.refresh_token ? "expired" : expired ? "expired" : "present",
    hasRefreshToken: Boolean(session.refresh_token),
    expiresAt,
  };
}

export function sessionExpiresAt(session: { access_token?: string; expires_at?: number }): number | null {
  if (typeof session.expires_at === "number" && session.expires_at > 0) return session.expires_at;
  const token = session.access_token;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function cookiePayloadCandidates(value: string): string[] {
  const decodedUri = safeDecode(value);
  const values = [value, decodedUri].filter((item): item is string => Boolean(item));
  const expanded: string[] = [];
  for (const item of values) {
    expanded.push(item);
    if (item.startsWith("base64-")) {
      const fromBase64 = decodeBase64Cookie(item.slice("base64-".length));
      if (fromBase64) expanded.push(fromBase64);
    }
  }
  return [...new Set(expanded)];
}

function parseSessionPayload(value: string): {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
} | null {
  try {
    const parsed = JSON.parse(value) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      currentSession?: {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
      };
    };
    const session = parsed.currentSession ?? parsed;
    if (session.access_token || session.refresh_token) return session;
  } catch {
    // Cookie payload is not JSON in this encoding.
  }
  return null;
}

function decodeBase64Cookie(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
