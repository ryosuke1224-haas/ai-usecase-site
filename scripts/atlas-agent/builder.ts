import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { AgentTask, BuilderReport, QaFailure } from "./schema";
import { assertBuilderReportShape } from "./schema";
import { tail } from "./redact";

export type BuilderInvocation = "command" | "cursor-agent" | "documentation-fallback";

export type BuilderRequest = {
  schema_version: "atlas-builder-request-v1";
  task: AgentTask;
  iteration: number;
  instruction: string;
  failures: QaFailure[];
  previous_files_changed: string[];
};

const DOC_SCOPE = /^(?:agents|agent-tasks)\/[a-zA-Z0-9._/-]+\.md$/;

export function builderInstruction(iteration: number): string {
  if (iteration === 1) {
    return "Implement the task within scope. Do not declare the work QA-passed.";
  }
  return "Fix only the failing behavior. Preserve all passing functionality.";
}

export function isDocumentationTask(task: AgentTask): boolean {
  return task.scope.every((entry) => DOC_SCOPE.test(entry.replace(/\\/g, "/")));
}

export function resolveBuilderInvocation(task: AgentTask): BuilderInvocation {
  if (process.env.ATLAS_BUILDER_COMMAND?.trim()) return "command";
  if (agentCliExists()) return "cursor-agent";
  if (isDocumentationTask(task)) return "documentation-fallback";
  throw new Error(
    "No Builder is available. Install the Cursor agent CLI (`agent`) or set ATLAS_BUILDER_COMMAND. The documentation fallback only accepts tasks whose scope is markdown under agents/ or agent-tasks/.",
  );
}

export function writeBuilderPrompt(request: BuilderRequest, promptPath: string): void {
  const prompt = [
    "You are the Atlas Builder.",
    "Follow agents/builder.md and agents/standards.md.",
    "The task JSON and the failure packet below are the whole assignment. Do not use any earlier conversation.",
    request.instruction,
    "Write a builder report JSON to the path in ATLAS_BUILDER_REPORT.",
    "The report must match agents/builder-report.schema.json.",
    "Do not include a QA pass, qa_status, or qa_passed field. You cannot declare QA passed.",
    "Do not commit, push, merge, or deploy. Do not run git commit, git push, git merge, gh, vercel, or npm publish.",
    "This process is a new session. Do not resume a previous chat and do not rely on any earlier conversation.",
    "Do not print secrets, session cookies, tokens, or email addresses.",
    "Do not delete tests, skip tests, weaken assertions, change acceptance criteria, disable authentication, or hide runtime errors.",
    "Do not modify QA infrastructure unless the task sets permits_qa_changes to true.",
    "If you believe a test is wrong, add a possible_test_defects entry and do not edit the test.",
    "",
    "Task:",
    JSON.stringify(request.task, null, 2),
    "",
    "Failures to fix (empty on the first iteration):",
    JSON.stringify(request.failures, null, 2),
  ].join("\n");
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt);
}

export type BuilderRun = {
  report: BuilderReport;
  detail: string;
  command: string;
};

export async function invokeBuilder(input: {
  invocation: BuilderInvocation;
  request: BuilderRequest;
  requestPath: string;
  reportPath: string;
  promptPath: string;
}): Promise<BuilderRun> {
  fs.mkdirSync(path.dirname(input.reportPath), { recursive: true });
  fs.writeFileSync(input.requestPath, `${JSON.stringify(input.request, null, 2)}\n`);
  writeBuilderPrompt(input.request, input.promptPath);
  if (input.invocation === "documentation-fallback") {
    const report = assertBuilderReportShape(runDocumentationBuilder(input.request));
    fs.writeFileSync(input.reportPath, `${JSON.stringify(report, null, 2)}\n`);
    return {
      report,
      detail: "Documentation fallback wrote the scoped markdown note.",
      command: "documentation-fallback",
    };
  }
  const env = {
    ...process.env,
    ATLAS_BUILDER_REQUEST: input.requestPath,
    ATLAS_BUILDER_REPORT: input.reportPath,
    ATLAS_BUILDER_PROMPT: input.promptPath,
  };
  const assignment = [
    "You are the Atlas Builder.",
    `Read and follow ${input.promptPath}.`,
    "That file is the whole assignment. Do not resume a previous chat.",
    "Edit only the files listed in the task scope, plus the builder report.",
    "Do not commit, push, merge, or deploy.",
    `Write the builder report JSON to ${input.reportPath}.`,
  ].join(" ");
  const launch =
    input.invocation === "command"
      ? {
          command: process.env.ATLAS_BUILDER_COMMAND!.trim(),
          args: [] as string[],
          shell: true,
          display: process.env.ATLAS_BUILDER_COMMAND!.trim(),
        }
      : cursorAgentLaunch(assignment);
  console.log(`Builder command: ${launch.display}`);
  const result = await runBuilderProcess(launch.command, launch.args, env, launch.shell);
  if (result.status !== 0 && !fs.existsSync(input.reportPath)) {
    throw new Error(
      `Builder exited ${result.status ?? "without a status"}. ${tail(result.stderr || result.stdout || "No output.")}`,
    );
  }
  if (!fs.existsSync(input.reportPath)) {
    throw new Error(
      `Builder did not write a report. ${tail(result.stderr || result.stdout || "No output.")}`,
    );
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(input.reportPath, "utf8"));
  return {
    report: assertBuilderReportShape(parsed),
    detail: tail(result.stdout || result.stderr || "Builder finished."),
    command: launch.display,
  };
}

function cursorAgentLaunch(assignment: string): {
  command: string;
  args: string[];
  shell: boolean;
  display: string;
} {
  const entry = findOnPath("agent");
  if (!entry) {
    throw new Error("Cursor Agent CLI `agent` is not on PATH.");
  }
  const agentArgs = [
    "-p",
    "--force",
    "--trust",
    "--output-format",
    "text",
    "--workspace",
    process.cwd(),
    assignment,
  ];
  const script = powershellEntry(entry);
  if (script) {
    const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...agentArgs];
    return {
      command: "powershell.exe",
      args,
      shell: false,
      display: formatCommand("powershell.exe", args),
    };
  }
  return {
    command: entry,
    args: agentArgs,
    shell: false,
    display: formatCommand(entry, agentArgs),
  };
}

function powershellEntry(entry: string): string | null {
  if (entry.toLowerCase().endsWith(".ps1")) return entry;
  const dir = path.dirname(entry);
  for (const name of ["cursor-agent.ps1", "agent.ps1"]) {
    const candidate = path.join(dir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function formatCommand(command: string, args: string[]): string {
  return [command, ...args]
    .map((arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg))
    .join(" ");
}

function findOnPath(name: string): string | null {
  const finder = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(finder, [name], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  const found = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && fs.existsSync(line));
  return found ?? null;
}

function runBuilderProcess(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  shell: boolean,
): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      shell,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Cursor Agent CLI timed out after 20 minutes."));
    }, 20 * 60 * 1000);
    const push = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString();
      if (target === "stdout") stdout = (stdout + text).slice(-100_000);
      else stderr = (stderr + text).slice(-100_000);
      process.stdout.write(text);
    };
    child.stdout?.on("data", (chunk: Buffer) => push("stdout", chunk));
    child.stderr?.on("data", (chunk: Buffer) => push("stderr", chunk));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

function runDocumentationBuilder(request: BuilderRequest): BuilderReport {
  if (request.failures.length > 0) {
    return {
      schema_version: "atlas-builder-report-v1",
      task_id: request.task.id,
      iteration: request.iteration,
      files_changed: [],
      summary:
        "The documentation fallback cannot fix a product, build, or QA failure. Configure an external Builder for that work.",
      acceptance_criteria_addressed: [],
      known_risks: [
        "No product files were changed.",
        "Failing checks were left for human review.",
      ],
      build_result: "not_run",
      possible_test_defects: [],
    };
  }
  const files: string[] = [];
  for (const scopePath of request.task.scope) {
    const relative = scopePath.replace(/\\/g, "/");
    const absolute = path.join(process.cwd(), relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    const body = [
      `# ${request.task.title}`,
      "",
      `Task: ${request.task.id}`,
      "",
      request.task.objective,
      "",
      "This file is a loop dry run and does not change product behavior.",
      "",
      "No application routes, components, content, or tests are changed by this task.",
      "",
    ].join("\n");
    fs.writeFileSync(absolute, body);
    files.push(relative);
  }
  return {
    schema_version: "atlas-builder-report-v1",
    task_id: request.task.id,
    iteration: request.iteration,
    files_changed: files,
    summary: "Wrote the documentation note listed in the task scope.",
    acceptance_criteria_addressed: [...request.task.acceptance_criteria],
    known_risks: [
      "This iteration used the documentation fallback because no external Builder command was configured.",
      "The fallback cannot change Atlas product behavior.",
    ],
    build_result: "not_run",
    possible_test_defects: [],
  };
}

function agentCliExists(): boolean {
  return findOnPath("agent") !== null;
}
