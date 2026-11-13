export type WinbackSectionId =
  | "setup-checklist"
  | "skip-rules-prompt"
  | "draft-prompt"
  | "return-check-prompt"
  | "rules-worksheet"
  | "contact-log-template"
  | "action-review-checklist"
  | "sample-customers"
  | "safety-guidance";

export type WinbackSection = {
  id: WinbackSectionId;
  title: string;
  intro: string;
};

export type WinbackDemo = {
  step1Lead: string;
  asOfLabel: string;
  lapseLabel: string;
  vipLabel: string;
  skipOneTimeLabel: string;
  skipOneTimeValue: string;
  offersHeading: string;
  vipOfferLine: string;
  occasionalOfferLine: string;
  exportHeading: string;
  exportTableLabel: string;
  contactLogLine: string;
  step2Lead: string;
  skippedLabel: string;
  skipped: readonly string[];
  lapseDateSentence: string;
  step3Lead: string;
  queueTableLabel: string;
  drafts: readonly {
    rank: string;
    first: string;
    segment: string;
    confirmed: string;
    draft: string;
  }[];
  interpretation: string;
  recommended: string;
  noInventLine: string;
  step4Lead: string;
  factConfirmed: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  returnOutcomes: readonly string[];
  returnNotProof: string;
  confirmConsent: string;
  stillSkipped: readonly string[];
  step6Title: string;
  doNotInvent: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type WinbackRulesReviewInput = {
  lapseBefore: string;
  vipFloor: number;
  skipOneTime: boolean;
  vipOffers: string[];
  occasionalOffers: string[];
};

export type WinbackCopy = {
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

export type JapaneseWinbackCopy = WinbackCopy & {
  demo: WinbackDemo;
  sections: readonly WinbackSection[];
  setupSteps: readonly string[];
  skipRulesPrompt: string;
  skipRulesPromptIntro: string;
  draftPrompt: string;
  draftPromptIntro: string;
  returnCheckPrompt: string;
  returnCheckPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  lapseLabel: string;
  vipLabel: string;
  skipOneTimeLabel: string;
  vipOffersLabel: string;
  occasionalOffersLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  lapseDateError: string;
  vipFloorError: string;
  offerListError: string;
  reviewRules: (input: WinbackRulesReviewInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  contactLogIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
};
