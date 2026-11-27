import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { AgentTimeoutError, runCursorAgent } from "../atlas-agent/cursor-cli";
import { blogDraft, newsletterDraft } from "./drafts";
import { fieldNoteSources } from "./editorial-brief";
import { researchTopic } from "./live-research";
import { queuePlan, runUntilSettled } from "./pipeline";
import { researchPackage, saveResearchPackage } from "./research-package";
import { resolveWeeklyRun } from "./resolve-run";
import { reviewItems } from "./qa";
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
  assert.doesNotMatch(read("instructions.md"), /仕事でどう使える|Atlasの見方|明日試すなら/);
  assert.equal(brief.editorial.articleType, "news");
  assert.match(brief.editorial.centralQuestion, /What changed/);
  assert.ok(brief.editorial.limitations.length);
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
      assert.ok(command.args.at(-1)!.includes(readFileSync(path.join(__dirname, "editorial-policy.md"), "utf8").trim()));
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
  assert.ok(executable);
  assert.deepEqual(executable.args.slice(0, 6), ["--ask-for-approval", "never", "exec", "--sandbox", "read-only", "--ephemeral"]);
  assert.equal(executable.args.at(-1), "-");
  assert.ok(executable.args.includes("forced_login_method='chatgpt'"));
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
      assert.ok(options.stdin!.includes(readFileSync(path.join(__dirname, "editorial-policy.md"), "utf8").trim()));
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

test("Windows npm Codex prefers the native executable and forwards arguments and UTF-8 without PowerShell", {
  skip: process.platform !== "win32",
}, async (t) => {
  const root = path.join(rootFor(t), "npm prefix with spaces");
  const shim = path.join(root, "codex.ps1");
  const modules = path.join(root, "node_modules", "@openai");
  const launcher = path.join(modules, "codex", "bin", "codex.js");
  const platformPackage = path.join(modules, `codex-win32-${process.arch}`);
  const target = process.arch === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc";
  const native = path.join(platformPackage, "vendor", target, "bin", "codex.exe");
  assert.equal(codexLaunch(shim), null);

  mkdirSync(path.dirname(launcher), { recursive: true });
  writeFileSync(shim, "throw 'The PowerShell shim must never be invoked.'");
  writeFileSync(launcher, `
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      process.stdout.write(JSON.stringify({
        args: process.argv.slice(2),
        cwd: process.cwd(),
        input: Buffer.concat(chunks).toString("utf8"),
      }));
      process.stderr.write("診断");
      process.exitCode = 1;
    });
  `);
  const fallback = codexLaunch(shim);
  assert.ok(fallback);
  assert.equal(fallback.command, process.execPath);
  const direct = codexLaunch("codex.exe");
  assert.ok(direct);
  assert.deepEqual(fallback.args, [launcher, ...direct.args]);

  mkdirSync(path.dirname(native), { recursive: true });
  writeFileSync(path.join(platformPackage, "package.json"), "{}");
  writeFileSync(native, "");
  assert.deepEqual(codexLaunch(shim), { ...direct, command: native });

  const input = "研究パッケージ\n引用符: \"例\"\n";
  const result = await runCursorAgent(fallback, process.env, 10_000, { cwd: root, stdin: input, echo: false, role: "spec" });
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "診断");
  assert.deepEqual(JSON.parse(result.stdout), { args: direct.args, cwd: root, input });
});

const freeformNews = `OpenAIは問い合わせへの返信案を送信前に確認できる仕組みを案内した。担当者が毎回文面を作る運用では、書くことと、何を顧客に約束できるかを判断することが同じ画面に並ぶ。

返信案を自動で用意できるようになると、管理者が見るべきものは例文の出来だけではなくなる。条件の外れた問い合わせが、判断できる担当に戻るかも重要だ。確認待ちが集中するなら、文面を作る時間だけを測っても全体の変化は分からない。

案内から分かるのは確認を組み込めることまでだ。現場の処理時間や顧客の評価が改善したかは、個別の導入条件と結果を見て判断する必要がある。

[OpenAIの案内](${primary.canonicalUrl})`;

test("typed news can pass with a free structure but cannot add unverified citations or claims", async (t) => {
  const { candidate } = fixture(t);
  const markdown = freeformNews;
  const outcome = await writeArticle({
    writer: "codex", candidate, lookup: () => "codex.exe",
    execute: async () => ({ status: 0, stdout: JSON.stringify({
      ...metadata, title: "返信案が先にできると、誰が例外を引き取るのか", markdown,
    }), stderr: "" }),
  });
  if (outcome.status !== "draft") assert.fail(JSON.stringify(outcome));
  const review = (body: string) => reviewItems({
    now, sources: [primary], blogs: [{ ...outcome.draft, body }], newsletter: null, blueprints: [],
    knownUrls: [], knownSlugs: products.map(({ slug }) => slug), knownTitles: [],
  })[0];
  assert.deepEqual(review(markdown).reasons, []);
  assert.ok(review(markdown + "\n[不明](https://example.com/unknown)").reasons.includes("unverified citation"));
  assert.ok(review(markdown + "\n処理時間は40%減った。").reasons.includes("unsupported claim"));
});

test("field notes use curated excerpts and stay out of the public digest and queue", async (t) => {
  const root = rootFor(t);
  const directory = path.join(root, "atlas-memory", "field-notes");
  mkdirSync(directory, { recursive: true });
  const privateText = "Private fixture text must never enter a research package.";
  const meta = {
    topic: "Diagnosing a broken Windows process startup", editorialType: "field-note",
    tags: ["windows"], publicationEligible: true, reviewStatus: "pending",
    publicEvidence: "A Windows automation harness rejected a standalone stdin argument before its script body started. Native process invocation subsequently passed the argument through correctly.",
    lesson: "Test the exact arguments passed through the automation path.",
  };
  const noteFile = path.join(directory, "new-custom-note.md");
  const writeNote = () => writeFileSync(noteFile, `---\n${JSON.stringify(meta)}\n---\n${privateText}`);
  writeNote();
  assert.deepEqual(fieldNoteSources(root, now.toISOString()), []);
  const [preview] = fieldNoteSources(root, now.toISOString(), true);
  assert.equal(preview.publicationEligible, false);
  meta.reviewStatus = "approved";
  writeNote();
  const [note] = fieldNoteSources(root, now.toISOString());
  assert.ok(note.internal);
  assert.equal(note.publicationEligible, true);
  const weekKey = "2026-W47-dry";
  const pkg = researchPackage({ root, edition: weekKey, primary: note, research: [note], products: [] });
  assert.equal(pkg.brief.editorial.articleType, "field-note");
  assert.ok(!JSON.stringify(pkg).includes(privateText));
  const article = { ...draft, slug: pkg.candidate.id, internal: true, canonicalUrl: note.canonicalUrl };
  const state = {
    ...resolveWeeklyRun({ root, now, dryRun: true, rerun: false }).state,
    blogs: [article],
    qa: [{ kind: "blog" as const, slug: article.slug, pass: true, reasons: [] }],
  };
  assert.deepEqual(queuePlan(state), []);
  assert.equal(newsletterDraft(weekKey, [article]), null);
  const publicDraft = { ...article, internal: false, sourceUrls: [] };
  assert.equal(queuePlan({ ...state, blogs: [publicDraft] }).length, 1);
  assert.ok(newsletterDraft(weekKey, [publicDraft]));
});

test("live research requires an actual page match and never fetches unapproved destinations", async () => {
  const excerpt = "OpenAI described an agent update that helps support teams review replies before anything is sent to a customer.";
  const visited: string[] = [];
  const report = await researchTopic({
    primary, question: "Can support teams triage and review replies?", gap: "official product support",
    writer: "codex", cwd: process.cwd(),
    search: async (_cwd, prompt) => {
      assert.match(prompt, /official documentation/);
      return [
        { url: "https://openai.com/support-agent-docs", excerpt },
        { url: "https://openai.com/unverified", excerpt },
        { url: "https://example.net/unsafe", excerpt },
      ];
    },
    fetchPage: async (url, options) => {
      visited.push(String(url));
      assert.equal(options?.redirect, "error");
      const body = String(url).endsWith("docs") ? excerpt : "Different content.";
      return new Response(`<title>OpenAI support agent documentation</title><p>${body}</p>`, { headers: { "content-type": "text/html" } });
    },
  });
  assert.equal(report.queries.length, 2);
  assert.deepEqual(visited, ["https://openai.com/support-agent-docs", "https://openai.com/unverified"]);
  assert.deepEqual(report.sources.map(({ summary, evidenceRole }) => [summary, evidenceRole]), [[excerpt, "primary"]]);
  assert.ok(report.limitations.length);
});

test("editorial depth requires distinct passages and verified additional citations", async (t) => {
  const { candidate } = fixture(t);
  const url = "https://openai.com/fetched-support";
  const paragraphs = freeformNews.split("\n\n");
  const markdown = `${freeformNews}\n\n[補足資料](${url})`;
  const output = { ...metadata, markdown, sourceUrls: [primary.canonicalUrl, url],
    depthEvidence: { industryContext: paragraphs[0], limitations: paragraphs[2] } };
  const run = (patch: Partial<typeof output>) => writeArticle({
    writer: "codex",
    candidate: { ...candidate, sourceUrls: [...candidate.sourceUrls, url], supplementalUrls: [url],
      requiredSupplement: true, depthRequirements: ["industryContext", "limitations"] },
    lookup: () => "codex.exe",
    execute: async () => ({ status: 0, stderr: "", stdout: JSON.stringify({ ...output, ...patch }) }),
  });
  assert.deepEqual(await run({ depthEvidence: { industryContext: paragraphs[0], limitations: paragraphs[0] } }),
    { status: "rejected", reason: "Draft did not demonstrate the required topic-specific depth." });
  const missingCitation = await run({ sourceUrls: [primary.canonicalUrl] });
  assert.deepEqual(missingCitation, { status: "rejected", reason: "Draft did not cite any verified additional research." });
  assert.equal((await run({})).status, "draft");
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
          ? { ...metadata, markdown: freeformNews }
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
