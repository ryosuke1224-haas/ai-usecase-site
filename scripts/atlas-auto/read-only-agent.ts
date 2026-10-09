import fs from "node:fs";
import path from "node:path";
import { cursorAgentLaunch, runCursorAgent, type CursorAgentRole } from "../atlas-agent/cursor-cli";
import { redact, tail } from "../atlas-agent/redact";
import { captureBaseline, changesSince, restoreFiles, restoreSecrets } from "../atlas-agent/workspace";

export class AgentWriteViolation extends Error {}

/**
 * Runs one read-only Cursor Agent session (ask mode, no resume) and returns the
 * JSON object it prints. Any file the session changes is restored and the call fails.
 */
export async function runReadOnlyAgent(input: {
  role: Exclude<CursorAgentRole, "builder" | "evaluator">;
  label: string;
  promptPath: string;
  outputPath: string;
  timeoutMs: number;
}): Promise<{ json: unknown; command: string }> {
  const snapshot = captureBaseline();
  const assignment = [
    `You are the Atlas ${input.label}, a new read-only session.`,
    `Read and follow ${input.promptPath.replace(/\\/g, "/")}.`,
    "That file is the whole assignment. Do not resume a previous chat.",
    "Do not edit, create, or delete any file.",
    "Do not commit, push, merge, or deploy.",
    "Print only the JSON object.",
  ].join(" ");
  const launch = cursorAgentLaunch(assignment, input.role);
  const started = Date.now();
  const heartbeat = setInterval(() => {
    const seconds = Math.round((Date.now() - started) / 1000);
    console.log(`  ${input.label} still working (${Math.floor(seconds / 60)}m ${seconds % 60}s)`);
  }, 30_000);
  let result: { status: number | null; stdout: string; stderr: string };
  try {
    result = await runCursorAgent(launch, process.env, input.timeoutMs, { echo: false });
  } finally {
    clearInterval(heartbeat);
  }
  fs.mkdirSync(path.dirname(input.outputPath), { recursive: true });
  fs.writeFileSync(input.outputPath, redact(`${result.stdout}\n\n--- stderr ---\n${result.stderr}`));

  const secretChanges = restoreSecrets(snapshot);
  const changed = changesSince(snapshot).map((change) => change.path);
  if (changed.length > 0 || secretChanges.length > 0) {
    restoreFiles(snapshot, changed);
    throw new AgentWriteViolation(
      `${input.label} changed files and they were restored: ${[...changed, ...secretChanges].join(", ")}`,
    );
  }
  if (result.status !== 0 && !result.stdout.includes("{")) {
    throw new Error(
      `${input.label} exited ${result.status ?? "without a status"}. ${tail(result.stderr || result.stdout || "No output.", 600)}`,
    );
  }
  return { json: extractJson(result.stdout, input.label), command: launch.display };
}

export function extractJson(text: string, label = "Agent"): unknown {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((match) => match[1]);
  const candidates = [...fenced, text];
  for (const raw of candidates) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end < start) continue;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      continue;
    }
  }
  throw new Error(`${label} did not return parseable JSON. ${tail(text, 500)}`);
}
