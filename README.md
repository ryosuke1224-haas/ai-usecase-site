# AI Use Case Atlas

A structured SMB AI workflow knowledge base built with [Next.js](https://nextjs.org). Public pages read validated JSON from `content/published/` only.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Validate content before building:

```bash
npm run validate:content
npm run build
```

## Content layout

```
content/
  published/          # Live site content (one JSON file per item)
    use-cases/
    apis/
    data-sources/
    workflow-ideas/
  suggestions/        # Draft LLM output — never rendered by the site
    use-cases/
    apis/
    data-sources/
    workflow-ideas/
  sources/
    sources.json      # Registry of external docs for future research
```

Schemas and validation live in `src/content/schemas.ts` (Zod).

## Content Growth Pipeline

### Published vs suggestions

| Location | Purpose | Rendered on site? |
|----------|---------|-------------------|
| `content/published/` | Reviewed, approved content | Yes |
| `content/suggestions/` | Draft AI-generated JSON awaiting review | **No** |

The Next.js app loads **only** from `content/published/`. Files in `content/suggestions/` are ignored at runtime so draft content cannot leak to production.

### Adding new content manually

1. Create a JSON file matching the Zod schema in `src/content/schemas.ts`.
2. Filename must match the item `slug` (e.g. `my-use-case.json` → `"slug": "my-use-case"`).
3. Run `npm run validate:content`.
4. Commit the file under `content/published/`.

### Reviewing AI-generated drafts

When LLM automation is enabled (not yet active):

1. `npm run research:sources` — checks registered sources in `content/sources/sources.json`.
2. `npm run generate:suggestion` — writes draft JSON to `content/suggestions/` with `_meta.reviewRequired: true`.
3. A human editor reviews the draft for accuracy, SMB relevance, and schema compliance.
4. After approval, move or copy the inner `suggestion` object to `content/published/{type}/{slug}.json`.
5. Run `npm run validate:content` and deploy.

**Never** point the site loader at `content/suggestions/`. **Never** auto-publish from CI without human review.

### Future Claude API automation

`scripts/generate-suggestion.ts` is a placeholder for:

- Loading context from `content/sources/sources.json` and existing published items
- Calling the Claude API with structured-output prompts aligned to Zod schemas
- Writing results to `content/suggestions/` only, with metadata (`generatedAt`, `model`, `sourceIds`)

No API key or live generation is wired yet.

### Future GitHub Actions automation

A planned workflow:

1. Scheduled `research:sources` job detects doc/template changes.
2. `generate:suggestion` job creates draft PRs adding files under `content/suggestions/`.
3. Maintainers review PRs, edit drafts, then move approved JSON to `content/published/`.
4. `validate:content` runs in CI on every PR touching `content/`.

### Why human review is required

AI-generated workflow blueprints can contain incorrect API scopes, outdated tool names, or unsafe automation advice. Publishing without review risks misleading SMB operators. The suggestions layer exists so generation can scale while publication stays deliberate.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run validate:content` | Validate all published JSON and `sources.json` |
| `npm run generate:suggestion` | Placeholder — writes example draft to `content/suggestions/` |
| `npm run research:sources` | Placeholder — lists registered research sources |

## Atlas Weekly writer

On Windows, open the Desktop launcher `Run Atlas Weekly.bat` for a normal weekly run. It changes to the isolated writer checkout and prompts for Codex, Cursor, or no external writer, followed by Normal weekly, Explicit rerun, or Back. It checks PATH for the selected CLI before starting. Normal weekly reuses an already completed edition, and Explicit rerun passes `--rerun` to request a new edition. Back returns to writer selection. The choices apply only to that launcher execution. After the Weekly command returns, the launcher opens the admin project page and pauses so you can read the result.

Run these from the isolated clone in PowerShell. Dry runs use a separate edition key ending in `-dry` (or `-dry-rN` for a rerun). They fetch public research feeds and use local state and QA without contacting Supabase, including for run history. The Cursor and Codex commands each start a fresh dry-run edition.

```powershell
$env:ATLAS_WRITER = 'none'
npm.cmd run atlas:weekly -- --dry-run

$env:ATLAS_WRITER = 'cursor'
npm.cmd run atlas:weekly -- --dry-run --rerun

$env:ATLAS_WRITER = 'codex'
npm.cmd run atlas:weekly -- --dry-run --rerun
```

`none` is the default. It saves research packages and pauses until each candidate has a manual draft or rejection. Write `<id>.md` and `<id>.json` in the edition's `drafts/` directory using the contract in the package's `instructions.md`. Repeat the first command to validate those files. Use `--edition <edition>` with `--dry-run` to resume a specific dry-run edition. Set `ATLAS_WRITER` to the writer you intend to use for any missing drafts. Existing artifacts are reused.

Each package lives at `atlas-memory/weekly/<edition>/research/<id>/`. It contains a research brief, primary and directly relevant supporting evidence, and instructions. Feed and documentation excerpts are attributed to their publishers. Dates and quantitative claims are tied to the supplied evidence.

Cursor requires an authenticated `agent` CLI on PATH. Codex requires a recent `codex` CLI on PATH with a local ChatGPT login. Both run in a read-only mode from the candidate directory with a five-minute timeout. Atlas Weekly reads the three research files and sends their contents to Codex over stdin so its sandbox does not need filesystem tools. The adapter captures each writer’s response and writes the validated Markdown and metadata into `drafts/`. Writer failure stops the edition without switching providers. A writer rejection stays local as a failed QA decision.

The research package separates source evidence from an editorial brief. The brief records the audience, question, direction, and evidence gaps. For newly packaged topics, Atlas asks the writer to point to distinct passages that cover the type-specific depth requirements. The writer chooses the structure. News uses `ai-news`, practical tips and enterprise strategy use `practical-ai`, and field notes use `technical`.

With Codex selected, a separate read-only research call uses ChatGPT-authenticated live web search, with a 90-second deadline per topic. Atlas independently fetches up to three proposed public pages from approved publishers, without redirects, and accepts only directly relevant passages found in the retrieved page. Packages record queries, excerpts, attribution, source roles, and any research limits. Feed-led topics without verified additional evidence are deferred. Curated documentation remains usable for evergreen tips. Cursor and manual writer modes currently have no verified live-search integration.

Atlas discovers Markdown notes with editorial metadata in `atlas-memory/field-notes/`. The writer receives only the curated public evidence and lesson. Pending notes can be previewed in dry runs. Approved, publication-eligible notes can produce sanitized articles for the Review Queue and newsletter after QA. A human still approves publication.

Outside dry run, only QA-passing items can be inserted as `READY_FOR_REVIEW`. Existing queue sources and titles, including rejected ones, are checked for duplicates. Reviewers should check the brief's editorial questions against the full draft, including the originality of the analysis and the strength of its evidence. Approval and publishing are separate human actions in the admin console.

## Deploy on Vercel

Standard Next.js deployment. Ensure `npm run build` (which runs validation) passes in CI.
