# Atlas Agent System

This folder defines the Atlas agents and the shared rules they follow. The reference use case is Daily Inbox Briefing. The QA runner validates, builds, and browser-tests that use case. The v1 loop can ask the Builder to change a working copy, then run QA again. Nothing in this folder publishes, deploys, or merges.

## What each agent does

**Builder** (`builder.md`) edits Atlas content and code from a use-case spec. It keeps unrelated behavior working, follows `standards.md`, and runs validation after a change. It does not publish or merge to `main`.

**QA** (`qa.md`) assumes the Builder may be wrong. It checks the running app: public pages, the sign-in boundary, interactions, phone-sized layout, and console errors. It writes a pass/fail report. It does not edit the application while it is testing.

**Evaluator** (`evaluator.md`) scores whether the use case is clear, accurate, and useful for a small business. It does not re-check implementation. QA already did that. Its output shape is `evaluator-output.schema.json`. The loop calls it only after QA passes, and only when `ATLAS_EVALUATOR_COMMAND` is set. Until then the hook records that scoring did not run.

Shared product rules live in `standards.md`.

## What each agent may access

| Agent | May read | May write | Must not |
| --- | --- | --- | --- |
| Builder | Repo, specs, standards, QA reports | App code and content on a working copy | Publish, deploy, merge to `main`, commit secrets |
| QA | Built app, specs, tests | `agent-reports/` and `test-results/` | Application source, content, or secrets inside the report |
| Evaluator | Spec, published content, QA report | An evaluation file only when someone asks | Code changes, publishing, overriding a QA failure |

The local QA script is not one of these agents. It only runs the checks below.

## How to run Atlas QA

Install dependencies once, then install the Chromium browser Playwright drives:

```bash
npm install
npx playwright install chromium
```

Run the full local check:

```bash
npm run qa
```

That command:

1. Validates published content, then checks the Daily Inbox Briefing spec against the current source.
2. Runs the existing production build (`npm run build`).
3. Starts the built app on `http://localhost:3100` with `SITE_MODE=live` for that process only.
4. Runs the Playwright tests.
5. Writes `agent-reports/<timestamp>-daily-inbox-briefing.json`.

`status: "pass"` means every test that actually ran passed. Signed-in tests are skipped until you provide a session, and the report lists that under `human_action_required`.

Browser coverage uses Chromium. The mobile project is a phone-sized viewport (Pixel 5), not a physical device.

To run the browser tests alone, build first, then:

```bash
npm run test:e2e
```

## Where secrets and test credentials live

Do not put tokens, passwords, API keys, magic links, or email addresses in committed files.

| Secret | Where it lives |
| --- | --- |
| Supabase URL and publishable key | `.env.local` (already gitignored) |
| Signed-in browser session for QA | `agent-secrets/playwright-storage-state.json`, or the file path in `ATLAS_QA_STORAGE_STATE` |

Both `agent-secrets/` and `agent-reports/` are gitignored. QA reports and traces can contain whatever was on the screen, including an account label, so do not commit or paste them into chat.

Create a session only on your machine:

1. Start the app with `npm run dev`.
2. Run `npm run qa:save-session`.
3. In the browser window that opens, request a magic link, then paste that link into the **same** window. Pasting it into a different browser stores the session in the wrong place.
4. Stop when the script prints `Saved storage state to:` followed by the session file path.

Use `http://localhost` for both the sign-in window and the QA server. Cookies are tied to the host name, so a session saved on `127.0.0.1` is not sent to `localhost`. The script never asks for a password and does not print the magic link.

Override the app URL or output path if needed:

```bash
ATLAS_QA_APP_URL=http://localhost:3000 ATLAS_QA_STORAGE_STATE=agent-secrets/playwright-storage-state.json npm run qa:save-session
```

## Create a task

Add a JSON file under `agent-tasks/`. The shape is `agents/task.schema.json`.

```json
{
  "schema_version": "atlas-agent-task-v1",
  "id": "v1-loop-dry-run",
  "title": "Record that the v1 agent loop can run",
  "objective": "Add a documentation note. Do not change Atlas product behavior.",
  "target_use_case": "daily-inbox-briefing",
  "scope": ["agents/v1-loop-dry-run.md"],
  "acceptance_criteria": [
    "The note exists and does not change product behavior."
  ],
  "forbidden_changes": ["app/", "components/", "content/", "e2e/"],
  "permits_qa_changes": false,
  "requires_authenticated_qa": true,
  "max_iterations": 3
}
```

`scope` is the only set of files the Builder may keep. `max_iterations` cannot be higher than 3. `permits_qa_changes` defaults to false.

## Run the agent loop

```bash
npm run agent:run -- agent-tasks/v1-loop-dry-run.json
```

The loop runs only on the `private-preview` branch. It then:

1. Validates the task file.
2. Invokes the Builder with `agents/builder.md`, the task, and nothing else from an earlier chat.
3. Runs content validation.
4. Runs the production build.
5. Runs `npm run qa`, which reuses `agent-secrets/playwright-storage-state.json` when that file is already present. It does not request a Magic Link.
6. Reads the QA report.
7. Stops with `READY_FOR_HUMAN_REVIEW` when QA passes.
8. On failure, sends only the structured failures back to the Builder with: fix only the failing behavior, and preserve all passing functionality.
9. Repeats from the Builder step until QA passes or 3 iterations are used.
10. Stops with `HUMAN_REVIEW_REQUIRED` when the third iteration still fails, when a test may be wrong, or when the Builder leaves the task scope.

The result is written under `agent-reports/loops/`. That directory is gitignored. The loop does not commit or push.

## How the Builder is invoked

The orchestrator checks, in order:

1. `ATLAS_BUILDER_COMMAND`, if you set it. The command receives `ATLAS_BUILDER_REQUEST`, `ATLAS_BUILDER_REPORT`, and `ATLAS_BUILDER_PROMPT`. It must write a builder report and must not commit.
2. The Cursor Agent CLI, when `agent` is on your PATH. Each iteration starts a new non-interactive process: `agent -p --force --trust --output-format text --workspace <repo>`. The prompt is `agents/builder.md`, the task JSON, and the current failure packet. The command does not pass `--continue` or `--resume`, so earlier chats are not sent. On Windows the `agent` entry point is a PowerShell script, and the orchestrator launches that script with the same arguments.
3. A documentation fallback, only when no external Builder is available and every scoped path is a markdown file under `agents/` or `agent-tasks/`. It can add that note. It cannot change product code.

Any other task stops for a person until a Builder command is configured.

The Builder writes `agents/builder-report.schema.json`. That report cannot say QA passed.

## How QA failures go back

Each failure handed to the next iteration matches `agents/qa-failure.schema.json`:

- `issue_id`
- `test`
- `severity`
- `expected`
- `actual`
- `evidence` (screenshot and trace paths only)
- `relevant_files` when the error names repo files

The next prompt does not include the previous conversation.

## Iteration limit

`max_iterations` is 1, 2, or 3. The task schema rejects a larger number. A passing QA run stops immediately, even on iteration 1. After the third failure the loop stops with `HUMAN_REVIEW_REQUIRED` and does not start a fourth Builder pass.

## Test protection

Unless `permits_qa_changes` is true, the loop restores edits to Playwright tests, the QA runner, the session helper, and `agents/qa.md`. It always restores edits to the task file, package scripts, standards, and the loop itself, so a Builder cannot change its own acceptance criteria or turn QA off.

Skipping a test or removing an `expect` is restored and recorded as `TEST_PROTECTION_VIOLATION`.

If the Builder believes a test is wrong, it must say so in `possible_test_defects` and leave the test file alone. The loop classifies that as `POSSIBLE_TEST_DEFECT` and stops for a person. It does not accept a silent test edit.

## Secrets and the saved session

The loop reads the existing Playwright storage state to decide whether signed-in QA can run. It does not print the file, copy it into a report, or call `npm run qa:save-session`. If the task requires authenticated QA and the session file is missing, the loop stops. It does not ask for a new Magic Link.

Do not put tokens, passwords, API keys, magic links, or email addresses in a task file.

## Human approval

A finished loop prints one of:

- `READY_FOR_HUMAN_REVIEW` when QA passed
- `HUMAN_REVIEW_REQUIRED` when it stopped for a person

The report includes the task, iterations used, files the loop kept, the QA counts, unresolved issues, the Evaluator hook result, and a diff summary of those kept files. `committed` is always false. A person decides whether anything is committed, merged, or published.

## Evaluator

When deterministic QA passes, the loop starts a second Cursor Agent process for the Evaluator. It uses `agent -p --mode ask --trust --output-format text` so the process is read-only. The command does not include `--continue`, `--resume`, or `--force`, and it does not receive the Builder chat.

The Evaluator reads `agents/evaluator.md`, the task, the builder report, the QA result, the task diff, and the files listed in `evaluation_targets`. It prints a report matching `agents/evaluator-report.schema.json`. The orchestrator writes that report to `agent-reports/loops/<run-id>/evaluator-report.json`.

Scores run from 1.0 to 10.0 for clarity, accuracy and grounding, actionability, SMB relevance, AI literacy, safety, setup usability, and the human/AI boundary. The report also classifies setup difficulty, automation potential, and human oversight, and it chooses `PASS`, `PASS_WITH_RECOMMENDATIONS`, or `HUMAN_REVIEW_REQUIRED`.

A QA failure does not start the Evaluator. Findings are not sent back to the Builder. An Evaluator pass still stops at `READY_FOR_HUMAN_REVIEW`. If the Evaluator edits any file, those edits are restored and the loop stops with `EVALUATOR_WRITE_VIOLATION`.

Set `product_changes_required` to false when the task is an evaluation of the current implementation and the Builder must not keep product edits. QA and the Evaluator still run.

## What the loop does not do

It does not publish, deploy, merge to `main`, or commit. `npm run qa` by itself still does not edit the application. Only the loop's Builder step edits a working copy, and only inside the task scope.
