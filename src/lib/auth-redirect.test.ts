import assert from "node:assert/strict";
import test from "node:test";
import {
  authPageForNext,
  localSandboxAuthUrl,
  magicLinkRedirectOrigin,
  magicLinkRedirectTo,
} from "./auth-redirect";

const NEXT_PATH = "/ja/blueprints/quote-request-assistant";

test("localhost port 3001 magic links use the allowlisted local host and keep next", () => {
  assert.equal(magicLinkRedirectOrigin("http://localhost:3001"), "http://127.0.0.1:3001");
  assert.equal(
    magicLinkRedirectTo("http://localhost:3001", NEXT_PATH),
    "http://127.0.0.1:3001/auth/callback?next=%2Fja%2Fblueprints%2Fquote-request-assistant",
  );
});

test("production and already allowlisted local origins stay unchanged", () => {
  assert.equal(
    magicLinkRedirectTo("https://aiusecaseatlas.com", NEXT_PATH),
    "https://aiusecaseatlas.com/auth/callback?next=%2Fja%2Fblueprints%2Fquote-request-assistant",
  );
  assert.equal(
    magicLinkRedirectTo("http://localhost:3000", "/my-blueprints"),
    "http://localhost:3000/auth/callback?next=%2Fmy-blueprints",
  );
  assert.equal(magicLinkRedirectOrigin("http://127.0.0.1:3001"), "http://127.0.0.1:3001");
});

test("the localhost auth page moves to the same path on the allowlisted host", () => {
  assert.equal(
    localSandboxAuthUrl("localhost:3001", "/ja/auth", "?next=%2Fja%2Fblueprints%2Fquote-request-assistant"),
    "http://127.0.0.1:3001/ja/auth?next=%2Fja%2Fblueprints%2Fquote-request-assistant",
  );
  assert.equal(localSandboxAuthUrl("127.0.0.1:3001", "/ja/auth", ""), null);
  assert.equal(localSandboxAuthUrl("aiusecaseatlas.com", "/auth", ""), null);
});

test("auth failures keep the locale of the destination", () => {
  assert.equal(authPageForNext(NEXT_PATH), "/ja/auth");
  assert.equal(authPageForNext("/en/my-blueprints"), "/en/auth");
  assert.equal(authPageForNext("/my-blueprints"), "/auth");
});
