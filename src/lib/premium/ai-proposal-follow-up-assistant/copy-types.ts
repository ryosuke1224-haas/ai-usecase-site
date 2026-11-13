export type ProposalSectionId =
  | "setup-checklist"
  | "silence-queue-prompt"
  | "next-week-prompt"
  | "rules-worksheet"
  | "outcome-log-template"
  | "follow-up-review-checklist"
  | "sample-proposal-export"
  | "safety-guidance";

export type ProposalSection = {
  id: ProposalSectionId;
  title: string;
  intro: string;
};

export type ProposalDemo = {
  step1Lead: string;
  asOfLabel: string;
  silenceLabel: string;
  minimumLabel: string;
  cadenceLabel: string;
  exportHeading: string;
  exportTableLabel: string;
  step2Lead: string;
  skipped: readonly string[];
  skippedStatusRules: string;
  step3Lead: string;
  queueHeading: string;
  queueTableLabel: string;
  confirmedLine: string;
  draftText: string;
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
  loggedDeclined: string;
  step6Title: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type SilenceRulesReviewInput = {
  silenceIfSentBefore: string;
  ownerMinimum: number;
  neverChaseStatuses: string[];
  cadenceLadder: string;
};

export type ProposalCopy = {
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

export type JapaneseProposalCopy = ProposalCopy & {
  demo: ProposalDemo;
  sections: readonly ProposalSection[];
  setupSteps: readonly string[];
  silenceQueuePrompt: string;
  silenceQueuePromptIntro: string;
  nextWeekPrompt: string;
  nextWeekPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  silenceDateLabel: string;
  minimumAmountLabel: string;
  neverChaseLabel: string;
  cadenceLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  silenceDateError: string;
  minimumAmountError: string;
  reviewRules: (input: SilenceRulesReviewInput) => string;
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
