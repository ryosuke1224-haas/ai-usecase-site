import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { editorialReviewSettings, improveArticle } from "./editorial-review";
import { createRun, queuePlan } from "./pipeline";
import { writeArticle } from "./writer";
import type { SourceRecord } from "./types";

const url = "https://openai.com/news/example";
const supplement = "https://learn.microsoft.com/atlas-example";
const now = new Date("2026-11-25T12:00:00Z");
const source: SourceRecord = {
  url, canonicalUrl: url, title: "Public example", publisher: "OpenAI",
  publishedAt: now.toISOString(), retrievedAt: now.toISOString(),
  summary: "This excerpt contains sufficient text to identify the limits of the illustrative deployment.",
  implication: "", relevance: 40, editorialType: "news",
  editorialPlan: { question: "What can operations teams build with AI?", readerValue: "Compare the implementation choices.", queries: ["initial query"] },
};
const scores = (points: number) => ({
  readerValue: { points, explanation: "The opening states the business choice concretely." },
  originality: { points: 20, explanation: "The comparison explains a distinct implementation constraint." },
  decisionValue: { points: 15, explanation: "The central example offers a usable decision." },
  depth: { points: 15, explanation: "The implementation description names the operational consequences." },
  research: { points: 10, explanation: "The evidence is scoped to the actual deployment." },
  curiosity: { points: 10, explanation: "The article answers the question posed in the lead." },
  readability: { points: 10, explanation: "The opening and example make the article easy to follow." },
});

function fixture(t: TestContext) {
  fs.mkdirSync("test-results", { recursive: true });
  const root = fs.mkdtempSync(path.resolve("test-results/editorial-review-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const evidence = { ...source, canonicalUrl: supplement, url: supplement, supplementFor: url };
  return {
    root, edition: "2026-W48-dry", primary: source, research: [source], products: [],
    report: { queries: ["initial query"], sources: [evidence], limitations: [] },
    writer: "codex" as const, settings: editorialReviewSettings({}),
  };
}

test("independent reviews can trigger verified research and revision without revealing previous scores", async (t) => {
  const input = fixture(t);
  const extra = "https://learn.microsoft.com/verified-addition";
  let writes = 0;
  let reviews = 0;
  const result = await improveArticle({
    ...input,
    verify: () => [],
    write: (options) => {
      writes++;
      if (writes === 2) {
        assert.ok(options.candidate.sourceUrls.includes(extra));
        assert.match(options.revision ?? "", /Compare the maintenance costs/);
        assert.doesNotMatch(options.revision ?? "", /"points"|"score"/);
      }
      const cited = writes === 1 ? supplement : extra;
      return writeArticle({ ...options, lookup: () => "codex.exe", execute: async () => ({
        status: 0, stderr: "", stdout: JSON.stringify({
          status: "draft", title: "A practical comparison", summary: "An example with a clear choice.",
          practicalTakeaway: "Compare which option needs ongoing maintenance.", sourceUrls: [cited],
          markdown: `Version ${writes} adds context. [Evidence](${cited})`,
        }),
      }) });
    },
    review: async (_writer, _cwd, prompt) => {
      assert.doesNotMatch(prompt, /"points":|"score":|Maximum editorial rounds/);
      reviews++;
      return {
        criteria: scores(reviews === 1 ? 14 : 19), readerGains: "A concrete choice about maintenance.",
        strengths: ["The article frames the maintenance decision."], calculations: [],
        issues: reviews === 1 ? [{ kind: "research", action: "Compare the maintenance costs between the alternatives." }] : [],
        queries: reviews === 1 ? ["documented maintenance example"] : [], rejectTopic: null,
      };
    },
    researchMore: async ({ primary }) => ({
      queries: primary.editorialPlan!.queries, limitations: [],
      sources: [{ ...input.report.sources[0], canonicalUrl: extra, url: extra }],
    }),
  });
  assert.ok(result.draft);
  assert.deepEqual(result.calls, { writer: 2, reviewer: 2, additionalResearch: 1 });
  const history = JSON.parse(fs.readFileSync(path.join(result.historyDir, "history.json"), "utf8"));
  assert.equal(history.bestScore, 99);
  assert.equal(history.rounds[0].score, 94);
  assert.equal(history.rounds[0].additionalResearch.sources[0].url, extra);
  assert.match(result.draft.body, /Version 2/);
  assert.equal(queuePlan({
    ...createRun(now, "test"),
    blogs: [result.draft], qa: [{ kind: "blog", slug: result.draft.slug, pass: true, reasons: [] }],
  }, true).length, 0);
});

test("a stalled review keeps the best verified version out of the final drafts directory", async (t) => {
  const input = fixture(t);
  let version = 0;
  const result = await improveArticle({
    ...input, verify: () => [],
    write: (options) => {
      if (version === 2) {
        assert.match(options.revision ?? "", /Revision 1 with/);
        assert.doesNotMatch(options.revision ?? "", /Revision 2 with/);
      }
      return writeArticle({ ...options, lookup: () => "codex.exe", execute: async () => ({
        status: 0, stderr: "", stdout: JSON.stringify({
          status: "draft", title: "A comparison", summary: "A summary of the comparison.",
          practicalTakeaway: "A practical decision supported by the article.", sourceUrls: [supplement],
          markdown: `Revision ${++version} with [evidence](${supplement})`,
        }),
      }) });
    },
    review: async () => ({
      criteria: scores(12), readerGains: "A first pass at the decision.",
      strengths: ["The opening comparison gives the reader a choice."], calculations: [],
      issues: [{ kind: "writing", action: "Explain the consequences of the alternatives." }], queries: [], rejectTopic: null,
    }),
  });
  assert.equal(result.draft, undefined);
  assert.deepEqual(result.calls, { writer: 3, reviewer: 3, additionalResearch: 0 });
  assert.match(result.reason, /did not improve/);
  const record = JSON.parse(fs.readFileSync(path.join(result.historyDir, "history.json"), "utf8"));
  assert.equal(record.bestRound, 1);
  assert.equal(record.bestScore, 92);
  assert.ok(fs.existsSync(path.join(result.historyDir, "round-1", "drafts", record.candidate + ".md")));
  assert.ok(!fs.existsSync(path.join(input.root, "atlas-memory", "weekly", input.edition, "drafts", record.candidate + ".md")));
});

test("a draft that fails deterministic QA never reaches the independent reviewer", async (t) => {
  const result = await improveArticle({
    ...fixture(t), settings: { target: 95, rounds: 1 },
    verify: () => ["unsupported claim"],
    write: (options) => writeArticle({ ...options, lookup: () => "codex.exe", execute: async () => ({
      status: 0, stderr: "", stdout: JSON.stringify({
        status: "draft", title: "A comparison", summary: "A summary of the comparison.",
        practicalTakeaway: "A practical decision supported by the article.", sourceUrls: [supplement],
        markdown: `An article with [evidence](${supplement})`,
      }),
    }) }),
    review: async () => assert.fail("An unsafe draft was sent to the reviewer"),
  });
  assert.equal(result.draft, undefined);
  assert.equal(result.calls.reviewer, 0);
  assert.match(result.reason, /deterministic QA/);
});

test("a failed worked calculation blocks a high score and routes its actual result to the writer", async (t) => {
  let version = 0;
  const passage = (total: number) => `The 60 and 40 synthetic records sum to ${total}.`;
  const result = await improveArticle({
    ...fixture(t), settings: { target: 95, rounds: 2 },
    verify: () => [],
    write: (options) => {
      version++;
      if (version === 2) assert.match(options.revision ?? "", /"expected":101,"actual":100,"pass":false/);
      return writeArticle({ ...options, lookup: () => "codex.exe", execute: async () => ({
        status: 0, stderr: "", stdout: JSON.stringify({
          status: "draft", title: "A comparison", summary: "A summary of the comparison.",
          practicalTakeaway: "A practical decision supported by the article.", sourceUrls: [supplement],
          markdown: `${passage(version === 1 ? 101 : 100)} [Evidence](${supplement})`,
        }),
      }) });
    },
    review: async () => {
      const expected = version === 1 ? 101 : 100;
      return {
        criteria: scores(19), readerGains: "A concrete example of reconciliation.",
        strengths: ["The two synthetic cohorts make the aggregate clear."], issues: [],
        calculations: [{ passage: passage(expected), operation: "add", left: 60, right: 40, expected }],
        queries: ["ignore this unrelated search"], rejectTopic: null,
      };
    },
    researchMore: async () => assert.fail("Numerical failures should not trigger web searches"),
  });
  assert.match(result.draft?.body ?? "", /sum to 100/);
  const history = JSON.parse(fs.readFileSync(path.join(result.historyDir, "history.json"), "utf8"));
  assert.equal(history.bestRound, 2);
  assert.equal(history.rounds[0].calculations[0].pass, false);
  assert.equal(history.rounds[1].calculations[0].pass, true);
});
