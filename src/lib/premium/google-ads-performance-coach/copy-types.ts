export type AdsSectionId =
  | "setup-checklist"
  | "measurement-review-prompt"
  | "period-review-prompt"
  | "rules-worksheet"
  | "workbook-template"
  | "action-review-checklist"
  | "sample-exports"
  | "safety-guidance";

export type AdsSection = {
  id: AdsSectionId;
  title: string;
  intro: string;
};

export type AdsDemo = {
  step1Lead: string;
  qualifiedOutcomeLabel: string;
  dateRangesLabel: string;
  currentExportHeading: string;
  previousExportHeading: string;
  conversionActionsHeading: string;
  ga4Heading: string;
  currentExportLabel: string;
  previousExportLabel: string;
  conversionActionsLabel: string;
  ga4Label: string;
  step2Lead: string;
  resultsLabel: string;
  springFailedHeading: string;
  springDetail: string;
  springSkipped: string;
  brandPassedHeading: string;
  brandDetail: string;
  step3Lead: string;
  workbookLabel: string;
  confirmedLines: readonly string[];
  interpretation: string;
  recommended: string;
  factConfirmed: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  brandPreviousHeading: string;
  brandPreviousLabel: string;
  costChangeLabel: string;
  conversionChangeLabel: string;
  searchTermsNeedsCheck: string;
  laterInterpretation: string;
  rerun: string;
  step6Title: string;
  doNotChangeBids: string;
  boundaries: readonly string[];
  kitBoundary: string;
  kitLink: string;
};

export type AdsReviewRulesInput = {
  qualifiedOutcome: string;
  pageViewDoesNotCount: boolean;
  addToCartDoesNotCount: boolean;
  outOfScope: string[];
};

export type AdsCopy = {
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

export type JapaneseAdsCopy = AdsCopy & {
  demo: AdsDemo;
  sections: readonly AdsSection[];
  setupSteps: readonly string[];
  measurementPrompt: string;
  measurementPromptIntro: string;
  periodPrompt: string;
  periodPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  qualifiedOutcomeLabel: string;
  eventsDoNotCountLabel: string;
  pageViewCheckbox: string;
  addToCartCheckbox: string;
  outOfScopeLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  qualifiedOutcomeError: string;
  reviewRules: (input: AdsReviewRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  workbookIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
  currentSampleLabel: string;
  previousSampleLabel: string;
  conversionSampleLabel: string;
  ga4SampleLabel: string;
  workbookTemplateLabel: string;
};
