import fs from "node:fs";
import path from "node:path";
import type { QaFailure } from "./schema";
import { redact, tail } from "./redact";

type QaReport = {
  status: "pass" | "fail" | "blocked";
  tests_passed: number;
  tests_failed: number;
  tests_skipped: number;
  blocking_issues: QaIssue[];
  evidence?: { screenshots?: string[]; traces?: string[] };
  human_action_required?: string[];
};

type QaIssue = {
  id?: string;
  severity?: string;
  title?: string;
  detail?: string;
  test?: string;
};

export type QaRunResult = {
  reportPath: string | null;
  report: QaReport | null;
  failures: QaFailure[];
};

export function listQaReports(): string[] {
  const directory = path.join(process.cwd(), "agent-reports");
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => /^\d{8}T\d{6}Z-(?:qa|daily-inbox-briefing)\.json$/.test(name))
    .map((name) => `agent-reports/${name}`)
    .sort();
}

export function readNewQaReport(before: string[]): QaRunResult {
  const created = listQaReports().filter((file) => !before.includes(file));
  const reportPath = created.at(-1) ?? null;
  if (!reportPath) {
    return {
      reportPath: null,
      report: null,
      failures: [
        failure({
          issue_id: "qa-report-missing",
          test: "npm run qa",
          expected: "QA writes a structured report.",
          actual: "No new QA report was written.",
          classification: "QA_FAILURE",
        }),
      ],
    };
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  if (!isReport(parsed)) {
    return {
      reportPath,
      report: null,
      failures: [
        failure({
          issue_id: "qa-report-unreadable",
          test: "npm run qa",
          expected: "QA report matches atlas-qa-report-v0.",
          actual: `Could not read ${reportPath}.`,
          classification: "QA_FAILURE",
        }),
      ],
    };
  }
  return {
    reportPath,
    report: parsed,
    failures: parsed.status === "pass" ? [] : failuresFromReport(parsed),
  };
}

function failuresFromReport(report: QaReport): QaFailure[] {
  const evidence = [
    ...(report.evidence?.screenshots ?? []),
    ...(report.evidence?.traces ?? []),
  ].map((item) => item.replace(/\\/g, "/"));
  if (report.blocking_issues.length === 0) {
    return [
      failure({
        issue_id: "qa-status-fail",
        test: "npm run qa",
        expected: "QA status is pass.",
        actual: `QA status is ${report.status}.`,
        evidence,
        classification: "QA_FAILURE",
      }),
    ];
  }
  return report.blocking_issues.map((issue) => {
    const detail = tail(redact(issue.detail || issue.title || "The check failed."), 1500);
    const split = splitExpected(detail);
    return failure({
      issue_id: issue.id || issue.title || "qa-failure",
      test: issue.test || issue.title || "QA check",
      expected: split.expected,
      actual: split.actual,
      evidence,
      relevant_files: repoPaths(detail),
      classification: issue.id === "build" ? "BUILD_FAILURE" : issue.id === "validate-content" ? "VALIDATION_FAILURE" : "QA_FAILURE",
      severity: issue.severity === "non_blocking" ? "non_blocking" : "blocking",
    });
  });
}

function splitExpected(detail: string): { expected: string; actual: string } {
  const expected = detail.match(/Expected:?\s*([\s\S]*?)(?:\nReceived:|\nCall log:|\n\n|$)/i);
  const received = detail.match(/Received:?\s*([\s\S]*?)(?:\nCall log:|\n\n|$)/i);
  return {
    expected: expected?.[1]?.trim() || "The check should pass.",
    actual: received?.[1]?.trim() || detail,
  };
}

function repoPaths(detail: string): string[] {
  const matches = detail.match(/[A-Za-z0-9_./-]+\.(?:tsx?|jsx?|json|md)/g) ?? [];
  return [...new Set(matches.map((item) => item.replace(/\\/g, "/")).filter((item) => !item.includes("..")))];
}

function failure(
  input: Omit<QaFailure, "severity" | "evidence" | "relevant_files"> &
    Partial<Pick<QaFailure, "severity" | "evidence" | "relevant_files">>,
): QaFailure {
  return {
    severity: input.severity ?? "blocking",
    evidence: input.evidence ?? [],
    relevant_files: input.relevant_files ?? [],
    issue_id: input.issue_id,
    test: input.test,
    expected: input.expected,
    actual: input.actual,
    classification: input.classification,
  };
}

function isReport(value: unknown): value is QaReport {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    (record.status === "pass" || record.status === "fail" || record.status === "blocked") &&
    typeof record.tests_passed === "number" &&
    typeof record.tests_failed === "number" &&
    typeof record.tests_skipped === "number" &&
    Array.isArray(record.blocking_issues)
  );
}
