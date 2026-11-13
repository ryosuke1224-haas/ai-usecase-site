export type StaffingSectionId =
  | "setup-checklist"
  | "coverage-check-prompt"
  | "recheck-prompt"
  | "schedule-review-checklist"
  | "rules-worksheet"
  | "workbook-template"
  | "sample-exports"
  | "safety-guidance";

export type StaffingSection = {
  id: StaffingSectionId;
  title: string;
  intro: string;
};

export type StaffingDemo = {
  step1Lead: string;
  rulesCard: string;
  protectedRoleLine: string;
  exportHeading: string;
  exportTableLabel: string;
  step2Lead: string;
  ownerRulesLabel: string;
  minimumLine: string;
  targetLine: string;
  protectedLine: string;
  patternLine: string;
  step3Lead: string;
  flagsLabel: string;
  overstaffedLabel: string;
  understaffedLabel: string;
  tueConfirmed: string;
  satConfirmed: string;
  labelsHow: string;
  confirmedHelp: string;
  ownerHelp: string;
  interpretationHelp: string;
  recommendedHelp: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  interpretation: string;
  recommendedTue: string;
  recommendedSat: string;
  checkLocalRules: string;
  recheckHeading: string;
  recheckTue: string;
  recheckSat: string;
  recheckSentence: string;
  step6Title: string;
  doNotCutMinimum: string;
  boundaries: readonly string[];
  kitLead: string;
  kitLink: string;
};

export type StaffingReviewRulesInput = {
  minimumStaff: string;
  targetLow: string;
  targetHigh: string;
  flagN: string;
  flagM: string;
  protectedRoles: string[];
  nonSalesDayParts: string[];
};

export type StaffingCopy = {
  publicEyebrow: string;
  publicTitle: string;
  publicBody: string;
  labelsTitle: string;
  confirmedHelp: string;
  ownerEnteredHelp: string;
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

export type JapaneseStaffingCopy = StaffingCopy & {
  demo: StaffingDemo;
  sections: readonly StaffingSection[];
  setupSteps: readonly string[];
  coveragePrompt: string;
  coveragePromptIntro: string;
  recheckPrompt: string;
  recheckPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  minimumLabel: string;
  targetLowLabel: string;
  targetHighLabel: string;
  flagLegend: string;
  flagNAria: string;
  flagMAria: string;
  protectedRolesLabel: string;
  nonSalesLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  minimumStaffError: string;
  targetRangeError: string;
  reviewRules: (input: StaffingReviewRulesInput) => string;
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
