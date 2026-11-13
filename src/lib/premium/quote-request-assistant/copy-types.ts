export type QuoteSectionId =
  | "setup-checklist"
  | "extraction-prompt"
  | "fit-review-prompt"
  | "rules-worksheet"
  | "tracker-template"
  | "action-review-checklist"
  | "sample-request"
  | "safety-guidance";

export type QuoteSection = {
  id: QuoteSectionId;
  title: string;
  intro: string;
};

export type QuoteDemo = {
  step1Lead: string;
  requesterLabel: string;
  receivedLabel: string;
  requestHeading: string;
  rulesHeading: string;
  rulesTableLabel: string;
  step2Lead: string;
  confirmedLine: string;
  interpretation: string;
  recommended: string;
  step3Lead: string;
  fitReasons: string;
  fitNoExample: string;
  needsCheckExample: string;
  step4Lead: string;
  factConfirmed: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  questionsHeading: string;
  questions: readonly string[];
  draftHeading: string;
  draftText: string;
  doNotSend: string;
  step6Title: string;
  step6Body: string;
  trackerLabel: string;
  step6Boundary: string;
  kitLink: string;
};

export type QuoteRulesInput = {
  serviceArea: string;
  minimumSize: string;
  servicesOffered: string;
  outOfScope: string[];
  neverInDraft: string;
};

export type QuoteCopy = {
  publicEyebrow: string;
  publicTitle: string;
  publicBody: string;
  labelsTitle: string;
  confirmedHelp: string;
  needsCheckHelp: string;
  interpretationHelp: string;
  recommendedHelp: string;
  fictionalNotice: string;
  demoAria: string;
  stepLabel: (step: number, total: number) => string;
  previousStep: string;
  nextStep: string;
  stepTitles: readonly string[];
  kitEyebrow: string;
  kitTitle: string;
  kitBody: string;
  planDifferenceNotice: string;
  sessionOnlyNotice: string;
  kitNavLabel: string;
  inThisKit: string;
  backToDemo: string;
  lockedEyebrow: string;
  lockedTitle: string;
  lockedBody: string;
};

export type JapaneseQuoteCopy = QuoteCopy & {
  demo: QuoteDemo;
  sections: readonly QuoteSection[];
  setupSteps: readonly string[];
  extractionPrompt: string;
  extractionPromptIntro: string;
  fitPrompt: string;
  fitPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  copyText: string;
  serviceAreaLabel: string;
  minimumSizeLabel: string;
  servicesOfferedLabel: string;
  outOfScopeLabel: string;
  neverInDraftLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  serviceAreaError: string;
  minimumSizeError: string;
  reviewRules: (input: QuoteRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  trackerIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
};
