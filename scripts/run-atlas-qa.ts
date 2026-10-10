/**
 * Atlas QA v0.
 * Validates content, checks the Daily Inbox spec, builds, runs browser tests,
 * and writes a report. Does not edit application code.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { checkDailyInboxSpec } from "./check-daily-inbox-spec";

type StepStatus = "pass" | "fail" | "skipped" | "blocked";
type ReportStatus = "pass" | "fail" | "blocked";

type StepResult = {
  status: StepStatus;
  duration_ms: number;
  detail: string;
};

type Issue = {
  id: string;
  severity: "blocking" | "non_blocking";
  title: string;
  detail: string;
  project?: string;
  test?: string;
};

type CollectedTest = {
  project: string;
  title: string;
  status: "passed" | "failed" | "skipped";
  detail: string;
  skipReason: string;
  consoleErrors: string[];
  ignoredConsole: string[];
  screenshots: string[];
  traces: string[];
};

const PLAYWRIGHT_JSON = path.join("agent-reports", "playwright-results.json");

function redact(input: string): string {
  const plain = input.replace(/\u001b\[[0-9;]*m/g, "");
  return plain
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
      "[redacted-jwt]",
    )
    .replace(
      /((?:access_token|refresh_token|code|token)=)[^&\s]+/gi,
      "$1[redacted]",
    )
    .replace(/\b(sb_secret|service_role)_[A-Za-z0-9_-]+/g, "[redacted-secret]")
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, "[redacted-stripe-key]")
    .replace(/\bwhsec_[A-Za-z0-9]+/g, "[redacted-webhook-secret]");
}

function tail(input: string, max = 4000): string {
  const cleaned = redact(input).trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(cleaned.length - max);
}

function runCommand(command: string): Promise<StepResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: process.cwd(),
      shell: true,
      env: process.env,
    });
    let output = "";
    const push = (chunk: Buffer) => {
      const text = chunk.toString();
      output = (output + text).slice(-100_000);
      process.stdout.write(text);
    };
    child.stdout?.on("data", push);
    child.stderr?.on("data", push);
    child.on("error", (error) => {
      resolve({
        status: "fail",
        duration_ms: Date.now() - started,
        detail: tail(`${output}\n${error.message}`),
      });
    });
    child.on("close", (code) => {
      resolve({
        status: code === 0 ? "pass" : "fail",
        duration_ms: Date.now() - started,
        detail: tail(output),
      });
    });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function annotationsOf(value: unknown): { type: string; description: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.type !== "string") return [];
    return [
      {
        type: entry.type,
        description: typeof entry.description === "string" ? entry.description : "",
      },
    ];
  });
}

function errorText(result: Record<string, unknown> | undefined): string {
  if (!result) return "";
  const raw = Array.isArray(result.errors)
    ? result.errors
    : result.error
      ? [result.error]
      : [];
  return raw
    .flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.message !== "string") return [];
      return [entry.message];
    })
    .join("\n");
}

function attachmentPaths(
  result: Record<string, unknown> | undefined,
  name: string,
): string[] {
  if (!result || !Array.isArray(result.attachments)) return [];
  return result.attachments.flatMap((attachment) => {
    if (!isRecord(attachment) || attachment.name !== name) return [];
    if (typeof attachment.path !== "string") return [];
    const relative = path.relative(process.cwd(), attachment.path);
    return [relative.split(path.sep).join("/")];
  });
}

function collectTests(report: unknown): CollectedTest[] {
  if (!isRecord(report) || !Array.isArray(report.suites)) return [];
  const collected: CollectedTest[] = [];

  const walk = (suite: unknown) => {
    if (!isRecord(suite)) return;
    const specs = Array.isArray(suite.specs) ? suite.specs : [];
    for (const spec of specs) {
      if (!isRecord(spec) || typeof spec.title !== "string") continue;
      const tests = Array.isArray(spec.tests) ? spec.tests : [];
      for (const test of tests) {
        if (!isRecord(test)) continue;
        const results = Array.isArray(test.results) ? test.results : [];
        const result = results.at(-1);
        const resultRecord = isRecord(result) ? result : undefined;
        const annotations = [
          ...annotationsOf(test.annotations),
          ...annotationsOf(resultRecord?.annotations),
        ];
        const message = errorText(resultRecord);
        const skipAnnotation = annotations.find((item) => item.type === "skip");
        const skipped =
          test.status === "skipped" ||
          resultRecord?.status === "skipped" ||
          test.expectedStatus === "skipped";
        const passed = !skipped && resultRecord?.status === "passed";
        collected.push({
          project: typeof test.projectName === "string" ? test.projectName : "unknown",
          title: spec.title,
          status: skipped ? "skipped" : passed ? "passed" : "failed",
          detail: tail(message, 1500),
          skipReason: skipAnnotation?.description || (skipped ? message : ""),
          consoleErrors: annotations
            .filter((item) => item.type === "console-error")
            .map((item) => item.description),
          ignoredConsole: annotations
            .filter((item) => item.type === "console-ignored")
            .map((item) => item.description),
          screenshots: attachmentPaths(resultRecord, "screenshot"),
          traces: attachmentPaths(resultRecord, "trace"),
        });
      }
    }
    const children = Array.isArray(suite.suites) ? suite.suites : [];
    for (const child of children) walk(child);
  };

  for (const suite of report.suites) walk(suite);
  return collected;
}

function isAuthSkip(reason: string): boolean {
  return /storage state|ATLAS_QA_STORAGE_STATE|Do not commit secrets/i.test(reason);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => redact(value)).filter(Boolean))];
}

function reportTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function main() {
  fs.mkdirSync("agent-reports", { recursive: true });
  const startedAt = new Date();

  const content = await runCommand("npm run validate:content");
  let contractIssues: string[] = [];
  const contractStarted = Date.now();
  try {
    contractIssues = checkDailyInboxSpec();
  } catch (error) {
    contractIssues = [error instanceof Error ? error.message : String(error)];
  }
  const contractDetail =
    contractIssues.length > 0
      ? `Spec contract failed:\n${contractIssues.join("\n")}`
      : "Spec contract matched the current Daily Inbox Briefing source.";
  const validate: StepResult = {
    status: content.status === "pass" && contractIssues.length === 0 ? "pass" : "fail",
    duration_ms: content.duration_ms + (Date.now() - contractStarted),
    detail: tail(`${content.detail}\n\n${contractDetail}`),
  };

  const payments = await runCommand("npm run test:payments");

  const build: StepResult =
    validate.status === "pass"
      ? await runCommand("npm run build")
      : {
          status: "skipped",
          duration_ms: 0,
          detail: "Skipped because content validation or the spec contract failed.",
        };

  let browser: StepResult;
  if (build.status !== "pass") {
    browser = {
      status: "skipped",
      duration_ms: 0,
      detail: "Skipped because the build did not pass.",
    };
  } else {
    browser = await runCommand("npx playwright test");
  }

  let tests: CollectedTest[] = [];
  let playwrightErrors: string[] = [];
  if (fs.existsSync(PLAYWRIGHT_JSON)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(PLAYWRIGHT_JSON, "utf8"));
      tests = collectTests(parsed);
      if (isRecord(parsed) && Array.isArray(parsed.errors)) {
        playwrightErrors = parsed.errors.flatMap((entry) => {
          if (typeof entry === "string") return [entry];
          if (isRecord(entry) && typeof entry.message === "string") return [entry.message];
          return [];
        });
      }
    } catch (error) {
      playwrightErrors.push(
        error instanceof Error ? error.message : "Could not parse Playwright JSON.",
      );
    }
  } else if (browser.status !== "skipped") {
    playwrightErrors.push("Playwright did not write agent-reports/playwright-results.json.");
  }

  const testsPassed = tests.filter((test) => test.status === "passed").length;
  const testsFailed = tests.filter((test) => test.status === "failed").length;
  const testsSkipped = tests.filter((test) => test.status === "skipped").length;
  const executed = testsPassed + testsFailed;

  const blocking: Issue[] = [];
  const nonBlocking: Issue[] = [];

  if (payments.status !== "pass") {
    blocking.push({
      id: "payments-unit",
      severity: "blocking",
      title: "Payments unit tests failed",
      detail: payments.detail,
    });
  }
  if (validate.status === "fail") {
    blocking.push({
      id: "validate-content",
      severity: "blocking",
      title: "Content validation or spec contract failed",
      detail: validate.detail,
    });
  }
  if (build.status === "fail") {
    blocking.push({
      id: "build",
      severity: "blocking",
      title: "Production build failed",
      detail: build.detail,
    });
  }
  for (const message of playwrightErrors) {
    blocking.push({
      id: "playwright-runner",
      severity: "blocking",
      title: "Browser test runner failed",
      detail: tail(message, 1500),
    });
  }

  for (const test of tests) {
    if (test.status !== "failed") continue;
    blocking.push({
      id: `${test.project}::${test.title}`,
      severity: "blocking",
      title: test.title,
      detail: test.detail || "Test failed.",
      project: test.project,
      test: test.title,
    });
  }

  const projects = new Set(tests.map((test) => test.project));
  if (browser.status !== "skipped" && tests.length > 0) {
    for (const project of ["desktop", "mobile"]) {
      if (!projects.has(project)) {
        blocking.push({
          id: `missing-project-${project}`,
          severity: "blocking",
          title: `${project} browser project did not run`,
          detail: "Desktop and phone-sized viewport projects are both required.",
          project,
        });
      }
    }
  }

  const authSkips = tests.filter(
    (test) =>
      test.status === "skipped" &&
      (test.project.startsWith("authenticated") || isAuthSkip(test.skipReason)),
  );
  const humanAction: string[] = [];
  if (authSkips.length > 0) {
    humanAction.push(
      "Signed-in Daily Inbox Briefing checks did not run. Save a Playwright storage state with npm run qa:save-session, or set ATLAS_QA_STORAGE_STATE. Do not commit that file, tokens, passwords, or email addresses.",
    );
    for (const test of authSkips) {
      humanAction.push(`Skipped ${test.project}: ${test.title}`);
    }
    nonBlocking.push({
      id: "auth-session-not-configured",
      severity: "non_blocking",
      title: "Authenticated tests were skipped",
      detail:
        "Public and logged-out checks ran. Starter Kit behavior still needs a local session file before it can pass or fail.",
    });
  }

  const ignoredConsole = unique(tests.flatMap((test) => test.ignoredConsole));
  if (ignoredConsole.length > 0) {
    nonBlocking.push({
      id: "ignored-console-noise",
      severity: "non_blocking",
      title: "Ignored third-party or favicon console noise",
      detail: ignoredConsole.slice(0, 20).join("\n"),
    });
  }

  const consoleErrors = unique(tests.flatMap((test) => test.consoleErrors));
  const screenshots = unique(tests.flatMap((test) => test.screenshots));
  const traces = unique(tests.flatMap((test) => test.traces));

  if (browser.status !== "skipped" && tests.length === 0) {
    browser = {
      ...browser,
      status: "blocked",
      detail: browser.detail || "Browser tests produced no results.",
    };
  } else if (testsFailed > 0 || playwrightErrors.length > 0) {
    browser = { ...browser, status: "fail" };
  } else if (browser.status === "fail" && testsFailed === 0 && tests.length > 0) {
    browser = {
      ...browser,
      status: "fail",
      detail: browser.detail || "Playwright exited with a failure.",
    };
  }

  let status: ReportStatus = "pass";
  if (validate.status === "fail" || build.status === "fail" || testsFailed > 0 || blocking.length > 0) {
    status = "fail";
  }
  if (status === "pass" && browser.status === "blocked") status = "blocked";
  if (browser.status === "blocked" && validate.status === "pass" && build.status === "pass") {
    status = "blocked";
  }

  const score = executed === 0 ? null : Math.round((testsPassed / executed) * 100);
  const report = {
    schema_version: "atlas-qa-report-v0",
    use_case: "atlas-qa",
    generated_at: startedAt.toISOString(),
    status,
    score,
    tests_passed: testsPassed,
    tests_failed: testsFailed,
    tests_skipped: testsSkipped,
    blocking_issues: blocking,
    non_blocking_issues: nonBlocking,
    console_errors: consoleErrors,
    evidence: {
      screenshots,
      traces,
    },
    human_action_required: humanAction.map((item) => redact(item)),
    pipeline: {
      validate_content: validate,
      build,
      browser_tests: browser,
    },
  };

  const reportPath = path.join(
    "agent-reports",
    `${reportTimestamp(startedAt)}-qa.json`,
  );
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log("");
  console.log(`QA status: ${status}`);
  console.log(
    `Tests passed: ${testsPassed}, failed: ${testsFailed}, skipped: ${testsSkipped}`,
  );
  console.log(`Report: ${reportPath}`);
  if (humanAction.length > 0) {
    console.log("Human action required: signed-in tests were skipped.");
  }

  process.exit(status === "pass" ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
