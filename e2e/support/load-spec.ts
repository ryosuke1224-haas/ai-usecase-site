import { loadProductSpec } from "./product-spec";

export type DemoTool = {
  key: "chatgpt" | "claude" | "gemini";
  label: string;
  availabilityNote: string;
  embedUrl: string;
  iframeTitle: string;
};

export type StarterResource = {
  slug: string;
  title: string;
  kind: string;
};

export type DailyInboxSpec = {
  id: string;
  source: { slug: string; contentFile: string };
  identity: { title: string };
  routes: {
    publicUseCase: string;
    starterKit: string;
    myBlueprints: string;
    auth: string;
  };
  publicExperience: {
    noSignupNote: string;
    previewBadge: string;
    starterCtaHeading: string;
    starterCtaLabel: string;
    freeAccountRequired: string;
    responsibilitiesHeading: string;
    safetyHeading: string;
    offersHeading: string;
    offersFootnoteIncludes: string;
    faqHeading: string;
    faqSample: { question: string; answerIncludes: string };
  };
  supademo: {
    sectionId: string;
    heading: string;
    defaultTool: string;
    tools: DemoTool[];
  };
  starterKit: {
    title: string;
    readyLabel: string;
    resourceCount: number;
    resources: StarterResource[];
    copyPrompt: { label: string; copiedLabel: string };
    initialPromptMustInclude: string[];
    priorityRulesPromptMustInclude: string[];
    priorityWorksheet: {
      generateButton: string;
      emptyError: string;
      generatedHeading: string;
      filledExample: { label: string; value: string; headingInPrompt: string };
      whitespaceOnly: { label: string; value: string };
      omittedHeadingsWhenEmpty: string[];
      retainedSafetyLines: string[];
    };
    reviewChecklist: {
      resetLabel: string;
      items: string[];
    };
  };
  tier: {
    starterKit: { badge: string };
    automatedApp: { priceLabel: string; badge: string };
  };
  auth: {
    starterKitHeading: string;
    genericHeading: string;
    signedOutSignInDestination: string;
  };
};

export function loadUseCaseSpec(): DailyInboxSpec {
  return loadProductSpec<DailyInboxSpec>("daily-inbox-briefing");
}

export function resourcePath(spec: DailyInboxSpec, slug: string): string {
  return `${spec.routes.starterKit}/${slug}`;
}
