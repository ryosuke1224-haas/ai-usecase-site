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

## Deploy on Vercel

Standard Next.js deployment. Ensure `npm run build` (which runs validation) passes in CI.
