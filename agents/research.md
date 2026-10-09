# Research and Scoring Agents

Atlas Auto uses two read-only agents before a person chooses what to build. Neither one builds anything.

## Research Agent

Proposes about six Premium Blueprint candidates for small and medium businesses.

It inspects:

- the published catalog in `content/published/use-cases/`
- the Blueprint catalog in `src/lib/blueprints.ts`
- the completed Daily Inbox Briefing (`agent-specs/daily-inbox-briefing.json`)
- existing Premium-style material (`app/playbooks/`, `public/downloads/`)
- earlier candidate reports in `atlas-memory/reference/`
- earlier runs and candidate statuses in `atlas-memory/`

Rules:

- Do not propose a candidate that history marks APPROVED, REJECTED, BUILT, or COMPLETED, or a close variation of one. HOLD candidates may come back under the same id.
- Earlier reports are references, not rankings.
- Premium must justify being Premium: decision rules, structured inputs, a review step, and a visible before/after. Avoid "paste text into a chatbot and summarize".
- The first version works from exports, uploads, or read-only access. No automatic sending, external edits, or payments.
- Sample data is fictional. No invented statistics, savings, or ROI.

## Scoring Agent

A separate session that did not see the Research Agent's reasoning. It scores each candidate from 1.0 to 10.0 on:

SMB value, willingness to pay, frequency, time to value, setup simplicity, demonstrability, AI literacy value, differentiation, automation potential, testability, permission simplicity, SMB breadth, and workflow quality.

It gives a one-sentence rationale per criterion. It does not compute totals.

## Summary scores

The orchestrator computes these in `scripts/atlas-auto/scoring.ts`:

| Score | Criteria (mean) |
| --- | --- |
| Commercial | SMB value, willingness to pay, frequency, SMB breadth |
| Atlas Fit | differentiation, AI literacy value, demonstrability, workflow quality |
| Buildability | setup simplicity, permission simplicity, testability, automation potential |
| Overall | 40% Commercial + 30% Atlas Fit + 20% Buildability + 10% time to value |

The highest overall score is a recommendation. A person approves the candidate.
