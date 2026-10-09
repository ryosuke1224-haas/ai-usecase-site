import fs from "node:fs";
import path from "node:path";
import { previousRuns, readJson, REFERENCE_DIR, type loadHistory } from "./memory";
import { BLOCKING_STATUSES } from "./types";

type UseCaseRecord = {
  slug?: string;
  title?: string;
  category?: string;
  summary?: string;
  valuePotential?: string;
  difficulty?: string;
};

export type ResearchContext = {
  schema_version: "atlas-research-context-v1";
  generated_at: string;
  catalog: {
    published_use_cases: { slug: string; title: string; category: string; value: string; summary: string }[];
    blueprints_source: string;
    blueprint_ids: string[];
  };
  completed_blueprints: { id: string; name: string; tier: string; spec: string; note: string }[];
  premium_materials: { path: string; note: string }[];
  previous_reports: { path: string; title: string; candidates: { id: string; name: string; overall?: number }[] }[];
  previous_runs: { run_id: string; mode: string; candidates: { id: string; name: string; rank: number; overall: number }[] }[];
  history: { id: string; name: string; status: string; last_overall: number | null }[];
  excluded_candidates: { id: string; name: string; status: string }[];
  on_hold_candidates: { id: string; name: string }[];
};

export type ReferenceReport = {
  schema_version: "atlas-reference-research-v1";
  title: string;
  generated_at: string;
  note: string;
  candidates: (Record<string, unknown> & {
    id: string;
    name: string;
    criteria: Record<string, number>;
    rationale?: Record<string, string>;
    score_summary?: string;
  })[];
};

export function loadReferenceReports(): { path: string; report: ReferenceReport }[] {
  if (!fs.existsSync(REFERENCE_DIR)) return [];
  return fs
    .readdirSync(REFERENCE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      const file = `${REFERENCE_DIR}/${name}`;
      const report = readJson<ReferenceReport>(file);
      return report?.schema_version === "atlas-reference-research-v1" ? [{ path: file, report }] : [];
    });
}

export function buildResearchContext(
  history: ReturnType<typeof loadHistory>,
  runId: string,
): ResearchContext {
  const useCaseDir = "content/published/use-cases";
  const useCases = fs.existsSync(useCaseDir)
    ? fs
        .readdirSync(useCaseDir)
        .filter((name) => name.endsWith(".json"))
        .map((name) => readJson<UseCaseRecord>(path.join(useCaseDir, name)) ?? {})
        .map((record) => ({
          slug: record.slug ?? "",
          title: record.title ?? "",
          category: record.category ?? "",
          value: record.valuePotential ?? "",
          summary: (record.summary ?? "").slice(0, 220),
        }))
    : [];

  const blueprintsSource = "src/lib/blueprints.ts";
  const blueprintIds = fs.existsSync(blueprintsSource)
    ? [...fs.readFileSync(blueprintsSource, "utf8").matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1])
    : [];

  const completed = history.candidates
    .filter((entry) => entry.status === "COMPLETED" || entry.status === "BUILT")
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      tier: entry.id === "daily-inbox-briefing" ? "free-starter" : "premium",
      spec: fs.existsSync(`agent-specs/${entry.id}.json`) ? `agent-specs/${entry.id}.json` : "",
      note: entry.events.at(-1)?.note ?? "",
    }));

  const references = loadReferenceReports();
  const excluded = history.candidates.filter((entry) => BLOCKING_STATUSES.includes(entry.status));

  return {
    schema_version: "atlas-research-context-v1",
    generated_at: new Date().toISOString(),
    catalog: {
      published_use_cases: useCases,
      blueprints_source: blueprintsSource,
      blueprint_ids: blueprintIds,
    },
    completed_blueprints: completed,
    premium_materials: premiumMaterials(),
    previous_reports: references.map(({ path: file, report }) => ({
      path: file,
      title: report.title,
      candidates: report.candidates.map((candidate) => ({ id: candidate.id, name: candidate.name })),
    })),
    previous_runs: previousRuns(runId)
      .slice(0, 10)
      .map(({ run }) => ({
        run_id: run.run_id,
        mode: run.mode,
        candidates: run.candidates.map(({ id, name, rank, overall }) => ({ id, name, rank, overall })),
      })),
    history: history.candidates.map((entry) => ({
      id: entry.id,
      name: entry.name,
      status: entry.status,
      last_overall: entry.last_scores?.overall ?? null,
    })),
    excluded_candidates: excluded.map((entry) => ({ id: entry.id, name: entry.name, status: entry.status })),
    on_hold_candidates: history.candidates
      .filter((entry) => entry.status === "HOLD")
      .map((entry) => ({ id: entry.id, name: entry.name })),
  };
}

function premiumMaterials(): { path: string; note: string }[] {
  const found: { path: string; note: string }[] = [];
  const add = (file: string, note: string) => {
    if (fs.existsSync(file)) found.push({ path: file.replace(/\\/g, "/"), note });
  };
  for (const dir of listDirs("app/playbooks")) {
    add(`app/playbooks/${dir}/page.tsx`, "Existing playbook page (manual Premium-style material).");
  }
  for (const dir of listDirs("public/downloads")) {
    for (const file of fs.readdirSync(`public/downloads/${dir}`)) {
      add(`public/downloads/${dir}/${file}`, "Downloadable sample asset.");
    }
  }
  for (const dir of listDirs("app/blueprints")) {
    add(`app/blueprints/${dir}`, "Existing Blueprint route. Do not propose a duplicate.");
  }
  add("src/lib/blueprints.ts", "Blueprint catalog and access model (free-authenticated vs premium).");
  add("agents/standards.md", "Free vs Premium boundary and safety rules.");
  return found;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}
