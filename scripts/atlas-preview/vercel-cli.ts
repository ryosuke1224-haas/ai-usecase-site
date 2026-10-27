import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  PREVIEW_BRANCH,
  PREVIEW_PROJECT_NAME,
  PREVIEW_TARGET,
  PRODUCTION_VERCEL_UPDATE_BLOCKED,
  assertPreviewTarget,
  overlayPreviewEnv,
  parseEnvAssignments,
  redactSetupText,
  type EnvRecord,
} from "./setup";

export const VERCEL_NOT_CONNECTED = "VERCEL_NOT_CONNECTED";
export const VERCEL_PROJECT_MISMATCH = "VERCEL_PROJECT_MISMATCH";

type ProjectJson = { projectId?: string; orgId?: string; projectName?: string; name?: string };
type RepoJson = { projects?: Array<{ id?: string; name?: string; directory?: string; orgId?: string }> };

export function projectNameFromLink(input: { projectJson: ProjectJson | null; repoJson: RepoJson | null }): {
  found: boolean;
  projectName: string;
} {
  if (input.projectJson) {
    const name = input.projectJson.projectName?.trim() || input.projectJson.name?.trim() || "";
    if (name) return { found: true, projectName: name };
  }
  const projects = input.repoJson?.projects ?? [];
  const linked = projects.find((item) => item.directory === "." && item.name?.trim()) ?? projects.find((item) => item.name?.trim());
  if (linked?.name) return { found: true, projectName: linked.name.trim() };
  if (input.projectJson || projects.length > 0) return { found: true, projectName: "" };
  return { found: false, projectName: "" };
}

export function assessVercelConnection(input: { whoamiOk: boolean; found: boolean; projectName: string }):
  | { ok: true; projectName: string }
  | { ok: false; code: typeof VERCEL_NOT_CONNECTED | typeof VERCEL_PROJECT_MISMATCH } {
  if (!input.whoamiOk || !input.found) return { ok: false, code: VERCEL_NOT_CONNECTED };
  if (input.projectName !== PREVIEW_PROJECT_NAME) return { ok: false, code: VERCEL_PROJECT_MISMATCH };
  return { ok: true, projectName: input.projectName };
}

export function readLinkedProject(cwd = process.cwd()): { found: boolean; projectName: string } {
  return projectNameFromLink({
    projectJson: readJson<ProjectJson>(path.join(cwd, ".vercel", "project.json")),
    repoJson: readJson<RepoJson>(path.join(cwd, ".vercel", "repo.json")),
  });
}

export function parsePreviewUrl(body: unknown): string {
  const deployments = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { deployments?: unknown[] }).deployments)
      ? (body as { deployments: Array<Record<string, unknown>> }).deployments
      : [];
  const matching = deployments.filter((item) => {
    const meta = item.meta && typeof item.meta === "object" ? (item.meta as Record<string, unknown>) : {};
    const branch = typeof meta.githubCommitRef === "string" ? meta.githubCommitRef : "";
    return branch === PREVIEW_BRANCH && item.target !== "production" && (item.state === "READY" || item.readyState === "READY");
  });
  const candidate = matching[0];
  if (!candidate) return "";
  const meta = candidate.meta && typeof candidate.meta === "object" ? (candidate.meta as Record<string, unknown>) : {};
  const alias = typeof meta.branchAlias === "string" ? meta.branchAlias : "";
  if (alias.includes(PREVIEW_BRANCH) && alias.endsWith(".vercel.app")) {
    return alias.startsWith("https://") ? alias : `https://${alias}`;
  }
  const url = typeof candidate.url === "string" ? candidate.url : "";
  if (url.includes(PREVIEW_BRANCH) && url.endsWith(".vercel.app")) {
    return url.startsWith("https://") ? url : `https://${url}`;
  }
  return "";
}

export function previewRedeployArgs(host: string): string[] {
  const normalized = normalizeHost(host);
  if (!normalized || normalized.includes(" ") || isProductionHost(normalized)) {
    throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
  }
  const args = ["redeploy", normalized, "--environment", PREVIEW_TARGET, "--no-wait"];
  if (args.includes("--prod") || args.includes("production")) throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
  return args;
}

export function selectRedeployTarget(body: unknown): { host: string; createdAt: number } | null {
  const candidates = previewDeployments(body)
    .filter((item) => item.state === "READY" || item.readyState === "READY")
    .filter((item) => !isProductionHost(item.host))
    .sort((left, right) => right.createdAt - left.createdAt);
  return candidates[0] ? { host: candidates[0].host, createdAt: candidates[0].createdAt } : null;
}

export function parseRedeployUrl(text: string): string {
  const matches = text.match(/[a-z0-9.-]+\.vercel\.app/gi) ?? [];
  const host = matches
    .map((item) => normalizeHost(item))
    .reverse()
    .find((item) => item && !isProductionHost(item));
  return host ? `https://${host}` : "";
}

export function parseInspectDeployment(body: unknown): { id: string; readyState: string; target: string; host: string; createdAt: number } | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const host = normalizeHost(typeof record.url === "string" ? record.url : "");
  const readyState = typeof record.readyState === "string" ? record.readyState : typeof record.state === "string" ? record.state : "";
  const target = typeof record.target === "string" ? record.target : "";
  const id = typeof record.id === "string" ? record.id : typeof record.uid === "string" ? record.uid : host;
  const createdAt = Number(record.createdAt ?? 0);
  if (!host || !readyState) return null;
  return { id, readyState, target, host, createdAt };
}

export function previewDeploymentAppeared(body: unknown, host: string, previousCreatedAt: number): boolean {
  const wanted = normalizeHost(host);
  return previewDeployments(body).some(
    (item) => item.host === wanted && item.host !== "" && item.createdAt > previousCreatedAt && !isProductionHost(item.host),
  );
}

export function safeDeployReason(stderr: string, stdout: string, env: NodeJS.ProcessEnv = process.env): string {
  const parsed = parseJson(`${stdout}\n${stderr}`);
  const parsedMessage = parsed && typeof parsed === "object" && "message" in parsed ? String(parsed.message) : "";
  const line = `${parsedMessage}\n${stderr}\n${stdout}`
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && item !== "{" && item !== "}" && !item.startsWith("Vercel CLI ") && !item.startsWith(">") && !item.startsWith("npm warn") && !item.startsWith("! "));
  const reason = redactSetupText(line || "The Preview redeploy command failed.", env).replace(/\s+/g, " ").trim();
  return reason.slice(0, 180) || "The Preview redeploy command failed.";
}

export function parseVercelEnvTable(text: string): EnvRecord[] {
  const records: EnvRecord[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*([A-Z][A-Z0-9_]+)\s+/.exec(line);
    if (!match) continue;
    const key = match[1] ?? "";
    const branch = /Preview \(([^)]+)\)/.exec(line)?.[1] ?? null;
    const target: string[] = [];
    if (line.includes("Preview")) target.push("preview");
    if (line.includes("Production")) target.push("production");
    records.push({ id: key, key, target: target.length > 0 ? target : ["preview"], gitBranch: branch });
  }
  return records;
}

export function createVercelCliSession(input: { dryRun: boolean; cwd?: string }): {
  verify: () => Promise<{ projectId: string; projectName: string; previewUrl: string }>;
    listEnv: () => Promise<EnvRecord[]>;
    readPreviewEnv: (keys: readonly string[]) => Promise<Record<string, string>>;
  upsert: (change: { key: string; value: string; sensitive: boolean }) => Promise<void>;
  redeploy: () => Promise<{ id: string; url: string }>;
  wait: (id: string) => Promise<"READY" | "FAILED" | "MANUAL_REVIEW_REQUIRED">;
} {
  const cwd = input.cwd ?? process.cwd();
  let previousCreatedAt = 0;
  let redeployedHost = "";
  return {
    async verify() {
      const whoami = runVercel(["whoami"], cwd);
      const linked = readLinkedProject(cwd);
      const connection = assessVercelConnection({ whoamiOk: whoami.status === 0, ...linked });
      if (!connection.ok) throw new Error(connection.code);
      const listed = runVercel(["list", "--json", "--environment", "preview", "--limit", "20"], cwd);
      if (listed.status !== 0) throw new Error("The private-preview deployment list could not be read.");
      const previewUrl = parsePreviewUrl(parseJson(listed.stdout));
      if (!previewUrl.startsWith("https://")) throw new Error("The private-preview URL is not available.");
      return { projectId: "linked", projectName: connection.projectName, previewUrl };
    },
    async listEnv() {
      const listed = runVercel(["env", "ls", "--environment", "preview", "--git-branch", PREVIEW_BRANCH], cwd);
      if (listed.status !== 0) return [];
      return parseVercelEnvTable(listed.stdout).filter((item) => item.target.length === 1 && item.target[0] === "preview");
    },
    async readPreviewEnv(keys) {
      const shared = pullEnvText(["--environment", PREVIEW_TARGET], cwd);
      const branch = pullEnvText(["--environment", PREVIEW_TARGET, "--git-branch", PREVIEW_BRANCH], cwd);
      return overlayPreviewEnv(parseEnvAssignments(shared, keys), parseEnvAssignments(branch, keys));
    },
    async upsert(change) {
      if (input.dryRun) throw new Error("Dry run does not modify Vercel.");
      const allowed = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
      if (!allowed.ok) throw new Error(allowed.code);
      const args = [
        "env",
        "add",
        change.key,
        "--environment",
        PREVIEW_TARGET,
        "--git-branch",
        PREVIEW_BRANCH,
        "--yes",
        "--force",
      ];
      if (change.sensitive) args.push("--type", "secret");
      else args.push("--type", "config");
      const result = runVercel(args, cwd, `${change.value}\n`);
      if (result.status !== 0) {
        throw new Error(`Vercel Preview environment update failed. ${safeDeployReason(result.stderr, result.stdout)}`);
      }
    },
    async redeploy() {
      if (input.dryRun) throw new Error("Dry run does not deploy.");
      const allowed = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
      if (!allowed.ok) throw new Error(allowed.code);
      const listed = runVercel(["list", PREVIEW_PROJECT_NAME, "--json", "--limit", "20"], cwd);
      if (listed.status !== 0) throw new Error(safeDeployReason(listed.stderr, listed.stdout));
      const current = selectRedeployTarget(parseJson(listed.stdout));
      if (!current) throw new Error("No Ready private-preview deployment is available to redeploy.");
      previousCreatedAt = current.createdAt;
      const result = runVercel(previewRedeployArgs(current.host), cwd);
      if (result.status !== 0) throw new Error(safeDeployReason(result.stderr, result.stdout));
      const createdUrl = parseRedeployUrl(`${result.stdout}\n${result.stderr}`);
      const host = normalizeHost(createdUrl);
      if (!host || host === current.host || isProductionHost(host)) {
        throw new Error(host && isProductionHost(host) ? PRODUCTION_VERCEL_UPDATE_BLOCKED : "The Preview redeploy did not create a new deployment.");
      }
      const inspected = runVercel(["inspect", host, "--json"], cwd);
      if (inspected.status !== 0) throw new Error(safeDeployReason(inspected.stderr, inspected.stdout));
      const deployment = parseInspectDeployment(parseJson(inspected.stdout));
      if (!deployment || deployment.target === "production" || isProductionHost(deployment.host)) {
        throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
      }
      redeployedHost = deployment.host;
      return { id: deployment.id || deployment.host, url: `https://${deployment.host}` };
    },
    async wait(id) {
      const started = Date.now();
      let latest = "";
      while (Date.now() - started < 8 * 60 * 1000) {
        const inspected = runVercel(["inspect", id, "--json"], cwd);
        if (inspected.status !== 0) {
          latest = safeDeployReason(inspected.stderr, inspected.stdout);
        } else {
          const deployment = parseInspectDeployment(parseJson(inspected.stdout));
          if (deployment?.target === "production" || (deployment && isProductionHost(deployment.host))) {
            throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
          }
          if (deployment?.readyState === "ERROR" || deployment?.readyState === "CANCELED") {
            throw new Error(deployment.readyState === "CANCELED" ? "The Preview deployment was canceled." : "The Preview deployment build failed.");
          }
          if (deployment?.readyState === "READY") {
            const confirmed = runVercel(["list", PREVIEW_PROJECT_NAME, "--json", "--limit", "20"], cwd);
            if (confirmed.status === 0 && previewDeploymentAppeared(parseJson(confirmed.stdout), redeployedHost || deployment.host, previousCreatedAt)) {
              return "READY";
            }
            latest = "The redeploy finished but no new private-preview deployment appeared.";
          } else {
            latest = "";
          }
        }
        await delay(5000);
      }
      throw new Error(latest || "The Preview deployment did not finish within 8 minutes.");
    },
  };
}

function previewDeployments(body: unknown): Array<{ host: string; createdAt: number; state: string; readyState: string }> {
  const deployments = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as { deployments?: unknown[] }).deployments)
      ? (body as { deployments: unknown[] }).deployments
      : [];
  return deployments.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const meta = record.meta && typeof record.meta === "object" ? (record.meta as Record<string, unknown>) : {};
    const branch = typeof meta.githubCommitRef === "string" ? meta.githubCommitRef : "";
    const host = normalizeHost(typeof record.url === "string" ? record.url : "");
    if (branch !== PREVIEW_BRANCH || record.target === "production" || !host || isProductionHost(host)) return [];
    return [{
      host,
      createdAt: Number(record.createdAt ?? 0),
      state: typeof record.state === "string" ? record.state : "",
      readyState: typeof record.readyState === "string" ? record.readyState : "",
    }];
  });
}

function normalizeHost(value: string): string {
  return value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
}

function isProductionHost(host: string): boolean {
  return host === `${PREVIEW_PROJECT_NAME}.vercel.app` || host === `www.${PREVIEW_PROJECT_NAME}.vercel.app`;
}

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const list = text.indexOf("[");
  const cut = start === -1 ? list : list === -1 ? start : Math.min(start, list);
  if (cut === -1) return null;
  try {
    return JSON.parse(text.slice(cut));
  } catch {
    return null;
  }
}

function vercelEntry(): { command: string; prefix: string[] } {
  const candidates = [
    path.join(process.env.APPDATA ?? "", "npm", "node_modules", "vercel", "dist", "vc.js"),
    path.join(os.homedir(), "AppData", "Roaming", "npm", "node_modules", "vercel", "dist", "vc.js"),
  ];
  const script = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (script) return { command: process.execPath, prefix: [script] };
  return { command: process.platform === "win32" ? "vercel.cmd" : "vercel", prefix: [] };
}

function runVercel(args: string[], cwd: string, stdin?: string): { status: number; stdout: string; stderr: string } {
  const entry = vercelEntry();
  const result = spawnSync(entry.command, [...entry.prefix, ...args], {
    cwd,
    encoding: "utf8",
    input: stdin,
    windowsHide: true,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function curlPreview(input: { url: string; method?: "GET" | "POST"; body?: string; cwd?: string }): {
  status: number;
  body: string;
  location: string;
} {
  const cwd = input.cwd ?? process.cwd();
  const origin = new URL(input.url).origin;
  const headerFile = path.join(os.tmpdir(), `atlas-preview-headers-${Date.now()}.txt`);
  const args = [
    "curl",
    input.url,
    "--deployment",
    origin,
    "--yes",
    "--",
    "--silent",
    "--show-error",
    "--max-redirs",
    "0",
    "--dump-header",
    headerFile,
    "--write-out",
    "\n__ATLAS_STATUS__:%{http_code}",
  ];
  if (input.method === "POST") {
    args.push("--request", "POST", "--header", "content-type: application/json", "--data", input.body ?? "{}");
  }
  const result = runVercel(args, cwd);
  const status = Number(/__ATLAS_STATUS__:(\d+)/.exec(result.stdout)?.[1] ?? 0);
  const body = result.stdout.replace(/\n?__ATLAS_STATUS__:\d+\s*$/, "");
  let location = "";
  if (fs.existsSync(headerFile)) {
    const headers = fs.readFileSync(headerFile, "utf8");
    fs.unlinkSync(headerFile);
    location = /^location:\s*(.*)$/im.exec(headers)?.[1]?.trim() ?? "";
  }
  return { status, body, location };
}

let previewEnvPull = 0;

function pullEnvText(args: string[], cwd: string): string {
  const dest = path.join(os.tmpdir(), `atlas-preview-env-${process.pid}-${Date.now()}-${previewEnvPull++}.tmp`);
  try {
    const result = runVercel(["env", "pull", dest, "--yes", ...args], cwd);
    if (result.status !== 0 || !fs.existsSync(dest)) {
      throw new Error("The private-preview Supabase configuration could not be read.");
    }
    return fs.readFileSync(dest, "utf8");
  } finally {
    fs.rmSync(dest, { force: true });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
