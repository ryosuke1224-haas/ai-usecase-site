import fs from "node:fs";
import { z } from "zod";
import { formatZodError, taskSchema, type AgentTask } from "../atlas-agent/schema";
import { writeJson } from "./memory";
import { runReadOnlyAgent } from "./read-only-agent";
import type { CandidateDecision, ScoredCandidate } from "./types";

const AGENT_TIMEOUT_MS = 20 * 60 * 1000;

const text = z.string().trim().min(1);
const list = z.array(text);

const agentSpecSchema = z.object({
  name: text,
  value_proposition: text,
  persona: text,
  problem: text,
  workflow: list.min(3),
  before: text,
  after: text,
  guided_demo: z.object({
    summary: text,
    steps: list.min(2),
    sample_input: text,
    sample_output: text,
    fictional_data_notice: text,
  }),
  kit_contents: z
    .array(z.object({ id: z.string().min(1), title: text, purpose: text }))
    .min(3),
  decision_rules: list.min(1),
  human_ai_boundary: list.min(1),
  safety: list.min(1),
  required_data_tools: list.min(1),
  acceptance_criteria: list.min(3),
  qa_checks: z
    .array(
      z.object({
        id: z.string().min(1),
        description: text,
        viewport: z.string().default("both"),
        requires_auth: z.boolean().default(false),
      }),
    )
    .min(2),
  out_of_scope: list.default([]),
});

export type BlueprintSpec = z.infer<typeof agentSpecSchema> & {
  schema_version: "atlas-blueprint-spec-v1";
  id: string;
  tier: "premium";
  status: "private-preview";
  source: {
    run_id: string;
    candidate_id: string;
    approved_at: string;
    approval_note: string;
    summary_scores: ScoredCandidate["summary_scores"];
  };
  routes: { guided_demo: string; kit: string };
  allowed_paths: string[];
  constraints: string[];
};

export function blueprintPaths(id: string) {
  return {
    route: `app/blueprints/${id}/`,
    components: `components/premium/${id}/`,
    lib: `src/lib/premium/${id}/`,
    tests: `e2e/${id}/`,
    spec: `agent-specs/${id}.json`,
    task: `agent-tasks/${taskId(id)}.json`,
    demoUrl: `/blueprints/${id}`,
    kitUrl: `/blueprints/${id}/kit`,
  };
}

export function taskId(candidateId: string): string {
  return `${candidateId.slice(0, 48).replace(/-+$/, "")}-premium-build`;
}

function constraints(id: string): string[] {
  const p = blueprintPaths(id);
  return [
    `Private preview only. The guided demo lives at ${p.demoUrl} and the Premium kit at ${p.kitUrl}. Both pages set robots noindex and are not linked from the homepage, header navigation, or My Blueprints.`,
    `The Premium kit requires sign-in with requireUser from src/lib/auth.ts, the same pattern as app/blueprints/daily-inbox-briefing/starter-kit/page.tsx. It is labelled "Premium · Private preview". It shows no price, checkout, or claim that it can be bought today.`,
    "All sample data is fictional and labelled as fictional. No live connector, OAuth flow, API call, or upload to a third party.",
    "AI prepares; the person decides. Confirmed facts, AI interpretation, and recommended actions are labelled separately. Nothing is sent, edited, cancelled, or paid automatically.",
    "No invented statistics, savings, or ROI claims. ChatGPT, Claude, and Gemini capabilities differ by plan; say so where it matters.",
    `New code lives only in ${p.route}, ${p.components}, ${p.lib}, and ${p.tests}. Do not edit shared components, src/lib/blueprints.ts, content/published/, or anything for the Daily Inbox Briefing.`,
    `Playwright tests live in ${p.tests}. Public tests use any *.spec.ts name except authenticated*. Signed-in kit tests go in ${p.tests}authenticated.spec.ts so they use the saved session. Do not edit or skip existing tests.`,
    "Keyboard accessible, visible labels, no horizontal scrolling at a phone-sized viewport, no console errors.",
  ];
}

export async function runSpecAgent(input: {
  candidate: ScoredCandidate;
  approval: CandidateDecision;
  runId: string;
  reportDir: string;
}): Promise<{ spec: BlueprintSpec; specPath: string; command: string }> {
  const { candidate } = input;
  const paths = blueprintPaths(candidate.id);
  const promptPath = `${input.reportDir}/spec-prompt.txt`;
  fs.mkdirSync(input.reportDir, { recursive: true });
  fs.writeFileSync(promptPath, specPrompt(candidate));
  console.log("Spec Agent: writing the structured Blueprint spec (read-only Cursor Agent session)...");
  const { json, command } = await runReadOnlyAgent({
    role: "spec",
    label: "Spec Agent",
    promptPath,
    outputPath: `${input.reportDir}/spec-output.txt`,
    timeoutMs: AGENT_TIMEOUT_MS,
  });
  const parsed = agentSpecSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Spec Agent output did not match the spec shape:\n${formatZodError(parsed.error)}`);
  }
  const spec: BlueprintSpec = {
    schema_version: "atlas-blueprint-spec-v1",
    id: candidate.id,
    tier: "premium",
    status: "private-preview",
    ...parsed.data,
    source: {
      run_id: input.runId,
      candidate_id: candidate.id,
      approved_at: input.approval.decided_at,
      approval_note: input.approval.note,
      summary_scores: candidate.summary_scores,
    },
    routes: { guided_demo: paths.demoUrl, kit: paths.kitUrl },
    allowed_paths: [paths.route, paths.components, paths.lib, paths.tests],
    constraints: constraints(candidate.id),
  };
  writeJson(paths.spec, spec);
  return { spec, specPath: paths.spec, command };
}

export function writeBuildTask(spec: BlueprintSpec): { task: AgentTask; taskPath: string } {
  const task = buildTask(spec);
  const taskPath = blueprintPaths(spec.id).task;
  writeJson(taskPath, task);
  return { task, taskPath };
}

export function buildTask(spec: Pick<BlueprintSpec, "id" | "name" | "kit_contents" | "acceptance_criteria">): AgentTask {
  const paths = blueprintPaths(spec.id);
  const raw = {
    schema_version: "atlas-agent-task-v1",
    id: taskId(spec.id),
    title: `Build the ${spec.name} Premium Blueprint (private preview)`,
    objective: [
      `Build the Premium Blueprint described in ${paths.spec}. Read that spec, agents/standards.md, and AGENTS.md first.`,
      `Create the public guided demo at ${paths.demoUrl} and the signed-in Premium kit at ${paths.kitUrl}.`,
      `Kit contents: ${spec.kit_contents.map((item) => item.title).join("; ")}.`,
      "Follow every entry in the spec's constraints list. Add Playwright coverage for the spec's qa_checks.",
      "Do not commit, push, merge, deploy, or publish.",
    ].join("\n"),
    target_use_case: spec.id,
    scope: [paths.route, paths.components, paths.lib, paths.tests],
    acceptance_criteria: [
      ...spec.acceptance_criteria,
      `The guided demo at ${paths.demoUrl} renders without sign-in on desktop and a phone-sized viewport, uses only fictional data, and says so.`,
      `The kit at ${paths.kitUrl} requires sign-in, is labelled Premium · Private preview, and shows no price, checkout, or purchase claim.`,
      "Both pages set robots noindex and are not linked from the homepage, header, or My Blueprints.",
      "Confirmed facts, AI interpretation, and recommended actions are labelled separately, and every external action stays with the person.",
      `New Playwright tests exist only under ${paths.tests}, cover the public demo and the signed-in kit, and no existing test is changed or skipped.`,
      "The Daily Inbox Briefing, its Starter Kit, and its tests are unchanged.",
    ],
    forbidden_changes: [
      "app/blueprints/daily-inbox-briefing/",
      "app/my-blueprints/",
      "app/page.tsx",
      "app/layout.tsx",
      "components/starter-kit/",
      "components/nav/",
      "components/header.tsx",
      "src/lib/starter-kit/",
      "src/lib/blueprints.ts",
      "src/lib/auth.ts",
      "src/lib/supabase/",
      "content/",
      "e2e/daily-inbox-briefing/",
      "e2e/support/",
      "e2e/global-setup.ts",
      "agent-specs/",
      "agent-tasks/",
      "agents/",
      "atlas-memory/",
      "scripts/",
      "playwright.config.ts",
      "next.config.ts",
      "proxy.ts",
      "package.json",
      "package-lock.json",
    ],
    permits_qa_changes: true,
    requires_authenticated_qa: true,
    product_changes_required: true,
    max_iterations: 3,
    evaluation_targets: [paths.spec, paths.route, paths.components, paths.lib, paths.tests],
  };
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Generated task is invalid:\n${formatZodError(parsed.error)}`);
  return parsed.data;
}

function specPrompt(candidate: ScoredCandidate): string {
  const paths = blueprintPaths(candidate.id);
  return [
    "You are the Atlas Spec Agent. Follow agents/spec.md and agents/standards.md.",
    "This is a read-only session. Inspect files. Do not edit, create, or delete anything. The orchestrator writes the spec file.",
    "",
    "A person approved the candidate below. Turn it into a structured Premium Blueprint spec that a separate Builder can implement and a separate Evaluator can judge.",
    "",
    "INSPECT FIRST",
    "- agent-specs/daily-inbox-briefing.json: the completed free Blueprint spec. Match its level of detail for workflow, safety, and QA.",
    "- app/blueprints/daily-inbox-briefing/starter-kit/: how a signed-in kit page is built.",
    "- src/lib/starter-kit/ and components/starter-kit/: how kit resources, prompts, and demos are structured.",
    "- agents/standards.md and agents/evaluator.md: what the Evaluator will score.",
    "",
    "FIXED DECISIONS (do not change)",
    `- id: ${candidate.id}`,
    `- Guided demo route: ${paths.demoUrl}. Premium kit route: ${paths.kitUrl}.`,
    ...constraints(candidate.id).map((line) => `- ${line}`),
    "",
    "WRITE",
    "- acceptance_criteria: concrete, checkable statements about the finished pages. No vague quality words.",
    "- qa_checks: deterministic browser checks with fictional data. Mark signed-in checks requires_auth true.",
    "- kit_contents: at least 3 resources (for example: setup checklist, prompts, worksheet, decision rules, review checklist, sample files).",
    "- guided_demo.sample_input and sample_output: fictional, short, and consistent with each other. Separate confirmed facts from AI interpretation in the output.",
    "",
    "OUTPUT",
    "Print one JSON object and no other text, with exactly these fields:",
    JSON.stringify(
      {
        name: "Blueprint name",
        value_proposition: "One sentence",
        persona: "Target persona",
        problem: "Business problem",
        workflow: ["Ordered step with the human decision points"],
        before: "Before",
        after: "After",
        guided_demo: {
          summary: "What the public demo shows",
          steps: ["Demo step"],
          sample_input: "Fictional input",
          sample_output: "Mock result",
          fictional_data_notice: "Notice shown on the page",
        },
        kit_contents: [{ id: "kebab-id", title: "Resource title", purpose: "What it is for" }],
        decision_rules: ["Rule the workflow applies before any recommendation"],
        human_ai_boundary: ["What AI does / what the person decides"],
        safety: ["Safety rule"],
        required_data_tools: ["Export or tool"],
        acceptance_criteria: ["Checkable statement"],
        qa_checks: [{ id: "kebab-id", description: "What the test verifies", viewport: "desktop | mobile | both", requires_auth: false }],
        out_of_scope: ["Explicitly not in this version"],
      },
      null,
      2,
    ),
    "",
    "APPROVED CANDIDATE",
    JSON.stringify(candidate, null, 2),
  ].join("\n");
}
