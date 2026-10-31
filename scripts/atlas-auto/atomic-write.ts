import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ATOMIC_WRITE_FAILED = "ATOMIC_WRITE_FAILED";

/** Bounded rename retries: 50+100+200+400+400+400+400 = 1950ms of backoff. */
export const ATOMIC_WRITE_LIMITS = {
  maxAttempts: 8,
  initialBackoffMs: 50,
  maxBackoffMs: 400,
} as const;

export const TRANSIENT_WRITE_CODES = new Set(["EPERM", "EACCES", "EBUSY"]);

const UNIQUE_TEMP = /^(\d+)\.([A-Za-z0-9-]+)$/;

export type AtomicFs = {
  mkdirSync(dir: string, opts: { recursive: boolean }): void;
  writeFileSync(file: string, data: string): void;
  renameSync(from: string, to: string): void;
  unlinkSync(file: string): void;
  existsSync(file: string): boolean;
  readdirSync(dir: string): string[];
  pid?: number;
  nextId?: () => string;
  isPidAlive?: (pid: number) => boolean;
};

export type AtomicClock = {
  sleep(ms: number): void;
};

export class AtomicWriteError extends Error {
  readonly code = ATOMIC_WRITE_FAILED;
  constructor() {
    super(`${ATOMIC_WRITE_FAILED}. The existing JSON was left unchanged.`);
    this.name = "AtomicWriteError";
  }
}

const writeLocks = new Map<string, true>();
const activeTemps = new Set<string>();

const defaultFs: AtomicFs = {
  mkdirSync: (dir, opts) => {
    fs.mkdirSync(dir, opts);
  },
  writeFileSync: (file, data) => {
    writeDurableSync(file, data);
  },
  renameSync: (from, to) => {
    fs.renameSync(from, to);
  },
  unlinkSync: (file) => {
    fs.unlinkSync(file);
  },
  existsSync: (file) => fs.existsSync(file),
  readdirSync: (dir) => {
    try {
      return fs.readdirSync(dir);
    } catch {
      return [];
    }
  },
};

export function sleepSync(ms: number): void {
  if (ms <= 0) return;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function isTransientWriteError(error: unknown): boolean {
  return TRANSIENT_WRITE_CODES.has(errorCode(error));
}

export function createAtlasTempPath(file: string, pid: number, uniqueId: string): string {
  return `${file}.tmp.${pid}.${uniqueId}`;
}

export function parseAtlasJsonTemp(destBase: string, entry: string): { pid: number | null } | null {
  if (entry === `${destBase}.tmp`) return { pid: null };
  const prefix = `${destBase}.tmp.`;
  if (!entry.startsWith(prefix)) return null;
  const match = UNIQUE_TEMP.exec(entry.slice(prefix.length));
  return match ? { pid: Number(match[1]) } : null;
}

export function isPidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return errorCode(error) !== "ESRCH";
  }
}

export function withAtomicWriteLock(file: string, fn: () => void, clock: AtomicClock = { sleep: sleepSync }): void {
  const key = path.resolve(file);
  let waits = 0;
  while (writeLocks.has(key)) {
    waits += 1;
    if (waits > 200) throw new AtomicWriteError();
    clock.sleep(5);
  }
  writeLocks.set(key, true);
  try {
    fn();
  } finally {
    writeLocks.delete(key);
  }
}

/** Atomic JSON replace: unique temp, fsync, rename-only retry. Never overwrite dest in place. */
export function writeAtomicJson(
  file: string,
  value: unknown,
  io: AtomicFs = defaultFs,
  clock: AtomicClock = { sleep: sleepSync },
): void {
  withAtomicWriteLock(file, () => {
    io.mkdirSync(path.dirname(file), { recursive: true });
    const pid = io.pid ?? process.pid;
    const isAlive = io.isPidAlive ?? isPidAlive;
    cleanupStaleTemps(io, file, pid, isAlive);
    const temp = createAtlasTempPath(file, pid, io.nextId?.() ?? defaultNextId());
    const tempKey = path.resolve(temp);
    activeTemps.add(tempKey);
    try {
      const body = `${JSON.stringify(value, null, 2)}\n`;
      try {
        io.writeFileSync(temp, body);
      } catch {
        throw new AtomicWriteError();
      }
      let backoff: number = ATOMIC_WRITE_LIMITS.initialBackoffMs;
      for (let attempt = 1; attempt <= ATOMIC_WRITE_LIMITS.maxAttempts; attempt += 1) {
        try {
          io.renameSync(temp, file);
          return;
        } catch (renameError) {
          if (!isTransientWriteError(renameError) || attempt === ATOMIC_WRITE_LIMITS.maxAttempts) {
            throw new AtomicWriteError();
          }
          clock.sleep(backoff);
          backoff = Math.min(backoff * 2, ATOMIC_WRITE_LIMITS.maxBackoffMs);
        }
      }
      throw new AtomicWriteError();
    } finally {
      activeTemps.delete(tempKey);
      unlinkIfExists(io, temp);
    }
  }, clock);
}

export function writeDurableSync(file: string, data: string): void {
  const fd = fs.openSync(file, "w");
  try {
    fs.writeFileSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function defaultNextId(): string {
  return `${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

function cleanupStaleTemps(
  io: AtomicFs,
  file: string,
  pid: number,
  isAlive: (candidatePid: number) => boolean,
): void {
  if (typeof io.readdirSync !== "function") return;
  const dir = path.dirname(file);
  const destBase = path.basename(file);
  let entries: string[] = [];
  try {
    entries = io.readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const parsed = parseAtlasJsonTemp(destBase, entry);
    if (!parsed) continue;
    const full = path.join(dir, entry);
    if (activeTemps.has(path.resolve(full))) continue;
    if (parsed.pid !== null && parsed.pid !== pid && isAlive(parsed.pid)) continue;
    unlinkIfExists(io, full);
  }
}

function unlinkIfExists(io: AtomicFs, file: string): void {
  try {
    if (io.existsSync(file)) io.unlinkSync(file);
  } catch {
    // Destination is left intact. A locked leftover temp is retried on a later write.
  }
}

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return "";
}
