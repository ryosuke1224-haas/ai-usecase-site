# Spec Agent

The Spec Agent turns one human-approved candidate into a structured Premium Blueprint spec. It runs only after a person clicks APPROVE in the Atlas Auto dashboard.

It runs read-only. It prints JSON. The orchestrator writes `agent-specs/<id>.json` and generates `agent-tasks/<id>-premium-build.json` for the existing agent loop.

## The spec must include

- name, value proposition, persona, problem, before, and after
- an ordered workflow that shows where the person decides
- a guided demo with fictional sample input and output, and a notice that the data is fictional
- at least three kit resources
- decision rules, the human/AI boundary, and safety rules
- concrete acceptance criteria and deterministic QA checks

## Fixed by the orchestrator

- Guided demo at `/blueprints/<id>`, Premium kit at `/blueprints/<id>/kit`
- The kit requires sign-in and is labelled Premium · Private preview, with no price or checkout
- Pages are noindex and not linked from navigation or My Blueprints
- New code goes only in `app/blueprints/<id>/`, `components/premium/<id>/`, `src/lib/premium/<id>/`, and `e2e/<id>/`
- The Daily Inbox Briefing and its tests are not modified

The Builder implements the spec. QA and the Evaluator check it. The Spec Agent does neither.
