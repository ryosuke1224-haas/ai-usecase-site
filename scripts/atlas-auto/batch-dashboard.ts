import { parseApprovedAmount } from "../../src/lib/payments/provision";
import { escapeHtml, wrapDashboardPage } from "./dashboard";
import {
  BATCH_HUMAN_REVIEW_REQUIRED,
  EXISTING_COMPLETED_PRODUCT,
  type BatchHumanDecision,
  type BatchProduct,
  type BatchRecord,
} from "./batch";

export type BatchDashboardState = {
  phase: string;
  locked: boolean;
  message: string;
  decisions: Record<string, Pick<BatchHumanDecision, "decision" | "amount_cents" | "note" | "decided_at">>;
  commerce: Record<string, string>;
};

const e = escapeHtml;

export function renderBatchReview(input: {
  batch: BatchRecord;
  state: BatchDashboardState;
  token: string;
}): string {
  const { batch, state } = input;
  const comparison = batch.comparison;
  const body = `
  <header class="top">
    <div class="top-inner">
      <div>
        <p class="eyebrow">Atlas Auto · Batch review</p>
        <h1>Compare ${batch.completed.length} products</h1>
        <p class="sub">Batch <code>${e(batch.batch_id)}</code> · requested additional successes: ${batch.requested_success_count} · ${e(batch.phase)}</p>
      </div>
      <div>${pill(batch.phase, batch.phase === BATCH_HUMAN_REVIEW_REQUIRED ? "green" : "amber")}</div>
    </div>
  </header>
  <main>
    <div class="notice main"><strong>Nothing has been committed, pushed, merged, deployed, or published.</strong> Stripe Sandbox is contacted only when you submit approved products. Existing completed products are not provisioned again.</div>
    <div class="notice ok hidden" id="state-message"></div>
    <div class="notice error hidden" id="file-mode">This page was opened from disk. Open the localhost URL printed by <code>npm run atlas:auto -- --resume-batch ${e(batch.batch_id)}</code> to record decisions.</div>
    ${
      comparison
        ? `<section class="panel">
        <h2>Portfolio comparison</h2>
        <p class="muted">This is a relative ranking. It does not replace per-product Evaluator or Supervisor results.</p>
        ${compareRow("Strongest overall", comparison.strongest_overall, batch.completed)}
        ${compareRow("Strongest commercial potential", comparison.strongest_commercial, batch.completed)}
        ${compareRow("Easiest to understand", comparison.easiest_to_understand, batch.completed)}
        ${compareRow("Easiest to onboard", comparison.easiest_to_onboard, batch.completed)}
        ${compareRow("Strongest AI literacy value", comparison.strongest_ai_literacy, batch.completed)}
        ${compareRow("Highest safety confidence", comparison.highest_safety, batch.completed)}
        ${compareRow("Most differentiated", comparison.most_differentiated, batch.completed)}
        ${compareRow("Recommended launch order", comparison.recommended_launch_order, batch.completed)}
        <p>Potentially redundant: <strong>${comparison.potentially_redundant.length === 0 ? "none" : comparison.potentially_redundant.map((pair) => `${nameOf(pair.left, batch.completed)} / ${nameOf(pair.right, batch.completed)}`).join("; ")}</strong></p>
        <p>Consider reject or merge: <strong>${comparison.reject_or_merge.length === 0 ? "none" : comparison.reject_or_merge.map((id) => nameOf(id, batch.completed)).join(", ")}</strong></p>
      </section>`
        : ""
    }
    <section class="panel compare">
      <div class="panel-head"><h2>Batch products</h2></div>
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Product</th><th>Area</th><th>Eval</th><th>Clarity</th><th>Action</th><th>SMB</th><th>Literacy</th><th>Safety</th><th>Setup</th><th>Boundary</th><th>Build</th><th>QA</th><th>Auth QA</th><th>Block</th><th>Price</th><th>Status</th><th>Rec</th>
        </tr></thead>
        <tbody>
        ${batch.completed.map((product) => productRow(product, state)).join("")}
        </tbody>
      </table></div>
    </section>
    <section class="grid">${batch.completed.map((product) => productCard(product, state)).join("")}</section>
    ${
      batch.failed.length > 0
        ? `<section class="panel"><h2>Failed / intervention</h2><ul class="plain">${batch.failed
            .map((item) => `<li><strong>${e(item.name)}</strong> — ${e(item.classification)} · ${e(item.reason)}</li>`)
            .join("")}</ul></section>`
        : ""
    }
    <section class="panel decide final">
      <h2>Submit batch decisions</h2>
      <p>APPROVE, REQUEST CHANGES, or REJECT each new product. Stripe Sandbox runs only for newly approved products after you submit.</p>
      <button class="btn approve" data-batch-submit>Submit batch decisions</button>
    </section>
    <footer class="foot">Recording a decision never commits, pushes, merges, deploys, or publishes.</footer>
  </main>
  <div id="toast" class="toast hidden"></div>`;
  return wrapDashboardPage("Atlas Auto · Batch review", body, batchScript({ token: input.token, state, names: Object.fromEntries(batch.completed.map((item) => [item.candidate_id, item.name])) }));
}

export function parseBatchDecisionBody(
  body: Record<string, unknown>,
  now: string,
): { ok: true; decision: BatchHumanDecision } | { ok: false; error: string } {
  const candidateId = typeof body.candidate_id === "string" ? body.candidate_id : "";
  const decision = body.decision;
  if (!candidateId) return { ok: false, error: "Unknown candidate." };
  if (decision !== "APPROVE" && decision !== "REQUEST_CHANGES" && decision !== "REJECT") {
    return { ok: false, error: "Unknown decision." };
  }
  let amount: number | null = null;
  if (decision === "APPROVE") {
    const parsed = parseApprovedAmount({ choice: body.price_choice, customDollars: body.custom_dollars });
    if (!parsed.ok) return { ok: false, error: parsed.error };
    amount = parsed.cents;
  }
  return {
    ok: true,
    decision: {
      candidate_id: candidateId,
      decision,
      amount_cents: amount,
      payment_type: "ONE_TIME",
      note: typeof body.note === "string" ? body.note.slice(0, 2000) : "",
      decided_at: now,
    },
  };
}

function productRow(product: BatchProduct, state: BatchDashboardState): string {
  const decision = state.decisions[product.candidate_id];
  return `<tr>
    <td><a href="#card-${e(product.candidate_id)}">${e(product.name)}</a>${product.status === EXISTING_COMPLETED_PRODUCT ? ` ${pill("EXISTING_COMPLETED_PRODUCT", "slate")}` : ""}</td>
    <td>${e(product.business_area)}</td>
    <td><strong>${product.evaluator_score == null ? "n/a" : product.evaluator_score.toFixed(1)}</strong></td>
    ${num(product.dimensions.clarity)}${num(product.dimensions.actionability)}${num(product.dimensions.smb_relevance)}${num(product.dimensions.ai_literacy)}${num(product.dimensions.safety)}${num(product.dimensions.setup_usability)}${num(product.dimensions.human_ai_boundary)}
    <td>${e(product.build)}</td>
    <td>${e(product.qa.status)} ${product.qa.passed}/${product.qa.passed + product.qa.failed}</td>
    <td>${e(product.authenticated_qa)}</td>
    <td>${product.blocking_findings}</td>
    <td>$${product.suggested_price_cents / 100} ${e(product.suggested_payment_type)}</td>
    <td>${e(decision?.decision ?? product.status)}</td>
    <td>${e(product.relative_recommendation ?? "")}</td>
  </tr>`;
}

function productCard(product: BatchProduct, state: BatchDashboardState): string {
  const decision = state.decisions[product.candidate_id];
  const existing = product.status === EXISTING_COMPLETED_PRODUCT;
  return `
  <article class="card" id="card-${e(product.candidate_id)}" data-card="${e(product.candidate_id)}">
    <div class="card-head">
      <div class="title">
        <h3>${e(product.name)}</h3>
        <p class="persona">${e(product.persona)}</p>
        <div class="chips">${pill(product.business_area, "slate")}${pill(product.positioning, "green")}${existing ? pill("EXISTING_COMPLETED_PRODUCT", "slate") : pill(product.status, "green")}${product.relative_recommendation ? pill(product.relative_recommendation, product.relative_recommendation === "DROP" ? "red" : "amber") : ""}</div>
      </div>
    </div>
    <div class="card-body">
      <div class="section"><h4>Problem</h4><p>${e(product.problem)}</p></div>
      <div class="section"><h4>What it does</h4><p>${e(product.workflow)}</p></div>
      <div class="section"><h4>Free vs Premium</h4><p>Premium one-time Blueprint. Suggested $${product.suggested_price_cents / 100} ${e(product.suggested_payment_type)}.</p></div>
      <div class="section"><h4>Commercial rationale</h4><p>${e(product.commercial_rationale)}</p></div>
      <div class="section"><h4>Gates</h4><p>Build ${e(product.build)} · QA ${e(product.qa.status)} ${product.qa.passed} passed / ${product.qa.failed} failed · Auth QA ${e(product.authenticated_qa)} · Evaluator ${product.evaluator_score ?? "n/a"} ${e(product.evaluator_decision ?? "")} · Blocking ${product.blocking_findings} · Non-blocking ${product.non_blocking_findings}</p></div>
      <div class="section"><h4>Preview</h4><p>${product.preview_route ? `<code>${e(product.preview_route)}</code>` : "n/a"}</p></div>
    </div>
    <div class="decide">
      ${
        existing
          ? `<p class="muted">Already provisioned in US Sandbox at $${product.suggested_price_cents / 100}. Submit will reuse this product and will not create a second Stripe product.</p>`
          : `<fieldset class="prices">
        <legend class="xs muted">Approved amount</legend>
        ${[29, 49, 79, 99].map((dollars) => `<label><input type="radio" name="price-${e(product.candidate_id)}" value="${dollars}" ${dollars * 100 === product.suggested_price_cents ? "checked" : ""}> $${dollars}</label>`).join("")}
        <label><input type="radio" name="price-${e(product.candidate_id)}" value="custom"> Custom</label>
        <input id="custom-${e(product.candidate_id)}" inputmode="numeric" placeholder="Whole dollars" maxlength="3">
      </fieldset>`
      }
      <label class="xs muted" for="note-${e(product.candidate_id)}">Note</label>
      <textarea id="note-${e(product.candidate_id)}" rows="2">${e(decision?.note ?? "")}</textarea>
      <div class="buttons">
        <button class="btn approve" data-batch-decision="APPROVE" data-candidate="${e(product.candidate_id)}"${existing ? " disabled" : ""}>Approve</button>
        <button class="btn hold" data-batch-decision="REQUEST_CHANGES" data-candidate="${e(product.candidate_id)}">Request changes</button>
        <button class="btn reject" data-batch-decision="REJECT" data-candidate="${e(product.candidate_id)}">Reject</button>
      </div>
      <div class="decision-line">Decision: <span class="status" data-status-for="${e(product.candidate_id)}">${e(decision?.decision ?? "Waiting")}</span></div>
    </div>
  </article>`;
}

function batchScript(config: { token: string; state: BatchDashboardState; names: Record<string, string> }): string {
  return `
const CONFIG = ${JSON.stringify(config).replace(/</g, "\\u003c")};
const LIVE = location.protocol === 'http:' || location.protocol === 'https:';
if (!LIVE) document.getElementById('file-mode').classList.remove('hidden');
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-atlas-token': CONFIG.token }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || ('Request failed: ' + res.status));
  return data;
}
function apply(state) {
  for (const el of document.querySelectorAll('[data-status-for]')) {
    const id = el.getAttribute('data-status-for');
    const d = state.decisions[id];
    if (d) { el.textContent = d.decision; el.className = 'status s-' + d.decision; }
  }
  const off = state.locked || !LIVE;
  for (const b of document.querySelectorAll('[data-batch-decision],[data-batch-submit]')) b.disabled = off || (b.getAttribute('data-batch-decision') === 'APPROVE' && b.hasAttribute('disabled'));
  if (state.message) { const m = document.getElementById('state-message'); m.textContent = state.message; m.classList.remove('hidden'); }
}
function toast(text, bad) {
  const t = document.getElementById('toast');
  t.textContent = text; t.className = 'toast' + (bad ? ' bad' : '');
  clearTimeout(window.__t); window.__t = setTimeout(() => t.classList.add('hidden'), 3500);
}
for (const btn of document.querySelectorAll('[data-batch-decision]')) {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-candidate');
    const decision = btn.getAttribute('data-batch-decision');
    const choice = document.querySelector('input[name="price-' + id + '"]:checked');
    const custom = (document.getElementById('custom-' + id) || {}).value || '';
    const note = (document.getElementById('note-' + id) || {}).value || '';
    try { apply(await post('/api/batch-decision', { candidate_id: id, decision, note, price_choice: choice && choice.value, custom_dollars: custom })); toast(decision + ' recorded for ' + CONFIG.names[id]); }
    catch (err) { toast(err.message, true); }
  });
}
const submit = document.querySelector('[data-batch-submit]');
if (submit) submit.addEventListener('click', async () => {
  if (!confirm('Submit batch decisions? Stripe Sandbox is contacted only for newly approved products. Existing completed products are reused.')) return;
  try { apply(await post('/api/batch-submit', {})); toast('Batch decisions submitted.'); }
  catch (err) { toast(err.message, true); }
});
apply(CONFIG.state);
if (LIVE) setInterval(async () => { try { const r = await fetch('/api/state'); if (r.ok) apply(await r.json()); } catch {} }, 4000);
`;
}

function compareRow(label: string, ids: string[], products: BatchProduct[]): string {
  return `<p>${e(label)}: <strong>${ids.length === 0 ? "n/a" : ids.map((id) => nameOf(id, products)).join(", ")}</strong></p>`;
}

function nameOf(id: string, products: BatchProduct[]): string {
  return products.find((item) => item.candidate_id === id)?.name ?? id;
}

function num(value: number | null): string {
  return `<td>${value == null ? "n/a" : value.toFixed(1)}</td>`;
}

function pill(text: string, tone: string): string {
  return `<span class="pill tone-${tone}">${e(text)}</span>`;
}
