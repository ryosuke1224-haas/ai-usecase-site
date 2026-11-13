export type PayrollSectionId =
  | "setup-checklist"
  | "labor-check-prompt"
  | "variance-prompt"
  | "schedule-review-checklist"
  | "rules-worksheet"
  | "workbook-template"
  | "sample-exports"
  | "safety-guidance";

export type PayrollSection = {
  id: PayrollSectionId;
  title: string;
  intro: string;
};

export type PayrollDemo = {
  step1Lead: string;
  payPeriodLabel: string;
  projectedRevenueLabel: string;
  employerLoadLabel: string;
  targetLaborLabel: string;
  overtimeMultiplierLabel: string;
  overtimeFlagRuleLabel: string;
  exportHeading: string;
  exportTableLabel: string;
  step2Lead: string;
  formulasLabel: string;
  stylistConfirmed: string;
  frontDeskConfirmed: string;
  ownerLoadLine: string;
  calculatedBaseLine: string;
  step3Lead: string;
  laborPctLine: string;
  overtimeFlagLine: string;
  labelsHow: string;
  confirmedHelp: string;
  ownerHelp: string;
  calculatedHelp: string;
  interpretationHelp: string;
  recommendedHelp: string;
  step4Lead: string;
  stylistConfirmedLine: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  interpretation: string;
  varianceHeading: string;
  actualPayrollLine: string;
  varianceCalcLine: string;
  recheckSentence: string;
  recommendedAction: string;
  step6Title: string;
  doNotCutCoverage: string;
  boundaries: readonly string[];
  kitLead: string;
  kitLink: string;
};

export type PayrollReviewRulesInput = {
  loadFactor: string;
  targetLabor: string;
  overtimeMultiplier: string;
  overtimeFlagRule: string;
  minimumCoverage: string[];
};

export type PayrollCopy = {
  publicEyebrow: string;
  publicTitle: string;
  publicBody: string;
  labelsTitle: string;
  confirmedHelp: string;
  ownerEnteredHelp: string;
  calculatedHelp: string;
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

export type JapanesePayrollCopy = PayrollCopy & {
  demo: PayrollDemo;
  sections: readonly PayrollSection[];
  setupSteps: readonly string[];
  laborCheckPrompt: string;
  laborCheckPromptIntro: string;
  variancePrompt: string;
  variancePromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  loadFactorLabel: string;
  targetLaborLabel: string;
  overtimeMultiplierLabel: string;
  overtimeFlagRuleLabel: string;
  minimumCoverageLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  loadFactorError: string;
  targetLaborError: string;
  reviewRules: (input: PayrollReviewRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  workbookIntro: string;
  checklistIntro: string;
  workbookTableLabel: string;
  sampleTableLabel: string;
  fictionalBadge: string;
  fieldMap: string;
  safetyRules: readonly string[];
};
