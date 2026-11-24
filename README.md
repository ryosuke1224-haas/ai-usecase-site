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

Cursor requires an authenticated `agent` CLI on PATH. Codex requires a recent `codex` CLI on PATH with a local ChatGPT login. Both run in a read-only mode from the candidate directory with a five-minute timeout. The adapter captures their response and writes the validated Markdown and metadata into `drafts/`. Writer failure stops the edition without switching providers. A writer rejection stays local as a failed QA decision.

Outside dry run, only QA-passing items can be inserted as `READY_FOR_REVIEW`. Existing queue sources and titles, including rejected ones, are checked for duplicates. Approval and publishing are separate human actions in the admin console.

## Deploy on Vercel

Standard Next.js deployment. Ensure `npm run build` (which runs validation) passes in CI.
