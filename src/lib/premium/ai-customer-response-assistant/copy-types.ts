export type ReplySectionId =
  | "setup-checklist"
  | "escalate-prompt"
  | "draft-prompt"
  | "rules-worksheet"
  | "reply-log-template"
  | "action-review-checklist"
  | "sample-messages"
  | "safety-guidance";

export type ReplySection = {
  id: ReplySectionId;
  title: string;
  intro: string;
};

export type ReplyDemo = {
  step1Lead: string;
  senderLabel: string;
  receivedLabel: string;
  messageHeading: string;
  faqHeading: string;
  escalateLabel: string;
  toneLabel: string;
  neverInDraftLine: string;
  step2Lead: string;
  escalateLine: string;
  doNotDraftMoney: string;
  internalNote: string;
  otherEscalateRules: string;
  reviewQueueLine: string;
  step3Lead: string;
  confirmedLine: string;
  faqFactLine: string;
  partialDraftLabel: string;
  partialDraft: string;
  needsCheckLine: string;
  interpretation: string;
  recommended: string;
  step4Lead: string;
  factFaqLine: string;
  factButton: string;
  factTableLabel: string;
  factColumns: readonly string[];
  factResult: string;
  step5Lead: string;
  doNotInventFriday: string;
  longWaitUnverified: string;
  howToOnlyContrast: string;
  step6Title: string;
  doNotSend: string;
  step6Body: string;
  step6Boundary: string;
  kitLink: string;
};

export type ReplyRulesCopyInput = {
  toneRules: string;
  faqFacts: string[];
  escalateList: string[];
};

export type ReplyCopy = {
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

export type JapaneseReplyCopy = ReplyCopy & {
  demo: ReplyDemo;
  sections: readonly ReplySection[];
  setupSteps: readonly string[];
  escalatePrompt: string;
  escalatePromptIntro: string;
  draftPrompt: string;
  draftPromptIntro: string;
  copyPrompt: string;
  copied: string;
  copyFailed: string;
  copyCsv: string;
  copyText: string;
  toneRulesLabel: string;
  faqFactsLabel: string;
  escalateListLabel: string;
  generateRules: string;
  inputsChanged: string;
  rulesTitle: string;
  copyRules: string;
  escalateListError: string;
  faqFactsError: string;
  reviewRules: (input: ReplyRulesCopyInput) => string;
  reviewItems: readonly string[];
  checkedLabel: string;
  resetChecklist: string;
  reviewComplete: string;
  sampleIntro: string;
  logIntro: string;
  checklistIntro: string;
  fictionalBadge: string;
  safetyRules: readonly string[];
};
