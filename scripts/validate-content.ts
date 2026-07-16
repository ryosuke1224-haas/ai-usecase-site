import {
  assertValidPublishedContent,
  validatePublishedContent,
  validateSourceRegistry,
} from "../src/content/validate";

function main() {
  console.log("Validating published content...\n");

  const published = validatePublishedContent();
  const registry = validateSourceRegistry();

  const counts = {
    useCases: published.useCases.data.length,
    apis: published.apis.data.length,
    dataSources: published.dataSources.data.length,
    workflowIdeas: published.workflowIdeas.data.length,
    sources: registry.sources.length,
  };

  console.log("Published counts:");
  console.log(`  use-cases:      ${counts.useCases}`);
  console.log(`  apis:           ${counts.apis}`);
  console.log(`  data-sources:   ${counts.dataSources}`);
  console.log(`  workflow-ideas: ${counts.workflowIdeas}`);
  console.log(`  source registry: ${counts.sources}\n`);

  const issues = [...published.allIssues, ...registry.issues];

  if (issues.length > 0) {
    console.error("Validation failed:\n");
    for (const issue of issues) {
      console.error(`  ${issue.file}`);
      console.error(`    ${issue.message}\n`);
    }
    process.exit(1);
  }

  try {
    assertValidPublishedContent();
    console.log("All published content passed schema validation.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
