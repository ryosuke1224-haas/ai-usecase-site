import fs from "node:fs";
import path from "node:path";

type Json = Record<string, unknown>;

function readJson(relativePath: string): Json {
  const fullPath = path.join(process.cwd(), relativePath);
  const parsed: unknown = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${relativePath} is not a JSON object`);
  }
  return parsed as Json;
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function record(value: unknown, label: string): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return value as Json;
}

function list(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} is not an array`);
  return value;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} is not a string`);
  return value;
}

function same(issues: string[], label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    issues.push(
      `${label}: spec has ${JSON.stringify(expected)} but source has ${JSON.stringify(actual)}`,
    );
  }
}

/**
 * Confirms the Daily Inbox spec still describes the current implementation.
 * Returns human-readable mismatches. Throws only when a source file cannot be read.
 */
export function checkDailyInboxSpec(): string[] {
  const issues: string[] = [];
  const spec = readJson("agent-specs/daily-inbox-briefing.json");
  const published = readJson(
    "content/published/use-cases/ai-daily-inbox-briefing.json",
  );
  const source = record(spec.source, "spec.source");
  const identity = record(spec.identity, "spec.identity");
  const audience = record(spec.audience, "spec.audience");
  const experience = record(published.experience, "published.experience");
  const guided = record(experience.guidedDemos, "published.experience.guidedDemos");
  const supademo = record(spec.supademo, "spec.supademo");
  const publicExperience = record(spec.publicExperience, "spec.publicExperience");
  const routes = record(spec.routes, "spec.routes");
  const starterKit = record(spec.starterKit, "spec.starterKit");
  const tier = record(spec.tier, "spec.tier");
  const auth = record(spec.auth, "spec.auth");
  const publishedOnly = record(spec.publishedRecordOnly, "spec.publishedRecordOnly");

  same(issues, "slug", published.slug, source.slug);
  same(issues, "id", published.id, source.useCaseId);
  same(issues, "templateVersion", published.templateVersion, source.templateVersion);
  same(issues, "status", published.status, source.status);
  same(issues, "category", published.category, source.category);
  same(issues, "businessArea", published.businessArea, source.businessArea);
  same(
    issues,
    "primaryBusinessProcess",
    published.primaryBusinessProcess,
    source.primaryBusinessProcess,
  );
  same(issues, "title", published.title, identity.title);
  same(issues, "summary", published.summary, identity.summary);
  same(issues, "difficulty", published.difficulty, identity.difficulty);
  same(issues, "automationLevel", published.automationLevel, identity.automationLevel);
  same(issues, "accessTier", published.accessTier, identity.accessTier);
  same(issues, "whoItsFor", published.whoItsFor, audience.whoItsFor);
  same(issues, "industries", published.industries, audience.industries);
  same(issues, "businessFunctions", published.businessFunctions, audience.businessFunctions);
  same(
    issues,
    "requiredDataSources",
    published.requiredDataSources,
    publishedOnly.requiredDataSources,
  );
  same(issues, "requiredApis", published.requiredApis, publishedOnly.requiredApis);
  same(issues, "noCodeTools", published.noCodeTools, publishedOnly.noCodeTools);
  same(issues, "lowCodeTools", published.lowCodeTools, publishedOnly.lowCodeTools);
  same(
    issues,
    "customBuildStack",
    published.customBuildStack,
    publishedOnly.customBuildStack,
  );

  same(issues, "guided heading", guided.heading, supademo.heading);
  same(issues, "default tool", guided.defaultTool, supademo.defaultTool);

  const publishedTools = list(guided.tools, "guidedDemos.tools").map((tool) => {
    const item = record(tool, "guided tool");
    return {
      key: item.key,
      label: item.label,
      availabilityNote: item.availabilityNote,
      embedUrl: item.embedUrl,
    };
  });
  const specTools = list(supademo.tools, "spec.supademo.tools").map((tool) => {
    const item = record(tool, "spec tool");
    const label = text(item.label, "spec tool label");
    const iframeTitle = text(item.iframeTitle, "spec tool iframeTitle");
    const expectedTitle = `${label} guided walkthrough for AI Daily Inbox Briefing`;
    if (iframeTitle !== expectedTitle) {
      issues.push(
        `iframe title for ${label}: spec has ${JSON.stringify(iframeTitle)} but the page uses ${JSON.stringify(expectedTitle)}`,
      );
    }
    return {
      key: item.key,
      label: item.label,
      availabilityNote: item.availabilityNote,
      embedUrl: item.embedUrl,
    };
  });
  same(issues, "supademo tools", publishedTools, specTools);

  const hero = record(experience.hero, "hero");
  same(issues, "noSignupNote", hero.noSignupNote, publicExperience.noSignupNote);
  const responsibilities = record(experience.responsibilities, "responsibilities");
  same(
    issues,
    "responsibilities heading",
    responsibilities.heading,
    publicExperience.responsibilitiesHeading,
  );
  const safety = record(experience.safety, "safety");
  same(issues, "safety heading", safety.heading, publicExperience.safetyHeading);
  const offers = record(experience.offers, "offers");
  same(issues, "offers heading", offers.heading, publicExperience.offersHeading);
  const footnote = text(offers.footnote, "offers.footnote");
  const footnoteNeedle = text(
    publicExperience.offersFootnoteIncludes,
    "offersFootnoteIncludes",
  );
  if (!footnote.includes(footnoteNeedle)) {
    issues.push("offers footnote no longer includes the spec phrase");
  }
  const starterCta = record(experience.starterCta, "starterCta");
  same(issues, "starter CTA heading", starterCta.heading, publicExperience.starterCtaHeading);
  same(issues, "starter CTA label", starterCta.ctaLabel, publicExperience.starterCtaLabel);

  const questions = list(experience.faq, "faq").map((item) =>
    text(record(item, "faq item").question, "faq question"),
  );
  same(issues, "faq questions", questions, publicExperience.faqQuestions);

  const appOffer = list(offers.items, "offers.items")
    .map((item) => record(item, "offer"))
    .find((item) => item.key === "app");
  const appTier = record(tier.automatedApp, "tier.automatedApp");
  if (!appOffer) {
    issues.push("published offers are missing the app item");
  } else {
    same(issues, "app price", appOffer.price, appTier.priceLabel);
    same(issues, "app badge", appOffer.badge, appTier.badge);
  }

  const catalog = readText("src/lib/starter-kit/catalog.ts");
  const prompts = readText("src/lib/starter-kit/prompts.ts");
  const checklist = readText("components/starter-kit/review-checklist.tsx");
  const authPage = readText("app/auth/page.tsx");
  const blueprints = readText("src/lib/blueprints.ts");
  const resources = list(starterKit.resources, "starterKit.resources");
  const starterPath = text(routes.starterKit, "routes.starterKit");

  if (resources.length !== starterKit.resourceCount) {
    issues.push("starterKit.resourceCount does not match the resource list");
  }
  if (!blueprints.includes(starterPath)) {
    issues.push("blueprints.ts no longer contains the Starter Kit path");
  }
  if (!blueprints.includes(text(routes.myBlueprints, "routes.myBlueprints"))) {
    issues.push("blueprints.ts no longer contains the My Blueprints path");
  }
  if (!authPage.includes(text(auth.starterKitHeading, "auth.starterKitHeading"))) {
    issues.push("auth page no longer contains the Starter Kit heading");
  }
  if (!authPage.includes(text(auth.genericHeading, "auth.genericHeading"))) {
    issues.push("auth page no longer contains the generic sign-in heading");
  }

  for (const resource of resources) {
    const item = record(resource, "resource");
    const slug = text(item.slug, "resource slug");
    const title = text(item.title, "resource title");
    if (!catalog.includes(`slug: "${slug}"`) || !catalog.includes(`title: "${title}"`)) {
      issues.push(`catalog.ts is missing Starter Kit resource ${slug}`);
    }
  }

  for (const phrase of list(starterKit.initialPromptMustInclude, "initial prompt phrases")) {
    if (!prompts.includes(text(phrase, "initial prompt phrase"))) {
      issues.push(`initial prompt is missing ${JSON.stringify(phrase)}`);
    }
  }
  for (const phrase of list(
    starterKit.priorityRulesPromptMustInclude,
    "priority prompt phrases",
  )) {
    if (!prompts.includes(text(phrase, "priority prompt phrase"))) {
      issues.push(`priority rules prompt is missing ${JSON.stringify(phrase)}`);
    }
  }

  const worksheet = record(starterKit.priorityWorksheet, "priorityWorksheet");
  for (const heading of list(worksheet.omittedHeadingsWhenEmpty, "worksheet headings")) {
    const bare = text(heading, "worksheet heading").replace(/^### /, "");
    if (!prompts.includes(bare)) {
      issues.push(`worksheet headings are missing ${JSON.stringify(bare)}`);
    }
  }

  const review = record(starterKit.reviewChecklist, "reviewChecklist");
  for (const item of list(review.items, "checklist items")) {
    if (!checklist.includes(text(item, "checklist item"))) {
      issues.push(`review checklist is missing ${JSON.stringify(item)}`);
    }
  }

  return issues;
}

const entry = process.argv[1]?.replaceAll("\\", "/") ?? "";
if (entry.endsWith("scripts/check-daily-inbox-spec.ts")) {
  const issues = checkDailyInboxSpec();
  if (issues.length > 0) {
    for (const issue of issues) console.error(issue);
    process.exit(1);
  }
  console.log("Daily Inbox spec matches the current source.");
}
