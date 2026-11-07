export type NoShowSectionId =
  | "setup-checklist"
  | "attendance-prompt"
  | "rebooking-draft-prompt"
  | "rules-worksheet"
  | "recovery-log-template"
  | "action-review-checklist"
  | "sample-bookings"
  | "safety-guidance";

export type NoShowSection = {
  id: NoShowSectionId;
  title: string;
  intro: string;
};

export type BookingRow = {
  time: string;
  client: string;
  service: string;
  status: string;
  contactPref: string;
  smsConsent: string;
  prior: string;
};

export type OpenSlot = {
  service: string;
  when: string;
};

export type FactCheckRow = {
  field: string;
  confirmed: string;
  booking: string;
};

export type NoShowDemo = {
  asOfLabel: string;
  asOfValue: string;
  step1Lead: string;
  bookingsLabel: string;
  columns: readonly string[];
  rows: readonly BookingRow[];
  openSlotsLabel: string;
  slots: readonly OpenSlot[];
  consentTeaching: string;
  step2Lead: string;
  skippedLabel: string;
  skipped: readonly { client: string; reason: string }[];
  confirmedLabel: string;
  confirmed: readonly { client: string; detail: string }[];
  smsHoldLabel: string;
  smsHold: string;
  step3Lead: string;
  promptName: string;
  draftLabel: string;
  draftText: string;
  step3Needs: string;
  step3Policy: string;
  step3Boundary: string;
  step4Lead: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factRows: readonly FactCheckRow[];
  factResult: string;
  step5Lead: string;
  policyLabel: string;
  policyDetail: string;
  step5Boundary: string;
  step6TitleSentence: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type RecoveryRulesInput = {
  threshold: number;
  neverStatuses: string[];
  skipClients: string[];
};

export type NoShowCopy = {
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
  demo: NoShowDemo;
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
  sections: readonly NoShowSection[];
  setupSteps: readonly string[];
  attendancePrompt: string;
  rebookingDraftPrompt: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  consentHelper: string;
  thresholdLabel: string;
  neverStatusesLabel: string;
  alwaysSkipLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesHeading: string;
  copyRules: string;
  thresholdError: string;
  recoveryRules: (input: RecoveryRulesInput) => string;
  reviewItems: readonly string[];
  checkedLabel: (done: number, total: number) => string;
  resetChecklist: string;
  reviewComplete: string;
  allowedOutcomesLabel: string;
  allowedOutcomes: readonly string[];
  fictionalExample: string;
  fictionalBadge: string;
  copyCsv: string;
  sampleTableLabel: string;
  logTableLabel: string;
  logColumns: readonly string[];
  safetyRules: readonly string[];
  sampleBookingsCsv: string;
  recoveryLogCsv: string;
};
