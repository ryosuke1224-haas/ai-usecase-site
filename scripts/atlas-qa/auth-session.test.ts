import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  AUTH_SESSION_REFRESH_REQUIRED,
  encodeAuthCookieValue,
  inspectStorageState,
  sessionExpiresAt,
  sessionFromStorageState,
} from "../../e2e/support/auth-state";
import { isAuthInfrastructureFailure } from "./auth-session";

test("inspectStorageState reports missing, expired, and present sessions without reading secrets from disk", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-qa-session-"));
  const missing = inspectStorageState(path.join(dir, "none.json"));
  assert.equal(missing.status, "missing");
  assert.equal(missing.hasRefreshToken, false);

  const expiredPath = path.join(dir, "expired.json");
  fs.writeFileSync(
    expiredPath,
    JSON.stringify({
      cookies: [
        {
          name: "sb-example-auth-token",
          value: JSON.stringify({
            access_token: ["eyJhbGciOiJub25l", Buffer.from(JSON.stringify({ exp: 1 })).toString("base64url"), "x"].join("."),
            refresh_token: "refresh-token",
            expires_at: 1,
          }),
          expires: 1,
        },
      ],
    }),
  );
  const expired = inspectStorageState(expiredPath);
  assert.equal(expired.status, "expired");
  assert.equal(expired.hasRefreshToken, true);

  const presentPath = path.join(dir, "present.json");
  const future = Math.floor(Date.now() / 1000) + 3600;
  fs.writeFileSync(
    presentPath,
    JSON.stringify({
      cookies: [
        {
          name: "sb-example-auth-token",
          value: JSON.stringify({
            access_token: ["eyJhbGciOiJub25l", Buffer.from(JSON.stringify({ exp: future })).toString("base64url"), "x"].join("."),
            refresh_token: "refresh-token",
            expires_at: future,
          }),
          expires: future,
        },
      ],
    }),
  );
  const present = inspectStorageState(presentPath);
  assert.equal(present.status, "present");
  assert.equal(present.hasRefreshToken, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("Supabase base64 auth cookies are readable and rewriteable", () => {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: ["eyJhbGciOiJub25l", Buffer.from(JSON.stringify({ exp: future })).toString("base64url"), "x"].join("."),
    refresh_token: "refresh-token",
    expires_at: future,
  };
  const encoded = encodeAuthCookieValue(session);
  assert.match(encoded, /^base64-/);
  const parsed = sessionFromStorageState({
    cookies: [{ name: "sb-example-auth-token", value: encoded }],
  });
  assert.equal(parsed?.refresh_token, "refresh-token");
  assert.equal(parsed?.expires_at, future);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-qa-session-"));
  const file = path.join(dir, "base64.json");
  fs.writeFileSync(file, JSON.stringify({ cookies: [{ name: "sb-example-auth-token", value: encoded }] }));
  assert.equal(inspectStorageState(file).status, "present");
  fs.rmSync(dir, { recursive: true, force: true });
});

test("expired JWT seconds are read from the payload only", () => {
  const exp = 1_700_000_000;
  const token = ["eyJhbGciOiJub25l", Buffer.from(JSON.stringify({ exp })).toString("base64url"), "sig"].join(".");
  assert.equal(sessionExpiresAt({ access_token: token }), exp);
  assert.equal(sessionFromStorageState({ cookies: [] }), null);
});

test("auth infrastructure failures are not treated as product copy", () => {
  assert.equal(isAuthInfrastructureFailure(AUTH_SESSION_REFRESH_REQUIRED), true);
  assert.equal(isAuthInfrastructureFailure("Expected heading Security Readiness Action Pack Premium Kit"), false);
});
