export type UnbilledSectionId =
  | "setup-checklist"
  | "queue-prompt"
  | "next-week-prompt"
  | "rules-worksheet"
  | "billing-log-template"
  | "outline-review-checklist"
  | "sample-job-export"
  | "safety-guidance";

export type UnbilledSection = {
  id: UnbilledSectionId;
  title: string;
  intro: string;
};

export type UnbilledDemo = {
  step1Lead: string;
  asOfLabel: string;
  minAmountLabel: string;
  jobsHeading: string;
  jobsTableLabel: string;
  step2Lead: string;
  skippedJ91: string;
  skippedJ70: string;
  skippedJ94: string;
  otherSkipRules: string;
  step3Lead: string;
  queueHeading: string;
  queueTableLabel: string;
  confirmedJ88: string;
  outlineText: string;
  doNotAddTax: string;
  needsCheck: string;
  interpretation: string;
  recommended: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  billingLogHeading: string;
  billingLogLabel: string;
  nextWeekHeading: string;
  skippedJ88NextWeek: string;
  loggedInvoiced: string;
  step6Title: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type UnbilledRulesInput = {
  minimumAmount: string;
  neverBilled: string[];
  alwaysSkip: string[];
};

export type UnbilledCopy = {
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

export type JapaneseUnbilledCopy = UnbilledCopy & {
  demo: UnbilledDemo;
  sections: readonly UnbilledSection[];
  setupSteps: readonly string[];
  queuePrompt: string;
  queuePromptIntro: string;
  nextWeekPrompt: string;
  nextWeekPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  minimumAmountLabel: string;
  neverBilledLabel: string;
  alwaysSkipLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  minimumAmountError: string;
  reviewRules: (input: UnbilledRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  billingLogIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  allowedOutcomesLabel: string;
  allowedOutcomes: readonly string[];
  safetyRules: readonly string[];
};
