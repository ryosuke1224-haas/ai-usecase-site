/**
 * Placeholder: future source crawling / research pipeline.
 *
 * Planned flow:
 * 1. Load content/sources/sources.json
 * 2. Fetch each source URL on schedule (checkFrequency)
 * 3. Extract relevant updates (API changes, new templates, workflow ideas)
 * 4. Queue items for scripts/generate-suggestion.ts
 * 5. Never write directly to content/published/
 */

import fs from "fs";
import { SOURCES_REGISTRY_PATH } from "../src/content/paths";
import { validateSourceRegistry } from "../src/content/validate";

function main() {
  console.log("Research sources placeholder\n");

  if (!fs.existsSync(SOURCES_REGISTRY_PATH)) {
    console.error(`Source registry not found: ${SOURCES_REGISTRY_PATH}`);
    process.exit(1);
  }

  const { sources, issues } = validateSourceRegistry();
  if (issues.length > 0) {
    console.error("Source registry validation failed:");
    for (const issue of issues) {
      console.error(`  ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`Loaded ${sources.length} registered sources:\n`);

  for (const source of sources) {
    console.log(`  [${source.priority}] ${source.name}`);
    console.log(`    ${source.url}`);
    console.log(`    focus: ${source.focus}`);
    console.log(`    check: ${source.checkFrequency}`);
    console.log("");
  }

  console.log("Future implementation will:");
  console.log("  - Crawl or RSS-check each source by priority");
  console.log("  - Diff against last snapshot to detect changes");
  console.log("  - Feed changes into generate-suggestion.ts as context");
  console.log("  - Keep all LLM output in content/suggestions/ until reviewed");
}

main();
