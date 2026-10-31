import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adoptTrustedAuthSession,
  blockUnexpectedSecretChanges,
  SECRET_FILE_BLOCKING_MESSAGE,
  secretIssuePrintsContents,
} from "./secret-guard";
import {
  acceptTrustedSecretFile,
  TRUSTED_AUTH_SESSION_FILE,
  type Baseline,
  type WorkspaceIo,
} from "./workspace";
import { classifyFailure, decideSupervisor, emptySupervisorState, snapshotFromLoop } from "../atlas-auto/supervisor";

const SESSION = TRUSTED_AUTH_SESSION_FILE;
const PRODUCT = "e2e/security-readiness-action-pack/public.spec.ts";
const BEFORE = "session-before-FAKESECRET";
const AFTER = "session-after-FAKENEW";
const BUILDER = "builder-wrote-FAKELEAK";

function memoryIo(initial: Record<string, string>): WorkspaceIo & { store: Map<string, Buffer | null> } {
  const store = new Map<string, Buffer | null>(
    Object.entries(initial).map(([key, value]) => [key, Buffer.from(value)]),
  );
  return {
    store,
    readBytes(file) {
      return store.has(file) ? store.get(file)! : null;
    },
    writeBytes(file, bytes) {
      store.set(file, bytes);
    },
  };
}

function base(secrets: Record<string, string>, files: Record<string, string> = {}): Baseline {
  return {
    head: "abc",
    branch: "private-preview",
    files: new Map(Object.entries(files).map(([key, value]) => [key, Buffer.from(value)])),
    secrets: new Map(Object.entries(secrets).map(([key, value]) => [key, Buffer.from(value)])),
  };
}

test("trusted prepareAuthenticatedSession rewrite is not a SCOPE_VIOLATION", () => {
  const io = memoryIo({ [SESSION]: BEFORE });
  const started = base({ [SESSION]: BEFORE });
  io.writeBytes(SESSION, Buffer.from(AFTER));
  const adopted = adoptTrustedAuthSession(
    started,
    { status: "ready", path: SESSION, refreshed: true },
    io,
  );
  assert.equal(adopted.status, "continue");
  if (adopted.status !== "continue") return;
  assert.equal(adopted.session, "refreshed");
  assert.equal(adopted.adopted, true);
  const check = blockUnexpectedSecretChanges(adopted.baseline, io);
  assert.equal(check.blocked, false);
  assert.equal(check.files.length, 0);
  assert.equal(secretIssuePrintsContents(check.message, [BEFORE, AFTER]), false);

  const labeledReused = adoptTrustedAuthSession(
    base({ [SESSION]: BEFORE }),
    { status: "ready", path: SESSION, refreshed: false },
    io,
  );
  assert.equal(labeledReused.status, "continue");
  if (labeledReused.status !== "continue") return;
  assert.equal(labeledReused.session, "refreshed");
  assert.equal(blockUnexpectedSecretChanges(labeledReused.baseline, io).blocked, false);
});

test("Builder modification of the session file is restored and stays secret", () => {
  const io = memoryIo({ [SESSION]: BEFORE });
  io.writeBytes(SESSION, Buffer.from(AFTER));
  const adopted = adoptTrustedAuthSession(
    base({ [SESSION]: BEFORE }),
    { status: "ready", path: SESSION, refreshed: true },
    io,
  );
  assert.equal(adopted.status, "continue");
  if (adopted.status !== "continue") return;
  io.writeBytes(SESSION, Buffer.from(BUILDER));
  const check = blockUnexpectedSecretChanges(adopted.baseline, io);
  assert.equal(check.blocked, true);
  assert.deepEqual(check.files, [SESSION]);
  assert.equal(io.readBytes(SESSION)?.toString(), AFTER);
  assert.equal(secretIssuePrintsContents(check.message, [BEFORE, AFTER, BUILDER]), false);
  assert.equal(check.message, SECRET_FILE_BLOCKING_MESSAGE);
});

test("failed auth refresh is AUTH_SESSION_FAILURE", () => {
  const adopted = adoptTrustedAuthSession(base({ [SESSION]: BEFORE }), {
    status: "AUTH_SESSION_REFRESH_REQUIRED",
    reason: "AUTH_SESSION_REFRESH_REQUIRED",
  });
  assert.equal(adopted.status, "AUTH_SESSION_FAILURE");
  assert.equal(
    classifyFailure(
      snapshotFromLoop({
        issues: [
          {
            issue_id: "AUTH_SESSION_REFRESH_REQUIRED",
            classification: "AUTH_SESSION_REFRESH_REQUIRED",
          },
        ],
        qa: { status: "not_run" },
      }),
    ),
    "AUTH_SESSION_FAILURE",
  );
});

test("unexpected unrelated secret changes still block", () => {
  const envFile = ".env.local";
  const envBefore = "STRIPE_SECRET=sk_test_fakevalue";
  const io = memoryIo({ [SESSION]: BEFORE, [envFile]: envBefore });
  let started = base({ [SESSION]: BEFORE, [envFile]: envBefore });
  io.writeBytes(SESSION, Buffer.from(AFTER));
  started = acceptTrustedSecretFile(started, SESSION, io);
  io.writeBytes(envFile, Buffer.from("STRIPE_SECRET=sk_test_changed"));
  const check = blockUnexpectedSecretChanges(started, io);
  assert.equal(check.blocked, true);
  assert.deepEqual(check.files, [envFile]);
  assert.equal(io.readBytes(envFile)?.toString(), envBefore);
  assert.equal(secretIssuePrintsContents(check.message, [envBefore, "sk_test_changed", AFTER]), false);
  const decision = decideSupervisor(
    snapshotFromLoop({
      issues: [{ issue_id: "secret-file-modified", classification: "SCOPE_VIOLATION" }],
      qa: { status: "not_run" },
    }),
    emptySupervisorState(),
  );
  assert.equal(decision.classification, "ORCHESTRATION_FAILURE");
  assert.equal(decision.recommendation, "HUMAN_INTERVENTION_REQUIRED");
  assert.equal(decision.invokeBuilder, false);
});

test("after trusted refresh, only product files are judged against the new baseline", () => {
  const io = memoryIo({ [SESSION]: BEFORE, [PRODUCT]: "expect(true)" });
  let started = base({ [SESSION]: BEFORE }, { [PRODUCT]: "expect(true)" });
  io.writeBytes(SESSION, Buffer.from(AFTER));
  started = acceptTrustedSecretFile(started, SESSION, io);
  assert.equal(started.files.get(PRODUCT)?.toString(), "expect(true)");
  io.writeBytes(PRODUCT, Buffer.from("expect(product-changed)"));
  assert.equal(blockUnexpectedSecretChanges(started, io).blocked, false);
  assert.notEqual(started.files.get(PRODUCT)?.toString(), io.readBytes(PRODUCT)?.toString());
  assert.throws(() => acceptTrustedSecretFile(started, ".env.local", io));
});
