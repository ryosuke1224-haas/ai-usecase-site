export type ExpenseSectionId =
  | "setup-checklist"
  | "ledger-prompt"
  | "increase-review-prompt"
  | "rules-worksheet"
  | "ledger-template"
  | "action-review-checklist"
  | "sample-exports"
  | "safety-guidance";

export type ExpenseSection = {
  id: ExpenseSectionId;
  title: string;
  intro: string;
};

export type ExpenseDemo = {
  step1Lead: string;
  fieldMap: string;
  exportRangeLabel: string;
  asOfLabel: string;
  keepListLabel: string;
  overlapLabel: string;
  minimumLabel: string;
  exportHeading: string;
  exportTableLabel: string;
  step2Lead: string;
  resultsLabel: string;
  recurringSuffix: string;
  skippedLine: string;
  notRecurringHeading: string;
  notRecurringLine: string;
  step3Lead: string;
  ledgerTableLabel: string;
  confirmedChange: string;
  interpretation: string;
  recommended: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  noNewExport: string;
  stillKeep: string;
  needsCheck: string;
  rerun: string;
  step6Title: string;
  doNotCancel: string;
  boundaries: readonly string[];
  kitLink: string;
};

export type ExpenseReviewRulesInput = {
  vendors: string[];
  categories: string[];
  amount: string;
};

export type ExpenseCopy = {
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

export type JapaneseExpenseCopy = ExpenseCopy & {
  demo: ExpenseDemo;
  sections: readonly ExpenseSection[];
  setupSteps: readonly string[];
  ledgerPrompt: string;
  ledgerPromptIntro: string;
  increasePrompt: string;
  increasePromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  vendorsLabel: string;
  overlapWatchLabel: string;
  minimumAmountLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  minimumAmountError: string;
  reviewRules: (input: ExpenseReviewRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  ledgerIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
};
