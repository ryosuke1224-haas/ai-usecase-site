import { OVERALL_WEIGHTS, SUMMARY_GROUPS } from "./scoring";
import {
  CRITERIA,
  CRITERION_LABELS,
  type CandidateDecision,
  type FinalReviewDecision,
  type RunRecord,
  type ScoredCandidate,
} from "./types";

export type DashboardState = {
  phase: RunRecord["phase"];
  mode: RunRecord["mode"];
  locked: boolean;
  final_locked: boolean;
  approved_candidate_id: string | null;
  decisions: Record<string, Pick<CandidateDecision, "decision" | "note" | "decided_at">>;
  final_review: Pick<FinalReviewDecision, "decision" | "note" | "decided_at"> | null;
  message: string;
};

export type FinalReviewData = {
  blueprintName: string;
  candidateId: string;
  specPath: string;
  taskPath: string;
  loopResultPath: string | null;
  disposition: string;
  iterationsUsed: number;
  maxIterations: number;
  filesChanged: string[];
  validate: string;
  build: string;
  qa: { status: string; passed: number; failed: number; skipped: number; report: string | null };
  evaluator: {
    status: string;
    decision: string | null;
    overall: number | null;
    reason: string;
    reportPath: string | null;
    scores: { dimension: string; score: number }[];
    findings: { id: string; severity: string; description: string; recommendation: string }[];
  };
  criticalIssues: string[];
  sampleInput: string;
  sampleOutput: string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const e = escapeHtml;

export function renderCandidateDashboard(input: {
  run: RunRecord;
  candidates: ScoredCandidate[];
  state: DashboardState;
  token: string;
}): string {
  const { run, candidates, state } = input;
  const dry = run.mode === "dry-run";
  const banner = dry
    ? `<strong>Dry run.</strong> Decisions are recorded in Atlas memory. Approving does <em>not</em> start the Spec Agent or the Builder.`
    : `<strong>Approval required.</strong> Nothing is specified or built until you approve one candidate. Only one Blueprint is built per run.`;
  const sourceNote =
    run.research_source === "reference-library"
      ? `<div class="notice warn">These candidates come from the reference library, not a fresh Research Agent run. ${run.research_notes.map(e).join(" ")}</div>`
      : run.research_notes.length > 0
        ? `<div class="notice">${run.research_notes.map(e).join("<br>")}</div>`
        : "";

  const table = `
  <section class="panel compare">
    <div class="panel-head">
      <h2>Compare candidates</h2>
      <p class="muted">Overall = ${OVERALL_WEIGHTS.commercial * 100}% Commercial + ${OVERALL_WEIGHTS.atlas_fit * 100}% Atlas Fit + ${OVERALL_WEIGHTS.buildability * 100}% Buildability + ${OVERALL_WEIGHTS.time_to_value * 100}% Time to value. Highest score is a recommendation, not a decision.</p>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Candidate</th><th>Overall</th><th>Commercial</th><th>Atlas Fit</th><th>Buildability</th><th>Setup</th><th>Automation</th><th>Decision</th></tr></thead>
      <tbody>
      ${candidates
        .map(
          (c) => `<tr>
          <td><span class="rank sm">${c.rank}</span></td>
          <td><a href="#card-${e(c.id)}">${e(c.name)}</a><div class="muted xs">${e(truncate(c.persona, 90))}</div></td>
          <td><strong class="big-num">${c.summary_scores.overall.toFixed(2)}</strong></td>
          <td>${bar(c.summary_scores.commercial, "commercial")}</td>
          <td>${bar(c.summary_scores.atlas_fit, "fit")}</td>
          <td>${bar(c.summary_scores.buildability, "build")}</td>
          <td>${pill(c.setup_difficulty, difficultyTone(c.setup_difficulty))}</td>
          <td>${pill(c.automation_potential, levelTone(c.automation_potential))}</td>
          <td><span class="status" data-status-for="${e(c.id)}">${statusLabel(state.decisions[c.id]?.decision, c.history_status)}</span></td>
        </tr>`,
        )
        .join("")}
      </tbody>
    </table></div>
  </section>`;

  const cards = candidates.map((c) => candidateCard(c, state)).join("");

  const body = `
  <header class="top">
    <div class="top-inner">
      <div>
        <p class="eyebrow">Atlas Auto · Candidate review</p>
        <h1>Premium Blueprint candidates</h1>
        <p class="sub">Run <code>${e(run.run_id)}</code> · ${e(run.mode === "dry-run" ? "dry run" : "full run")} · branch <code>${e(run.branch)}</code> · research: ${e(run.research_source ?? "n/a")} · scoring: ${e(run.scoring_source ?? "n/a")}</p>
      </div>
      <div class="top-actions">
        <button class="btn ghost" data-end-review>End review without approving</button>
      </div>
    </div>
  </header>
  <main>
    <div class="notice main">${banner}</div>
    <div class="notice error hidden" id="file-mode">This page was opened from disk. Open the localhost URL printed by <code>npm run atlas:auto</code> to record decisions.</div>
    <div class="notice ok hidden" id="state-message"></div>
    ${sourceNote}
    ${table}
    <div class="legend">
      <span>${legendDot("commercial")} Commercial: ${SUMMARY_GROUPS.commercial.map((k) => CRITERION_LABELS[k]).join(", ")}</span>
      <span>${legendDot("fit")} Atlas Fit: ${SUMMARY_GROUPS.atlas_fit.map((k) => CRITERION_LABELS[k]).join(", ")}</span>
      <span>${legendDot("build")} Buildability: ${SUMMARY_GROUPS.buildability.map((k) => CRITERION_LABELS[k]).join(", ")}</span>
    </div>
    <section class="grid">${cards}</section>
    ${
      run.filtered_candidates.length > 0
        ? `<section class="panel"><h2>Filtered out</h2><ul class="plain">${run.filtered_candidates
            .map((f) => `<li><strong>${e(f.name)}</strong> <span class="muted">— ${e(f.reason)}</span></li>`)
            .join("")}</ul></section>`
        : ""
    }
    <footer class="foot">Recording a decision never commits, pushes, merges, deploys, or publishes. Decisions are written to <code>atlas-memory/runs/${e(run.run_id)}/</code>.</footer>
  </main>
  <div id="toast" class="toast hidden"></div>`;

  return page("Atlas Auto · Candidate review", body, candidateScript({ token: input.token, state, dry, names: Object.fromEntries(candidates.map((c) => [c.id, c.name])) }));
}

function candidateCard(c: ScoredCandidate, state: DashboardState): string {
  const decision = state.decisions[c.id];
  const history =
    c.history_status && c.history_status !== "PROPOSED"
      ? `<span class="pill tone-amber">Previously ${e(c.history_status)}</span>`
      : "";
  return `
  <article class="card" id="card-${e(c.id)}" data-card="${e(c.id)}">
    <div class="card-head">
      <div class="rank">${c.rank}</div>
      <div class="title">
        <h3>${e(c.name)}</h3>
        <p class="persona">${e(c.persona)}</p>
        <div class="chips">${pill(`Setup ${c.setup_difficulty}`, difficultyTone(c.setup_difficulty))}${pill(`Automation ${c.automation_potential}`, levelTone(c.automation_potential))}${pill(`Oversight ${c.human_oversight}`, "slate")}${history}${c.source === "reference-library" ? pill("Reference", "slate") : ""}</div>
      </div>
      ${ring(c.summary_scores.overall)}
    </div>
    <div class="summary-scores">
      ${summaryScore("Commercial", c.summary_scores.commercial, "commercial")}
      ${summaryScore("Atlas Fit", c.summary_scores.atlas_fit, "fit")}
      ${summaryScore("Buildability", c.summary_scores.buildability, "build")}
    </div>
    <div class="card-body">
      ${section("Business problem", `<p>${e(c.problem)}</p>`)}
      <div class="before-after">
        <div class="ba before"><span class="ba-label">Before</span><p>${e(c.before)}</p></div>
        <div class="ba-arrow" aria-hidden="true">→</div>
        <div class="ba after"><span class="ba-label">After</span><p>${e(c.after)}</p></div>
      </div>
      ${section("Workflow", `<ol class="steps">${c.workflow.map((s) => `<li>${e(s)}</li>`).join("")}</ol>`)}
      ${section("Why someone would pay", `<p>${e(c.why_pay)}</p>`)}
      ${section("Estimated Premium value", `<p class="value">${e(c.estimated_premium_value)}</p>`)}
      ${section("Required integrations / data", `<div class="chips">${c.required_data_tools.map((t) => `<span class="chip">${e(t)}</span>`).join("")}</div>`)}
      ${section("Major risks", `<ul class="risks">${c.major_risks.map((r) => `<li>${e(r)}</li>`).join("")}</ul>`)}
      <div class="demo">
        <div><span class="demo-label">Sample input</span><pre>${e(c.sample_input)}</pre></div>
        <div><span class="demo-label">Sample output / mock result</span><pre>${e(c.sample_output)}</pre></div>
      </div>
      ${section("Guided-demo concept", `<p>${e(c.guided_demo)}</p>`)}
      ${c.novelty_note ? section("Why it is different", `<p>${e(c.novelty_note)}</p>`) : ""}
      <details class="breakdown">
        <summary>Score breakdown (13 criteria)</summary>
        ${c.scores.summary ? `<p class="muted">${e(c.scores.summary)}</p>` : ""}
        <table class="criteria">
          ${CRITERIA.map(
            (k) => `<tr><th>${e(CRITERION_LABELS[k])}</th><td class="num">${c.scores.criteria[k].toFixed(1)}</td><td>${miniBar(c.scores.criteria[k])}${c.scores.rationale[k] ? `<div class="xs muted">${e(c.scores.rationale[k])}</div>` : ""}</td></tr>`,
          ).join("")}
        </table>
      </details>
    </div>
    <div class="decide">
      <label class="xs muted" for="note-${e(c.id)}">Note for Atlas memory (optional)</label>
      <textarea id="note-${e(c.id)}" rows="2" placeholder="Why approve, hold, or reject?">${e(decision?.note ?? "")}</textarea>
      <div class="buttons">
        <button class="btn approve" data-decision="APPROVED" data-candidate="${e(c.id)}">Approve</button>
        <button class="btn hold" data-decision="HOLD" data-candidate="${e(c.id)}">Hold</button>
        <button class="btn reject" data-decision="REJECTED" data-candidate="${e(c.id)}">Reject</button>
      </div>
      <div class="decision-line">Decision: <span class="status" data-status-for="${e(c.id)}">${statusLabel(decision?.decision, c.history_status)}</span></div>
    </div>
  </article>`;
}

export function renderFinalReview(input: {
  run: RunRecord;
  data: FinalReviewData;
  state: DashboardState;
  token: string;
}): string {
  const { run, data, state } = input;
  const ready = data.disposition === "READY_FOR_HUMAN_REVIEW";
  const body = `
  <header class="top">
    <div class="top-inner">
      <div>
        <p class="eyebrow">Atlas Auto · Final human review</p>
        <h1>${e(data.blueprintName)}</h1>
        <p class="sub">Run <code>${e(run.run_id)}</code> · candidate <code>${e(data.candidateId)}</code> · branch <code>${e(run.branch)}</code></p>
      </div>
      <div>${pill(data.disposition, ready ? "green" : "amber")}</div>
    </div>
  </header>
  <main>
    <div class="notice main"><strong>Nothing has been committed, pushed, merged, deployed, or published.</strong> Your decision is recorded in Atlas memory for later. Publishing remains a separate manual step.</div>
    <div class="notice ok hidden" id="state-message"></div>
    <div class="notice error hidden" id="file-mode">This page was opened from disk. Open the localhost URL printed by <code>npm run atlas:auto</code> to record a decision.</div>
    <section class="stats">
      ${stat("Status", data.disposition, ready ? "green" : "amber")}
      ${stat("Build", data.build, data.build === "pass" ? "green" : "red")}
      ${stat("QA", `${data.qa.status} · ${data.qa.passed} passed / ${data.qa.failed} failed / ${data.qa.skipped} skipped`, data.qa.status === "pass" ? "green" : "red")}
      ${stat("Evaluator", data.evaluator.overall != null ? `${data.evaluator.overall.toFixed(1)} · ${data.evaluator.decision}` : data.evaluator.status, data.evaluator.decision === "PASS" ? "green" : data.evaluator.decision === "PASS_WITH_RECOMMENDATIONS" ? "amber" : "red")}
      ${stat("Iterations", `${data.iterationsUsed} of ${data.maxIterations}`, "slate")}
    </section>
    <div class="two-col">
      <section class="panel">
        <h2>Critical issues</h2>
        ${data.criticalIssues.length === 0 ? `<p class="muted">None reported.</p>` : `<ul class="risks">${data.criticalIssues.map((i) => `<li>${e(i)}</li>`).join("")}</ul>`}
        <h2>Files changed</h2>
        ${data.filesChanged.length === 0 ? `<p class="muted">No files kept.</p>` : `<ul class="files">${data.filesChanged.map((f) => `<li><code>${e(f)}</code></li>`).join("")}</ul>`}
        <h2>Artifacts</h2>
        <ul class="files">
          <li>Spec: <code>${e(data.specPath)}</code></li>
          <li>Task: <code>${e(data.taskPath)}</code></li>
          ${data.loopResultPath ? `<li>Loop result: <code>${e(data.loopResultPath)}</code></li>` : ""}
          ${data.qa.report ? `<li>QA report: <code>${e(data.qa.report)}</code></li>` : ""}
          ${data.evaluator.reportPath ? `<li>Evaluator report: <code>${e(data.evaluator.reportPath)}</code></li>` : ""}
        </ul>
      </section>
      <section class="panel">
        <h2>Evaluator scores</h2>
        ${data.evaluator.scores.length === 0 ? `<p class="muted">${e(data.evaluator.reason || "The Evaluator did not run.")}</p>` : `<table class="criteria">${data.evaluator.scores.map((s) => `<tr><th>${e(s.dimension.replace(/_/g, " "))}</th><td class="num">${s.score.toFixed(1)}</td><td>${miniBar(s.score)}</td></tr>`).join("")}</table>`}
      </section>
    </div>
    <section class="panel">
      <h2>Evaluator findings</h2>
      ${
        data.evaluator.findings.length === 0
          ? `<p class="muted">No findings.</p>`
          : `<div class="table-wrap"><table><thead><tr><th>Severity</th><th>Finding</th><th>Recommendation</th></tr></thead><tbody>${data.evaluator.findings
              .map(
                (f) => `<tr><td>${pill(f.severity, severityTone(f.severity))}</td><td><div class="xs muted">${e(f.id)}</div>${e(f.description)}</td><td>${e(f.recommendation)}</td></tr>`,
              )
              .join("")}</tbody></table></div>`
      }
    </section>
    <section class="panel">
      <h2>Sample output</h2>
      <div class="demo">
        <div><span class="demo-label">Sample input</span><pre>${e(data.sampleInput)}</pre></div>
        <div><span class="demo-label">Sample output / mock result</span><pre>${e(data.sampleOutput)}</pre></div>
      </div>
    </section>
    <section class="panel decide final">
      <h2>Your decision</h2>
      <label class="xs muted" for="final-note">Note (optional, stored in Atlas memory)</label>
      <textarea id="final-note" rows="3" placeholder="What should change, or why this is ready for later publishing?">${e(state.final_review?.note ?? "")}</textarea>
      <div class="buttons">
        <button class="btn approve" data-final="APPROVED_FOR_LATER_PUBLISHING">Approve for later publishing</button>
        <button class="btn hold" data-final="CHANGES_REQUESTED">Request changes</button>
        <button class="btn reject" data-final="REJECTED">Reject</button>
      </div>
      <div class="decision-line">Decision: <span class="status" id="final-status">${e(state.final_review?.decision ?? "Waiting")}</span></div>
    </section>
    <footer class="foot">Approving here does not publish. It marks the Blueprint COMPLETED in <code>atlas-memory/candidate-history.json</code> so a person can publish it later.</footer>
  </main>
  <div id="toast" class="toast hidden"></div>`;
  return page(`Atlas Auto · Final review · ${data.blueprintName}`, body, finalScript({ token: input.token, state }));
}

function page(title: string, body: string, script: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${e(title)}</title>
<style>${CSS}</style>
</head>
<body>
${body}
<script>${script}</script>
</body>
</html>
`;
}

function candidateScript(config: { token: string; state: DashboardState; dry: boolean; names: Record<string, string> }): string {
  return `
const CONFIG = ${scriptJson(config)};
${SHARED_SCRIPT}
function apply(state) {
  for (const el of document.querySelectorAll('[data-status-for]')) {
    const id = el.getAttribute('data-status-for');
    const d = state.decisions[id];
    if (d) { el.textContent = d.decision; el.className = 'status s-' + d.decision; }
  }
  for (const card of document.querySelectorAll('[data-card]')) {
    const id = card.getAttribute('data-card');
    card.classList.toggle('approved', state.approved_candidate_id === id);
    card.classList.toggle('dimmed', Boolean(state.approved_candidate_id) && state.approved_candidate_id !== id);
  }
  const off = state.locked || !LIVE;
  for (const b of document.querySelectorAll('[data-decision],[data-end-review]')) b.disabled = off;
  if (state.message) showMessage(state.message);
}
for (const btn of document.querySelectorAll('[data-decision]')) {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-candidate');
    const decision = btn.getAttribute('data-decision');
    if (decision === 'APPROVED') {
      const text = CONFIG.dry
        ? 'Approve "' + CONFIG.names[id] + '"? This is a dry run, so the decision is recorded but nothing is built.'
        : 'Approve "' + CONFIG.names[id] + '"? Atlas will write a Blueprint spec and start the Builder. Only one candidate can be approved per run.';
      if (!confirm(text)) return;
    }
    const note = (document.getElementById('note-' + id) || {}).value || '';
    try { apply(await post('/api/decision', { candidate_id: id, decision, note })); toast(decision + ' recorded for ' + CONFIG.names[id]); }
    catch (err) { toast(err.message, true); }
  });
}
const end = document.querySelector('[data-end-review]');
if (end) end.addEventListener('click', async () => {
  if (!confirm('End this review without approving a candidate? Hold and reject decisions are kept.')) return;
  try { apply(await post('/api/end-review', {})); toast('Review ended.'); } catch (err) { toast(err.message, true); }
});
apply(CONFIG.state);
poll();
`;
}

function finalScript(config: { token: string; state: DashboardState }): string {
  return `
const CONFIG = ${scriptJson(config)};
${SHARED_SCRIPT}
function apply(state) {
  const el = document.getElementById('final-status');
  if (state.final_review) { el.textContent = state.final_review.decision; el.className = 'status s-' + state.final_review.decision; }
  for (const b of document.querySelectorAll('[data-final]')) b.disabled = state.final_locked || !LIVE;
  if (state.message) showMessage(state.message);
}
for (const btn of document.querySelectorAll('[data-final]')) {
  btn.addEventListener('click', async () => {
    const decision = btn.getAttribute('data-final');
    if (!confirm('Record "' + decision + '"? This does not publish, commit, push, or deploy.')) return;
    const note = document.getElementById('final-note').value || '';
    try { apply(await post('/api/final-review', { decision, note })); toast(decision + ' recorded.'); }
    catch (err) { toast(err.message, true); }
  });
}
apply(CONFIG.state);
poll();
`;
}

const SHARED_SCRIPT = `
const LIVE = location.protocol === 'http:' || location.protocol === 'https:';
if (!LIVE) document.getElementById('file-mode').classList.remove('hidden');
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-atlas-token': CONFIG.token }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('Request failed: ' + res.status));
  return data;
}
function toast(text, bad) {
  const t = document.getElementById('toast');
  t.textContent = text; t.className = 'toast' + (bad ? ' bad' : '');
  clearTimeout(window.__t); window.__t = setTimeout(() => t.classList.add('hidden'), 3500);
}
function showMessage(text) { const m = document.getElementById('state-message'); m.textContent = text; m.classList.remove('hidden'); }
function poll() {
  if (!LIVE) return;
  setInterval(async () => { try { const r = await fetch('/api/state'); if (r.ok) apply(await r.json()); } catch {} }, 4000);
}
`;

function ring(score: number): string {
  const pct = Math.max(0, Math.min(100, score * 10));
  return `<div class="ring" style="--p:${pct.toFixed(1)}" title="Overall recommendation score"><div><strong>${score.toFixed(2)}</strong><span>overall</span></div></div>`;
}

function summaryScore(label: string, value: number, tone: string): string {
  return `<div class="sscore"><div class="sscore-top"><span>${e(label)}</span><strong>${value.toFixed(1)}</strong></div>${bar(value, tone, false)}</div>`;
}

function bar(value: number, tone: string, withNumber = true): string {
  return `<div class="bar-row">${withNumber ? `<span class="num">${value.toFixed(1)}</span>` : ""}<div class="bar"><i class="t-${tone}" style="width:${Math.max(0, Math.min(100, value * 10))}%"></i></div></div>`;
}

function miniBar(value: number): string {
  return `<div class="bar mini"><i class="t-${value >= 8 ? "commercial" : value >= 6 ? "fit" : "low"}" style="width:${value * 10}%"></i></div>`;
}

function legendDot(tone: string): string {
  return `<i class="dot t-${tone}"></i>`;
}

function pill(text: string, tone: string): string {
  return `<span class="pill tone-${tone}">${e(text)}</span>`;
}

function stat(label: string, value: string, tone: string): string {
  return `<div class="stat tone-border-${tone}"><span>${e(label)}</span><strong>${e(value)}</strong></div>`;
}

function section(title: string, html: string): string {
  return `<div class="section"><h4>${e(title)}</h4>${html}</div>`;
}

function statusLabel(decision: string | undefined, history: string | null): string {
  if (decision) return `<span class="s-${e(decision)}">${e(decision)}</span>`;
  if (history && history !== "PROPOSED") return `Pending (previously ${e(history)})`;
  return "Pending";
}

function difficultyTone(value: string): string {
  return value === "EASY" ? "green" : value === "MODERATE" ? "amber" : "red";
}

function levelTone(value: string): string {
  return value === "HIGH" ? "green" : value === "MEDIUM" ? "amber" : "slate";
}

function severityTone(value: string): string {
  if (value === "CRITICAL" || value === "HIGH") return "red";
  if (value === "MEDIUM") return "amber";
  return "slate";
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

const CSS = `
:root{--bg:#f4f5fa;--card:#fff;--ink:#0f172a;--muted:#64748b;--line:#e5e7ef;--accent:#4f46e5;--accent-soft:#e0e7ff;--green:#059669;--amber:#d97706;--red:#dc2626;--slate:#475569;--c-commercial:#0ea5e9;--c-fit:#8b5cf6;--c-build:#10b981}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
code{font:12px ui-monospace,SFMono-Regular,Consolas,monospace;background:rgba(15,23,42,.06);padding:1px 5px;border-radius:5px}
.top{background:radial-gradient(1200px 400px at 10% -20%,#6366f1 0,transparent 60%),linear-gradient(135deg,#0b1026,#1e1b4b 55%,#312e81);color:#fff;padding:32px 0 36px}
.top code{background:rgba(255,255,255,.12);color:#e0e7ff}
.top-inner{max-width:1440px;margin:0 auto;padding:0 32px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
.eyebrow{margin:0;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-weight:700;color:#a5b4fc}
h1{margin:6px 0 6px;font-size:30px;letter-spacing:-.02em}
.sub{margin:0;color:#c7d2fe;font-size:13px}
main{max-width:1440px;margin:-18px auto 0;padding:0 32px 56px}
.notice{background:#fff;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:12px;padding:12px 16px;margin:0 0 14px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
.notice.main{position:relative}
.notice.warn{border-left-color:var(--amber);background:#fffbeb}
.notice.error{border-left-color:var(--red);background:#fef2f2}
.notice.ok{border-left-color:var(--green);background:#ecfdf5}
.hidden{display:none!important}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:0 0 18px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 10px 30px rgba(15,23,42,.05)}
.panel h2{margin:0 0 10px;font-size:16px}
.panel h2:not(:first-child){margin-top:18px}
.panel-head{display:flex;justify-content:space-between;gap:16px;align-items:baseline;flex-wrap:wrap}
.panel-head p{margin:0 0 10px;max-width:760px}
.muted{color:var(--muted)}
.xs{font-size:12px}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px 10px;border-bottom:1px solid var(--line);vertical-align:middle}
thead th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700}
tbody tr:hover{background:#f8fafc}
td a{color:var(--ink);font-weight:600;text-decoration:none}
td a:hover{color:var(--accent)}
.big-num{font-size:18px}
.legend{display:flex;gap:18px;flex-wrap:wrap;color:var(--muted);font-size:12px;margin:4px 2px 16px}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px;vertical-align:middle}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:20px;align-items:start}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;box-shadow:0 1px 2px rgba(15,23,42,.04),0 12px 32px rgba(15,23,42,.07);display:flex;flex-direction:column;overflow:hidden;transition:opacity .2s,box-shadow .2s}
.card.approved{outline:3px solid var(--green);box-shadow:0 0 0 6px rgba(5,150,105,.12),0 12px 32px rgba(15,23,42,.08)}
.card.dimmed{opacity:.55}
.card-head{display:flex;gap:14px;padding:20px 20px 12px;align-items:flex-start}
.rank{flex:none;width:34px;height:34px;border-radius:10px;background:var(--ink);color:#fff;display:grid;place-items:center;font-weight:800}
.rank.sm{width:26px;height:26px;border-radius:8px;font-size:12px}
.title{flex:1;min-width:0}
.title h3{margin:2px 0 4px;font-size:18px;letter-spacing:-.01em}
.persona{margin:0 0 8px;color:var(--muted);font-size:13px}
.ring{flex:none;width:78px;height:78px;border-radius:50%;background:conic-gradient(var(--accent) calc(var(--p)*1%),var(--accent-soft) 0);display:grid;place-items:center}
.ring>div{width:62px;height:62px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring strong{font-size:17px;line-height:1}
.ring span{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.summary-scores{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:4px 20px 16px;border-bottom:1px solid var(--line)}
.sscore-top{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px}
.sscore-top strong{color:var(--ink);font-size:14px}
.bar-row{display:flex;align-items:center;gap:8px;min-width:120px}
.bar-row .num{width:28px;font-weight:600}
.bar{flex:1;height:8px;background:#eef0f6;border-radius:99px;overflow:hidden}
.bar.mini{height:6px;margin-bottom:2px}
.bar i{display:block;height:100%;border-radius:99px}
.t-commercial{background:var(--c-commercial)}.t-fit{background:var(--c-fit)}.t-build{background:var(--c-build)}.t-low{background:#f59e0b}
.card-body{padding:6px 20px 8px}
.section{margin:14px 0}
.section h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
.section p{margin:0}
.value{font-weight:600}
.steps{margin:0;padding-left:20px}
.steps li{margin:3px 0}
.risks{margin:0;padding-left:18px}
.risks li{margin:3px 0}
.risks li::marker{color:var(--red)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{background:#f1f5f9;border:1px solid var(--line);border-radius:99px;padding:2px 10px;font-size:12px}
.pill{display:inline-block;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:700;letter-spacing:.03em;border:1px solid transparent}
.tone-green{background:#ecfdf5;color:var(--green);border-color:#a7f3d0}
.tone-amber{background:#fffbeb;color:var(--amber);border-color:#fde68a}
.tone-red{background:#fef2f2;color:var(--red);border-color:#fecaca}
.tone-slate{background:#f1f5f9;color:var(--slate);border-color:#e2e8f0}
.before-after{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:stretch;margin:14px 0}
.ba{border-radius:12px;padding:10px 12px;font-size:13px}
.ba p{margin:0}
.ba.before{background:#fef2f2;border:1px solid #fecaca}
.ba.after{background:#ecfdf5;border:1px solid #a7f3d0}
.ba-label{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;color:var(--muted)}
.ba-arrow{align-self:center;font-size:20px;color:var(--muted)}
.demo{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.card .demo{grid-template-columns:1fr}
.demo-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700;margin-bottom:4px}
pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:10px 12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;max-height:260px;overflow:auto}
details.breakdown{margin:12px 0 6px;border:1px solid var(--line);border-radius:12px;padding:8px 12px;background:#fafbff}
details.breakdown summary{cursor:pointer;font-weight:600}
table.criteria th{font-weight:500;width:42%;font-size:13px}
table.criteria td.num{width:44px;font-weight:700}
.decide{margin-top:auto;border-top:1px solid var(--line);padding:14px 20px 18px;background:#fafbff}
.decide.final{background:#fff}
textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;resize:vertical;margin:4px 0 10px;background:#fff}
.buttons{display:flex;gap:8px;flex-wrap:wrap}
.btn{border:0;border-radius:10px;padding:10px 16px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;cursor:pointer;transition:transform .05s,filter .15s}
.btn:active{transform:translateY(1px)}
.btn:hover{filter:brightness(1.07)}
.btn:disabled{opacity:.45;cursor:not-allowed;filter:none}
.btn.approve{background:var(--green);color:#fff;flex:1.4}
.btn.hold{background:#fef3c7;color:#92400e;flex:1}
.btn.reject{background:#fee2e2;color:#991b1b;flex:1}
.btn.ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.3)}
.decision-line{margin-top:10px;font-size:13px;color:var(--muted)}
.status{font-weight:700;color:var(--ink)}
.s-APPROVED,.s-APPROVED_FOR_LATER_PUBLISHING{color:var(--green)}
.s-HOLD,.s-CHANGES_REQUESTED{color:var(--amber)}
.s-REJECTED{color:var(--red)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:0 0 18px}
.stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;border-top:4px solid var(--slate)}
.stat span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700}
.stat strong{font-size:15px}
.tone-border-green{border-top-color:var(--green)}.tone-border-amber{border-top-color:var(--amber)}.tone-border-red{border-top-color:var(--red)}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.two-col .panel{margin:0 0 18px}
.files{margin:0;padding-left:18px}
.plain{margin:0;padding-left:18px}
.foot{color:var(--muted);font-size:12px;margin-top:24px;text-align:center}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.3);font-weight:600;z-index:10}
.toast.bad{background:var(--red)}
@media (max-width:760px){main{padding:0 14px 40px}.top-inner{padding:0 14px}.grid{grid-template-columns:1fr}.demo,.two-col{grid-template-columns:1fr}.before-after{grid-template-columns:1fr}.ba-arrow{transform:rotate(90deg);justify-self:center}.summary-scores{grid-template-columns:1fr}}
`;
