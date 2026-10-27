import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PREVIEW_BRANCH, PREVIEW_PROJECT_NAME, PREVIEW_TARGET, PRODUCTION_VERCEL_UPDATE_BLOCKED, assertPreviewTarget, type EnvRecord } from "./setup";

type VercelEnv = {
  id?: string;
  key?: string;
  target?: string[];
  gitBranch?: string | null;
};

type VercelDeployment = {
  uid?: string;
  id?: string;
  url?: string;
  readyState?: string;
  target?: string;
  alias?: string[];
  meta?: Record<string, string | undefined>;
};

export function readVercelToken(env: NodeJS.ProcessEnv = process.env): string {
  const direct = env.VERCEL_TOKEN?.trim() || env.VERCEL_ACCESS_TOKEN?.trim() || "";
  if (direct) return direct;
  for (const file of vercelAuthFiles()) {
    if (!fs.existsSync(file)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as { token?: string };
      const token = parsed.token?.trim() ?? "";
      if (token) return token;
    } catch {
      continue;
    }
  }
  return "";
}

function vercelAuthFiles(): string[] {
  const home = os.homedir();
  return [
    path.join(envPath(process.env.APPDATA), "com.vercel", "auth.json"),
    path.join(envPath(process.env.LOCALAPPDATA), "com.vercel", "auth.json"),
    path.join(home, ".local", "share", "com.vercel", "auth.json"),
    path.join(home, ".vercel", "auth.json"),
  ];
}

function envPath(value: string | undefined): string {
  return value ?? "";
}

async function vercelFetch(token: string, teamId: string, apiPath: string, init?: RequestInit): Promise<unknown> {
  const url = new URL(`https://api.vercel.com${apiPath}`);
  if (teamId) url.searchParams.set("teamId", teamId);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Vercel request failed (${response.status}).`);
  return text ? JSON.parse(text) : {};
}

export function createVercelApi(token: string): {
  verify: () => Promise<{ projectId: string; projectName: string; previewUrl: string }>;
  listEnv: () => Promise<EnvRecord[]>;
  upsert: (change: { key: string; value: string; sensitive: boolean }) => Promise<void>;
  redeploy: () => Promise<{ id: string; url: string }>;
  wait: (id: string) => Promise<"READY" | "FAILED" | "MANUAL_REVIEW_REQUIRED">;
} {
  let projectId = "";
  let teamId = "";
  let previewUrl = "";

  return {
    async verify() {
      const found = await findProject(token);
      if (found.projectName !== PREVIEW_PROJECT_NAME) throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
      projectId = found.projectId;
      teamId = found.teamId;
      previewUrl = await findPreviewUrl(token, teamId, projectId);
      if (!previewUrl.startsWith("https://")) throw new Error("The private-preview URL is not available.");
      return { projectId, projectName: found.projectName, previewUrl };
    },
    async listEnv() {
      const body = (await vercelFetch(token, teamId, `/v9/projects/${projectId}/env`)) as { envs?: VercelEnv[] };
      return (body.envs ?? []).flatMap((item) => {
        if (!item.id || !item.key) return [];
        return [{ id: item.id, key: item.key, target: item.target ?? [], gitBranch: item.gitBranch ?? null }];
      });
    },
    async upsert(change) {
      const allowed = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
      if (!allowed.ok) throw new Error(allowed.code);
      const payload = {
        key: change.key,
        value: change.value,
        type: change.sensitive ? "sensitive" : "plain",
        target: [PREVIEW_TARGET],
        gitBranch: PREVIEW_BRANCH,
      };
      try {
        await vercelFetch(token, teamId, `/v10/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (!message.includes("(400)") && !message.includes("(409)")) throw error;
      }
      const current = await this.listEnv();
      const existing = current.find(
        (item) =>
          item.key === change.key &&
          item.gitBranch === PREVIEW_BRANCH &&
          item.target.length === 1 &&
          item.target[0] === PREVIEW_TARGET,
      );
      if (!existing || existing.target.includes("production")) throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
      await vercelFetch(token, teamId, `/v9/projects/${projectId}/env/${existing.id}`, { method: "DELETE" });
      await vercelFetch(token, teamId, `/v10/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async redeploy() {
      const allowed = assertPreviewTarget(PREVIEW_TARGET, PREVIEW_BRANCH);
      if (!allowed.ok) throw new Error(allowed.code);
      const project = (await vercelFetch(token, teamId, `/v9/projects/${projectId}`)) as {
        name?: string;
        link?: { type?: string; org?: string; repo?: string };
      };
      const link = project.link;
      if (!link?.org || !link.repo || link.type !== "github") {
        throw new Error("MANUAL_REVIEW_REQUIRED");
      }
      const created = (await vercelFetch(token, teamId, "/v13/deployments", {
        method: "POST",
        body: JSON.stringify({
          name: PREVIEW_PROJECT_NAME,
          project: projectId,
          target: PREVIEW_TARGET,
          gitSource: { type: "github", org: link.org, repo: link.repo, ref: PREVIEW_BRANCH },
        }),
      })) as VercelDeployment;
      if (created.target === "production") throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
      const id = created.id || created.uid || "";
      if (!id) throw new Error("Preview deployment did not return an id.");
      const url = deploymentUrl(created) || previewUrl;
      return { id, url };
    },
    async wait(id) {
      const started = Date.now();
      while (Date.now() - started < 8 * 60 * 1000) {
        const body = (await vercelFetch(token, teamId, `/v13/deployments/${id}`)) as VercelDeployment;
        if (body.target === "production") throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
        if (body.readyState === "READY") return "READY";
        if (body.readyState === "ERROR" || body.readyState === "CANCELED") return "FAILED";
        await delay(5000);
      }
      return "MANUAL_REVIEW_REQUIRED";
    },
  };
}

async function findProject(token: string): Promise<{ projectId: string; projectName: string; teamId: string }> {
  const direct = await readProject(token, "");
  if (direct) return direct;
  const teams = (await vercelFetch(token, "", "/v2/teams")) as { teams?: Array<{ id?: string }> };
  for (const team of teams.teams ?? []) {
    if (!team.id) continue;
    const found = await readProject(token, team.id);
    if (found) return found;
  }
  throw new Error("Vercel project ai-usecase-site was not found for this account.");
}

async function readProject(token: string, teamId: string): Promise<{ projectId: string; projectName: string; teamId: string } | null> {
  try {
    const project = (await vercelFetch(token, teamId, `/v9/projects/${PREVIEW_PROJECT_NAME}`)) as { id?: string; name?: string };
    if (project.name !== PREVIEW_PROJECT_NAME || !project.id) return null;
    return { projectId: project.id, projectName: project.name, teamId };
  } catch {
    return null;
  }
}

async function findPreviewUrl(token: string, teamId: string, projectId: string): Promise<string> {
  const listed = (await vercelFetch(
    token,
    teamId,
    `/v6/deployments?projectId=${projectId}&target=preview&limit=20`,
  )) as { deployments?: VercelDeployment[] };
  const deployments = listed.deployments ?? [];
  const matching = deployments.filter((item) => deploymentBranch(item) === PREVIEW_BRANCH && item.target !== "production");
  const candidate = matching.find((item) => item.readyState === "READY") ?? matching[0];
  if (!candidate) throw new Error("No private-preview deployment was found.");
  const id = candidate.uid || candidate.id || "";
  const detail = id
    ? ((await vercelFetch(token, teamId, `/v13/deployments/${id}`)) as VercelDeployment)
    : candidate;
  if (detail.target === "production") throw new Error(PRODUCTION_VERCEL_UPDATE_BLOCKED);
  return deploymentUrl(detail);
}

function deploymentBranch(item: VercelDeployment): string {
  return item.meta?.githubCommitRef || item.meta?.gitlabCommitRef || item.meta?.bitbucketCommitRef || "";
}

function deploymentUrl(item: VercelDeployment): string {
  const alias = (item.alias ?? []).find((value) => value.includes(PREVIEW_BRANCH) && value.endsWith(".vercel.app"));
  const host = alias || item.url || "";
  if (!host) return "";
  return host.startsWith("https://") ? host : `https://${host}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
