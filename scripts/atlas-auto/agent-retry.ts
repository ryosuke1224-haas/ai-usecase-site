import {
  AgentTimeoutError,
  AGENT_TIMEOUT_CODES,
  type CursorAgentRole,
} from "../atlas-agent/cursor-cli";

export const RESEARCH_AGENT_TIMEOUT = AGENT_TIMEOUT_CODES.research;
export const SPEC_AGENT_TIMEOUT = AGENT_TIMEOUT_CODES.spec;
export const SCORING_AGENT_TIMEOUT = AGENT_TIMEOUT_CODES.scoring;
export const AGENT_CONNECTION_FAILURE = "AGENT_CONNECTION_FAILURE";
export const AGENT_PROCESS_FAILURE = "AGENT_PROCESS_FAILURE";

export const AGENT_RETRY_LIMITS = {
  maxAttempts: 3,
  backoffMs: [2_000, 5_000, 10_000],
} as const;

export type AgentInfraCode =
  | typeof RESEARCH_AGENT_TIMEOUT
  | typeof SPEC_AGENT_TIMEOUT
  | typeof SCORING_AGENT_TIMEOUT
  | typeof AGENT_CONNECTION_FAILURE
  | typeof AGENT_PROCESS_FAILURE
  | "BUILDER_TIMEOUT"
  | "EVALUATOR_TIMEOUT";

const TRANSIENT_PATTERN =
  /ECONNABORTED|ECONNRESET|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|connection lost|socket hang up|temporarily unavailable|temporary Cursor API unavailable|network(?:\s+is)?\s+unreachable/i;

export function isTransientAgentError(error: unknown): boolean {
  const text = errorText(error);
  const code = errorCode(error);
  if (code && TRANSIENT_PATTERN.test(code)) return true;
  return TRANSIENT_PATTERN.test(text);
}

export function isAgentTimeoutError(error: unknown): boolean {
  if (error instanceof AgentTimeoutError) return true;
  const text = errorText(error);
  return /RESEARCH_AGENT_TIMEOUT|SPEC_AGENT_TIMEOUT|SCORING_AGENT_TIMEOUT|EVALUATOR_TIMEOUT|BUILDER_TIMEOUT/.test(text);
}

export function isRetryableAgentError(error: unknown): boolean {
  return isTransientAgentError(error) || isAgentTimeoutError(error);
}

export function classifyAgentInfra(role: CursorAgentRole, error: unknown): AgentInfraCode {
  if (isAgentTimeoutError(error)) {
    if (error instanceof AgentTimeoutError) return error.code;
    if (role === "research") return RESEARCH_AGENT_TIMEOUT;
    if (role === "spec") return SPEC_AGENT_TIMEOUT;
    if (role === "scoring") return SCORING_AGENT_TIMEOUT;
    if (role === "evaluator") return "EVALUATOR_TIMEOUT";
    return "BUILDER_TIMEOUT";
  }
  if (isTransientAgentError(error)) return AGENT_CONNECTION_FAILURE;
  return AGENT_PROCESS_FAILURE;
}

export async function withTransientAgentRetry<T>(input: {
  role: CursorAgentRole;
  label: string;
  run: (attempt: number) => Promise<T>;
  attempts?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<T> {
  const attempts = input.attempts ?? AGENT_RETRY_LIMITS.maxAttempts;
  const sleep = input.sleep ?? defaultSleep;
  let last: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await input.run(attempt);
    } catch (error) {
      last = error;
      if (!isRetryableAgentError(error) || attempt === attempts) break;
      const wait = AGENT_RETRY_LIMITS.backoffMs[Math.min(attempt - 1, AGENT_RETRY_LIMITS.backoffMs.length - 1)] ?? 2_000;
      console.log(
        `${input.label} transient failure (${classifyAgentInfra(input.role, error)}). Retrying in a fresh session (${attempt + 1}/${attempts}) after ${wait}ms.`,
      );
      await sleep(wait);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name} ${error.message} ${errorCode(error) ?? ""}`;
  return String(error);
}

function errorCode(error: unknown): string | null {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return null;
}
