import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { AgentTimeoutError } from "../atlas-agent/cursor-cli";
import { blogDraft } from "./drafts";
import { queuePlan, runUntilSettled } from "./pipeline";
import { researchPackage, saveResearchPackage } from "./research-package";
import { resolveWeeklyRun } from "./resolve-run";
import type { SourceRecord } from "./types";
import { codexLaunch, selectWriter, writeArticle } from "./writer";

const now = new Date("2026-11-16T00:00:00Z");
const primary: SourceRecord = {
  url: "https://openai.com/support-agent",
  canonicalUrl: "https://openai.com/support-agent",
  title: "OpenAI agent update for support teams",
  publisher: "OpenAI",
  publishedAt: "2026-11-14T00:00:00Z",
  retrievedAt: now.toISOString(),
  summary: "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.",
  relevance: 48,
  implication: "A support lead can review drafts before sending.",
};
const products = [{ slug: "ai-customer-response-assistant", name: "Reply Review Queue" }];
const draft = blogDraft(primary, "2026-W47-dry", products);
const metadata = {
  status: "draft",
  title: draft.title,
  summary: draft.summary,
  practicalTakeaway: "送信前に担当者を決めて、返信案と元の問い合わせを照合します。",
  sourceUrls: [primary.canonicalUrl],
};

function rootFor(t: TestContext) {
  const dir = path.resolve("test-results");
  mkdirSync(dir, { recursive: true });
  const root = mkdtempSync(path.join(dir, "weekly-writer-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function fixture(t: TestContext) {
  const root = rootFor(t);
  const supportingUrl = "https://docs.example.com/support-agent";
  const otherUrl = "https://example.com/nato";
  const pkg = researchPackage({
    root,
    edition: "2026-W47-dry",
    primary,
    products,
    research: [
      primary,
      { ...primary, url: supportingUrl, canonicalUrl: supportingUrl, publisher: "Docs",
        summary: '<img src="https://docs.example.com/preview.png">The support agent exposes reply approvals for customer support teams. It supports up to 3% sampling.' },
      { ...primary, url: otherUrl, canonicalUrl: otherUrl, publisher: "NATO", title: "NATO defence procurement",
        summary: "NATO announces military purchases for allied government and procurement." },
    ],
  });
  saveResearchPackage(pkg);
  const { candidate } = pkg;
  return { root, candidate, file: path.join(candidate.outputDir, candidate.id), supportingUrl, otherUrl };
}

test("writer selection defaults to manual and rejects unsupported values", () => {
  assert.equal(selectWriter(""), "none");
  assert.equal(selectWriter("none"), "none");
  assert.equal(selectWriter("cursor"), "cursor");
  assert.equal(selectWriter("codex"), "codex");
  assert.throws(() => selectWriter("automatic"), /ATLAS_WRITER/);
});

test("research artifacts contain relevant evidence, dates, claims, and known blueprint links", (t) => {
  const { candidate, supportingUrl, otherUrl } = fixture(t);
  const read = (file: string) => readFileSync(path.join(candidate.researchDir, file), "utf8");
  const brief = JSON.parse(read("brief.json"));
  const sources = JSON.parse(read("sources.json"));
  assert.ok(brief.question.length > 12);
  assert.equal(brief.primarySourceUrl, primary.canonicalUrl);
  assert.deepEqual(brief.primaryAttribution, {
    publisher: "OpenAI",
    publicationDate: "2026-11-14",
    evidenceType: "publisher feed",
  });
  assert.deepEqual(brief.supportingSourceUrls, [supportingUrl]);
  assert.equal(brief.existingBlueprints[0].path, "/blueprints/ai-customer-response-assistant");
  assert.equal(sources[0].publishedAt, primary.publishedAt);
  assert.deepEqual(sources[1].quantitativeClaims, ["3%"]);
  assert.ok(!sources[1].factExcerpt.includes("preview.png"));
  assert.ok(!read("sources.json").includes(otherUrl));
  assert.match(read("instructions.md"), /Japanese editorial/);
  assert.match(read("instructions.md"), /仕事でどう使える？/);
  assert.match(read("instructions.md"), /arrows .*four stages/);
  assert.match(read("instructions.md"), /YYYY-MM-DD/);
  assert.match(read("instructions.md"), /今試してよい.*現実的.*待つ/);
});

test("Cursor uses ask mode and confines its workspace to the candidate package", async (t) => {
  const { candidate, file } = fixture(t);
  const result = await writeArticle({
    writer: "cursor",
    candidate,
    lookup: () => "fake-agent.exe",
    execute: async (command, env, timeout, options) => {
      assert.equal(command.command, "fake-agent.exe");
      assert.equal(command.shell, false);
      assert.deepEqual(command.args.slice(0, 3), ["-p", "--mode", "ask"]);
      assert.equal(command.args[command.args.indexOf("--workspace") + 1], candidate.researchDir);
      assert.match(command.args.at(-1)!, /Read brief.json and sources.json/);
      assert.equal(options.cwd, candidate.researchDir);
      assert.ok(timeout > 0);
      assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
      return { status: 0, stdout: JSON.stringify({ ...metadata, markdown: draft.body }), stderr: "" };
    },
  });
  assert.equal(result.status, "draft");
  assert.equal(JSON.parse(readFileSync(file + ".json", "utf8")).status, "draft");
  assert.equal(readFileSync(file + ".md", "utf8").trim(), draft.body.trim());
});

test("read-only Codex receives all research over stdin and the host writes only draft artifacts", async (t) => {
  const { candidate, file, otherUrl } = fixture(t);
  const packageFiles = ["brief.json", "sources.json", "instructions.md"];
  const read = (name: string) => readFileSync(path.join(candidate.researchDir, name), "utf8");
  const packageContent = Object.fromEntries(packageFiles.map((name) => [name, read(name)]));
  const executable = codexLaunch("codex.exe");
  assert.deepEqual(executable.args.slice(0, 6), ["--ask-for-approval", "never", "exec", "--sandbox", "read-only", "--ephemeral"]);
  assert.equal(executable.args.at(-1), "-");
  assert.ok(executable.args.includes("forced_login_method='chatgpt'"));
  assert.equal(codexLaunch("codex.ps1").command, "powershell.exe");
  const result = await writeArticle({
    writer: "codex",
    candidate,
    lookup: () => "codex.exe",
    execute: async (command, env, timeout, options) => {
      assert.deepEqual(command, executable);
      assert.equal(timeout, 1_000);
      assert.equal(env.OPENAI_API_KEY, undefined);
      assert.equal(options.cwd, candidate.researchDir);
      assert.match(options.stdin!, /Do not use tools, access the filesystem or network, or write files/);
      assert.ok(command.args.every((arg) => !arg.includes(candidate.outputDir)));
      assert.ok(!command.args.includes("--add-dir"));
      assert.ok(!options.stdin?.includes(otherUrl));
      assert.deepEqual(JSON.parse(options.stdin!.split("\n").at(-1)!), packageContent);
      assert.deepEqual(readdirSync(candidate.outputDir), []);
      return { status: 0, stdout: JSON.stringify({ ...metadata, markdown: draft.body }), stderr: "" };
    },
    timeoutMs: 1_000,
  });
  assert.equal(result.status, "draft");
  assert.deepEqual(readdirSync(candidate.outputDir).sort(), [candidate.id + ".json", candidate.id + ".md"]);
  assert.deepEqual(JSON.parse(readFileSync(file + ".json", "utf8")), metadata);
  assert.equal(readFileSync(file + ".md", "utf8").trim(), draft.body.trim());
  assert.deepEqual(readdirSync(candidate.researchDir).sort(), packageFiles.slice().sort());
  assert.deepEqual(Object.fromEntries(packageFiles.map((name) => [name, read(name)])), packageContent);
});

test("nonzero writer exits preserve child output locally without adding it to run history or drafts", async (t) => {
  const { candidate } = fixture(t);
  const child = { status: 1, stdout: "Partial response", stderr: "Error: child startup failed" };
  const run = () => writeArticle({
    writer: "codex", candidate, lookup: () => "codex.exe", execute: async () => child,
  });
  const results = await Promise.all([run(), run()]);
  const diagnostics = path.join(path.dirname(candidate.outputDir), "writer-errors");
  const logs = readdirSync(diagnostics);
  assert.equal(logs.length, 2);
  for (const result of results) {
    if (result.status !== "failed") assert.fail(JSON.stringify(result));
    assert.match(result.reason, /codex CLI failed \(exit 1\)/);
    assert.ok(!result.reason.includes(child.stdout) && !result.reason.includes(child.stderr));
  }
  for (const log of logs) {
    assert.ok(results.some((result) => result.status === "failed" && result.reason.endsWith(log + ".")));
    assert.deepEqual(JSON.parse(readFileSync(path.join(diagnostics, log), "utf8")), { writer: "codex", ...child });
  }
  assert.deepEqual(readdirSync(candidate.outputDir), []);
});

test("missing or unreadable research produces a structured rejection without invoking Codex", async (t) => {
  for (const name of ["brief.json", "sources.json", "instructions.md"]) {
    const { candidate, file } = fixture(t);
    const input = path.join(candidate.researchDir, name);
    unlinkSync(input);
    if (name === "sources.json") mkdirSync(input);
    const result = await writeArticle({
      writer: "codex", candidate, lookup: () => "codex.exe",
      execute: async () => assert.fail("Codex was invoked with an incomplete package"),
    });
    if (result.status !== "rejected") assert.fail(JSON.stringify(result));
    assert.ok(result.reason.includes(name));
    assert.deepEqual(JSON.parse(readFileSync(file + ".json", "utf8")), result);
    assert.ok(!existsSync(file + ".md"));
  }
});

test("manual mode waits for files and parses a successful draft without executing a CLI", async (t) => {
  const { candidate, file } = fixture(t);
  const input = { writer: "none" as const, candidate, execute: async () => assert.fail("CLI executed") };
  assert.deepEqual(await writeArticle(input), { status: "pending" });
  writeFileSync(file + ".json", JSON.stringify(metadata));
  assert.deepEqual(await writeArticle(input), { status: "pending" });
  writeFileSync(file + ".md", draft.body);
  const result = await writeArticle(input);
  assert.equal(result.status, "draft");
  if (result.status === "draft") assert.equal(result.draft.status, "READY_FOR_REVIEW");
});

test("timeouts, command failures, and malformed CLI output do not create artifacts or fall back", async (t) => {
  const { candidate, file } = fixture(t);
  let calls = 0;
  const results = [
    async () => { throw new AgentTimeoutError("spec", 20); },
    async () => ({ status: 7, stdout: "", stderr: "untrusted diagnostics" }),
    async () => ({ status: 0, stdout: '{"status":"draft"}', stderr: "" }),
  ];
  for (const [index, execute] of results.entries()) {
    const outcome = await writeArticle({
      writer: "codex", candidate, lookup: () => "codex.exe",
      execute: async () => { calls += 1; return execute(); },
    });
    assert.equal(outcome.status, "failed");
    if (outcome.status === "failed") assert.match(outcome.reason, [/timed out/, /exit 7/, /Malformed/][index]);
    assert.ok(!existsSync(file + ".json") && !existsSync(file + ".md"));
  }
  assert.equal(calls, 3);
});

test("rejects unknown Markdown and metadata URLs, leaked labels, and missing takeaway", async (t) => {
  const { candidate, file, otherUrl } = fixture(t);
  for (const [patch, body, reason] of [
    [{ sourceUrls: [...metadata.sourceUrls, otherUrl] }, draft.body, /unsupported source URL/],
    [{}, draft.body + `\n[unknown](${otherUrl})`, /unsupported source URL/],
    [{}, draft.body + "\n\nPRODUCT_DOC", /internal role/],
    [{}, draft.body + "\n\n## ソース2", /source by source/],
    [{ practicalTakeaway: "" }, draft.body, /Malformed/],
    [{ practicalTakeaway: "成功率は90%" }, draft.body, /unsupported quantitative claim/],
  ] as const) {
    writeFileSync(file + ".md", body);
    writeFileSync(file + ".json", JSON.stringify({ ...metadata, ...patch }));
    const result = await writeArticle({ writer: "none", candidate });
    assert.equal(result.status, "failed");
    if (result.status === "failed") assert.match(result.reason, reason);
  }
});

test("dry runs resume manual drafts, execute a mocked writer, and never insert", async (t) => {
  const root = rootFor(t);
  const { state } = resolveWeeklyRun({ root, now, rerun: false, dryRun: true });
  assert.match(state.weekKey, /-dry$/);
  assert.notEqual(state.weekKey, resolveWeeklyRun({ root, now, rerun: false }).state.weekKey);
  const deps = {
    root, now, products, knownUrls: [], knownTitles: [], dryRun: true,
    fetchSources: async () => [primary],
    queue: { insert: async (): Promise<"inserted"> => assert.fail("dry run wrote to the queue") },
  };
  const waiting = await runUntilSettled(state, deps);
  assert.equal(waiting.stage, "BLOG_DRAFT");
  assert.ok(waiting.pendingDrafts?.length);
  const finished = await runUntilSettled(waiting, {
    ...deps, writer: "codex",
    writeArticle: ({ writer, candidate }) => writeArticle({
      writer, candidate, lookup: () => "codex.exe",
      execute: async () => ({
        status: 0, stderr: "",
        stdout: JSON.stringify(candidate.primaryUrl === primary.canonicalUrl
          ? { ...metadata, markdown: draft.body }
          : { status: "rejected", reason: "Thin evidence" }),
      }),
    }),
  });
  assert.equal(finished.stage, "DONE");
  assert.equal(finished.status, "succeeded");
  assert.equal(finished.counts.queued, 0);
  assert.equal(finished.writerRejections?.length, 1);
  assert.equal(finished.counts.qaRejected, 1);
  const plan = queuePlan(finished);
  assert.ok(plan.some((item) => item.kind === "blog"));
  assert.ok(plan.every(({ draft }) => draft.status === "READY_FOR_REVIEW"));
  assert.ok(!plan.some(({ draft }) => draft.slug === finished.writerRejections?.[0].slug));

  // Queue history blocks an existing title even if a new source URL was selected.
  const duplicateCheck = await runUntilSettled(
    { ...finished, stage: "QA", status: "running", completed: finished.completed.filter((stage) => stage !== "QA" && stage !== "REVIEW_QUEUE") },
    { ...deps, knownTitles: [draft.title] },
  );
  assert.ok(duplicateCheck.qa.some(({ reasons }) => reasons.includes("near-duplicate article")));
  assert.ok(!queuePlan(duplicateCheck).some((item) => item.kind === "blog"));
});
