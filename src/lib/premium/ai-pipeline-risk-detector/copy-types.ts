export type PipelineSectionId =
  | "setup-checklist"
  | "stall-queue-prompt"
  | "next-week-prompt"
  | "rules-worksheet"
  | "outcome-log-template"
  | "recovery-review-checklist"
  | "sample-deal-export"
  | "safety-guidance";

export type PipelineSection = {
  id: PipelineSectionId;
  title: string;
  intro: string;
};

export type PipelineDemo = {
  step1Lead: string;
  asOfLabel: string;
  minimumLabel: string;
  stallLimitsLabel: string;
  stallLimitsValue: string;
  exportHeading: string;
  exportTableLabel: string;
  step2Lead: string;
  skipped: readonly string[];
  skippedStatusRules: string;
  step3Lead: string;
  queueHeading: string;
  queueTableLabel: string;
  confirmedNorthgate: string;
  northgateDraft: string;
  confirmedHarbor: string;
  harborDraft: string;
  interpretation: string;
  recommended: string;
  doNotInvent: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  outcomeHeading: string;
  outcomeTableLabel: string;
  nextWeekHeading: string;
  stillQueued: string;
  nextWeekSkipped: readonly string[];
  loggedOnHold: string;
  step6Title: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type StallRulesReviewInput = {
  daysInStageLimit: number;
  daysSinceActivityLimit: number;
  ownerMinimum: number;
  neverChaseStatuses: string[];
  alwaysSkip: string[];
};

export type PipelineCopy = {
  publicEyebrow: string;
  publicTitle: string;
  publicBody: string;
  labelsTitle: string;
  confirmedHelp: string;
  interpretationHelp: string;
  recommendedHelp: string;
  skippedHelp: string;
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

export type JapanesePipelineCopy = PipelineCopy & {
  demo: PipelineDemo;
  sections: readonly PipelineSection[];
  setupSteps: readonly string[];
  stallQueuePrompt: string;
  stallQueuePromptIntro: string;
  nextWeekPrompt: string;
  nextWeekPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  daysInStageLabel: string;
  daysSinceActivityLabel: string;
  minimumAmountLabel: string;
  neverChaseLabel: string;
  alwaysSkipLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  stallLimitError: string;
  minimumAmountError: string;
  reviewRules: (input: StallRulesReviewInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  outcomeLogIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
};
