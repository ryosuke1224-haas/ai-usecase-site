# Atlas Agent System v0

This folder defines the first three Atlas agents and the shared rules they follow. v0 uses the Daily Inbox Briefing as the reference use case. The orchestrator can validate, build, and browser-test that use case. It does not change code, publish, or merge.

## What each agent does

**Builder** (`builder.md`) edits Atlas content and code from a use-case spec. It keeps unrelated behavior working, follows `standards.md`, and runs validation after a change. It does not publish or merge to `main`.

**QA** (`qa.md`) assumes the Builder may be wrong. It checks the running app: public pages, the sign-in boundary, interactions, phone-sized layout, and console errors. It writes a pass/fail report. It does not edit the application while it is testing.

**Evaluator** (`evaluator.md`) scores whether the use case is clear, accurate, and useful for a small business. It does not re-check implementation. QA already did that. Its output shape is `evaluator-output.schema.json`. v0 does not run the Evaluator automatically.

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

## What v0 does not do

The runner does not modify application code after a failure. There is no automatic publish step and no merge to `main`.

## Later: Builder → QA → Evaluator

When the browser checks are stable, the intended loop is:

1. Builder reads `agent-specs/daily-inbox-briefing.json` and `agents/standards.md`, then edits a working copy.
2. QA runs `npm run qa` and writes a report. Failures are blocking. Missing session coverage stays a human action, not a silent pass.
3. A person, or a later Builder pass, fixes blocking failures. QA re-runs. The Builder still does not merge or deploy.
4. Evaluator reads the spec and the QA report and returns the JSON in `evaluator-output.schema.json`. A QA failure cannot be scored away.
5. A person decides whether to publish. Nothing in this loop publishes by itself.
