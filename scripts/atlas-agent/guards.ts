import type { QaFailure } from "./schema";

export type FileChange = {
  path: string;
  before: string | null;
  after: string | null;
};

export type GuardIssue = QaFailure;

const ALWAYS_PROTECTED = [
  "package.json",
  "package-lock.json",
  ".gitignore",
  "agents/standards.md",
  "agents/builder.md",
  "agents/task.schema.json",
  "agents/builder-report.schema.json",
  "agents/qa-failure.schema.json",
  "agents/loop-result.schema.json",
  "agents/evaluator-hook.schema.json",
  "agents/evaluator-output.schema.json",
  "agents/evaluator-report.schema.json",
  "agents/evaluator.md",
  "scripts/run-atlas-agent-loop.ts",
];

const ALWAYS_PROTECTED_PREFIXES = ["scripts/atlas-agent/"];

const QA_PROTECTED = [
  "playwright.config.ts",
  "scripts/run-atlas-qa.ts",
  "scripts/check-daily-inbox-spec.ts",
  "scripts/save-atlas-qa-session.ts",
  "agents/qa.md",
  "agents/qa-report.schema.json",
];

const QA_PROTECTED_PREFIXES = ["e2e/"];

const SKIP_PATTERN = /\b(?:test|it|describe)\.(?:skip|fixme)\b/g;
const TEST_FILE = /\.(?:spec|test)\.[cm]?[jt]sx?$/;

export function pathMatches(file: string, patterns: string[]): boolean {
  const normalized = file.replace(/\\/g, "/");
  return patterns.some((pattern) => {
    const entry = pattern.replace(/\\/g, "/").replace(/\/$/, "");
    return normalized === entry || normalized.startsWith(`${entry}/`);
  });
}

export function isAlwaysProtected(file: string, taskPath: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  if (normalized === taskPath.replace(/\\/g, "/")) return true;
  if (ALWAYS_PROTECTED.includes(normalized)) return true;
  return ALWAYS_PROTECTED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function isQaProtected(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  if (QA_PROTECTED.includes(normalized)) return true;
  return QA_PROTECTED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function countSkips(text: string | null): number {
  if (!text) return 0;
  return [...text.matchAll(SKIP_PATTERN)].length;
}

function countExpects(text: string | null): number {
  if (!text) return 0;
  return [...text.matchAll(/\bexpect\s*\(/g)].length;
}

export function guardChanges(input: {
  changes: FileChange[];
  scope: string[];
  forbidden: string[];
  permitsQaChanges: boolean;
  taskPath: string;
}): { keep: string[]; restore: string[]; issues: GuardIssue[] } {
  const keep: string[] = [];
  const restore: string[] = [];
  const issues: GuardIssue[] = [];

  for (const change of input.changes) {
    const file = change.path.replace(/\\/g, "/");
    if (isAlwaysProtected(file, input.taskPath)) {
      restore.push(file);
      issues.push(violation(file, "TEST_PROTECTION_VIOLATION", "Protected orchestration file changed."));
      continue;
    }
    if (!input.permitsQaChanges && isQaProtected(file)) {
      restore.push(file);
      issues.push(
        violation(
          file,
          "TEST_PROTECTION_VIOLATION",
          "QA infrastructure changed, and this task does not permit QA changes.",
        ),
      );
      continue;
    }
    if (pathMatches(file, input.forbidden) || !pathMatches(file, input.scope)) {
      restore.push(file);
      issues.push(
        violation(
          file,
          "SCOPE_VIOLATION",
          "The change is outside the task scope or matches forbidden_changes.",
        ),
      );
      continue;
    }
    if (weakensTests(file, change)) {
      restore.push(file);
      issues.push(
        violation(
          file,
          "TEST_PROTECTION_VIOLATION",
          "The change skips a test or removes an assertion.",
        ),
      );
      continue;
    }
    keep.push(file);
  }

  return { keep, restore, issues };
}

function weakensTests(file: string, change: FileChange): boolean {
  if (!TEST_FILE.test(file) && !file.endsWith(".ts") && !file.endsWith(".tsx")) {
    return false;
  }
  if (!TEST_FILE.test(file) && countSkips(change.after) <= countSkips(change.before)) {
    return false;
  }
  if (countSkips(change.after) > countSkips(change.before)) return true;
  if (TEST_FILE.test(file) && countExpects(change.after) < countExpects(change.before)) return true;
  return false;
}

function violation(
  file: string,
  classification: GuardIssue["classification"],
  reason: string,
): GuardIssue {
  return {
    issue_id: `${classification}:${file}`,
    test: file,
    severity: "blocking",
    expected: "The Builder stays inside the task and does not weaken tests.",
    actual: reason,
    evidence: [],
    relevant_files: [file],
    classification,
  };
}
