import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { FileChange } from "./guards";

const IGNORED_PREFIXES = [
  ".next/",
  "node_modules/",
  "test-results/",
  "playwright-report/",
  "blob-report/",
  "agent-reports/",
  "agent-secrets/",
  "out/",
  "coverage/",
];

const SECRET_FILES = [".env", ".env.local", ".env.development", ".env.production", ".env.test"];

export type Baseline = {
  head: string;
  branch: string;
  files: Map<string, Buffer | null>;
  secrets: Map<string, Buffer | null>;
};

export function git(args: string[], encoding: "utf8" | "buffer" = "utf8"): string | Buffer {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString("utf8")
      : String(result.stderr ?? "");
    throw new Error(stderr.trim() || `git ${args.join(" ")} failed`);
  }
  return result.stdout;
}

export function currentBranch(): string {
  return String(git(["branch", "--show-current"], "utf8")).trim();
}

export function currentHead(): string {
  return String(git(["rev-parse", "HEAD"], "utf8")).trim();
}

export function captureBaseline(): Baseline {
  const files = new Map<string, Buffer | null>();
  for (const file of statusPaths()) {
    if (isIgnoredWorkspacePath(file)) continue;
    files.set(file, readBytes(file));
  }
  const secrets = new Map<string, Buffer | null>();
  for (const file of secretPaths()) {
    secrets.set(file, readBytes(file));
  }
  return {
    head: currentHead(),
    branch: currentBranch(),
    files,
    secrets,
  };
}

export function changesSince(baseline: Baseline): FileChange[] {
  const paths = new Set<string>([...baseline.files.keys(), ...statusPaths()]);
  const changes: FileChange[] = [];
  for (const file of paths) {
    if (isIgnoredWorkspacePath(file)) continue;
    const beforeBytes = baseline.files.has(file) ? baseline.files.get(file)! : readHeadBytes(file);
    const afterBytes = readBytes(file);
    if (sameBytes(beforeBytes, afterBytes)) continue;
    changes.push({
      path: file,
      before: beforeBytes ? beforeBytes.toString("utf8") : null,
      after: afterBytes ? afterBytes.toString("utf8") : null,
    });
  }
  return changes;
}

export function restoreFiles(baseline: Baseline, files: string[]): void {
  for (const file of files) {
    const before = baseline.files.has(file) ? baseline.files.get(file)! : readHeadBytes(file);
    writeBytes(file, before);
  }
}

export function restoreSecrets(baseline: Baseline): string[] {
  const restored: string[] = [];
  for (const [file, before] of baseline.secrets) {
    if (sameBytes(before, readBytes(file))) continue;
    writeBytes(file, before);
    restored.push(file);
  }
  return restored;
}

export function diffSummary(baseline: Baseline, files: string[]): string {
  if (files.length === 0) return "No files kept from this loop.";
  const lines: string[] = [];
  for (const file of files) {
    const before = baseline.files.has(file) ? baseline.files.get(file)! : readHeadBytes(file);
    const after = readBytes(file);
    if (!before && after) {
      const lineCount = after.toString("utf8").split(/\r?\n/).length;
      lines.push(`${file} | new file, ${lineCount} lines`);
      continue;
    }
    if (before && !after) {
      lines.push(`${file} | deleted`);
      continue;
    }
    const stat = spawnSync("git", ["diff", "--stat", "--", file], {
      cwd: process.cwd(),
      encoding: "utf8",
      windowsHide: true,
    });
    const text = (stat.stdout || "").trim();
    lines.push(text || `${file} | changed`);
  }
  return lines.join("\n");
}

function statusPaths(): string[] {
  const stdout = git(["status", "--porcelain=v1", "-z", "-uall"], "buffer");
  return parseStatus(stdout as Buffer);
}

function parseStatus(stdout: Buffer): string[] {
  const paths: string[] = [];
  let offset = 0;
  while (offset < stdout.length) {
    const end = stdout.indexOf(0, offset);
    const stop = end === -1 ? stdout.length : end;
    const entry = stdout.slice(offset, stop).toString("utf8");
    offset = stop + 1;
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const file = entry.slice(3).replace(/\\/g, "/");
    if (status.includes("R") || status.includes("C")) {
      const destEnd = stdout.indexOf(0, offset);
      const destStop = destEnd === -1 ? stdout.length : destEnd;
      const dest = stdout.slice(offset, destStop).toString("utf8").replace(/\\/g, "/");
      offset = destStop + 1;
      if (file) paths.push(file);
      if (dest) paths.push(dest);
      continue;
    }
    if (file) paths.push(file);
  }
  return paths;
}

function secretPaths(): string[] {
  const paths = [...SECRET_FILES];
  const secretsDir = path.join(process.cwd(), "agent-secrets");
  if (!fs.existsSync(secretsDir)) return paths;
  for (const entry of fs.readdirSync(secretsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    paths.push(`agent-secrets/${entry.name}`);
  }
  return paths;
}

function isIgnoredWorkspacePath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return IGNORED_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function readBytes(file: string): Buffer | null {
  const abs = absoluteInsideRepo(file);
  if (!fs.existsSync(abs)) return null;
  const stat = fs.statSync(abs);
  if (!stat.isFile()) return null;
  return fs.readFileSync(abs);
}

function readHeadBytes(file: string): Buffer | null {
  const result = spawnSync("git", ["show", `HEAD:${file}`], {
    cwd: process.cwd(),
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  return result.stdout;
}

function writeBytes(file: string, bytes: Buffer | null): void {
  const abs = absoluteInsideRepo(file);
  if (!bytes) {
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    return;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, bytes);
}

function sameBytes(left: Buffer | null, right: Buffer | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function absoluteInsideRepo(file: string): string {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("/") || normalized.includes("..")) {
    throw new Error(`Refusing path outside the repository: ${file}`);
  }
  const root = path.resolve(process.cwd());
  const abs = path.resolve(root, normalized);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error(`Refusing path outside the repository: ${file}`);
  }
  return abs;
}
