import fs from "node:fs";
import path from "node:path";
import {
  AUTH_SESSION_REFRESH_REQUIRED,
  defaultStorageStatePath,
  encodeAuthCookieValue,
  inspectStorageState,
  isAuthCookieName,
  readStorageState,
  sessionFromStorageState,
  type StorageCookie,
  type StorageStateFile,
} from "../../e2e/support/auth-state";

export type PreparedSession =
  | { status: "ready"; path: string; refreshed: boolean }
  | { status: "AUTH_SESSION_REFRESH_REQUIRED"; reason: string };

export function loadPublicSupabaseEnv(): { url: string; key: string } | null {
  const fromProcess = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };
  if (fromProcess.url && fromProcess.key) return fromProcess;
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return fromProcess.url && fromProcess.key ? fromProcess : null;
  const parsed: Record<string, string> = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)=(.*)$/.exec(line);
    if (!match?.[1]) continue;
    parsed[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
  const url = fromProcess.url || parsed.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = fromProcess.key || parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) return null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = key;
  return { url, key };
}

export async function refreshStoredSession(file: string): Promise<PreparedSession> {
  const state = readStorageState(file);
  const session = sessionFromStorageState(state);
  if (!session?.refresh_token || !state) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  const env = loadPublicSupabaseEnv();
  if (!env) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  const response = await fetch(`${env.url.replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  const next = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    user?: unknown;
  };
  if (!next.access_token || !next.refresh_token) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  const payload = {
    access_token: next.access_token,
    refresh_token: next.refresh_token,
    expires_at: next.expires_at ?? Math.floor(Date.now() / 1000) + (next.expires_in ?? 3600),
    expires_in: next.expires_in ?? 3600,
    token_type: next.token_type ?? "bearer",
    user: next.user ?? null,
  };
  writeAuthCookies(file, state, payload);
  return { status: "ready", path: file, refreshed: true };
}

export async function prepareAuthenticatedSession(): Promise<PreparedSession> {
  const inspection = inspectStorageState();
  if (inspection.status === "missing" || !inspection.path) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  if (inspection.status === "present") {
    return { status: "ready", path: inspection.path, refreshed: false };
  }
  if (!inspection.hasRefreshToken) {
    return { status: "AUTH_SESSION_REFRESH_REQUIRED", reason: AUTH_SESSION_REFRESH_REQUIRED };
  }
  return refreshStoredSession(inspection.path);
}

function writeAuthCookies(
  file: string,
  state: StorageStateFile,
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    token_type: string;
    user: unknown;
  },
): void {
  const encoded = encodeAuthCookieValue(session);
  const cookies = [...(state.cookies ?? [])];
  const authCookies = cookies.filter((cookie) => isAuthCookieName(cookie.name));
  const template = authCookies[0];
  const nextCookies: StorageCookie[] = cookies.filter((cookie) => !isAuthCookieName(cookie.name));
  const baseName = (template?.name ?? "sb-auth-token").replace(/\.\d+$/, "");
  const chunkSize = 3180;
  const chunks = encoded.match(new RegExp(`.{1,${chunkSize}}`, "g")) ?? [encoded];
  const expires = session.expires_at + 60 * 60 * 24 * 400;
  chunks.forEach((value, index) => {
    nextCookies.push({
      name: chunks.length === 1 ? baseName : `${baseName}.${index}`,
      value,
      domain: template?.domain ?? "localhost",
      path: template?.path ?? "/",
      expires,
      httpOnly: template?.httpOnly ?? false,
      secure: template?.secure ?? false,
      sameSite: template?.sameSite ?? "Lax",
    });
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ ...state, cookies: nextCookies }, null, 2)}\n`);
}

export function isAuthInfrastructureFailure(detail: string): boolean {
  return detail.includes("AUTH_SESSION_REFRESH_REQUIRED") || detail.includes("Stored QA session is missing or expired");
}
