import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { AdsCopy } from "./copy-types";

export const englishAdsCopy: AdsCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Google Ads Performance Coach",
  publicBody:
    "Before any budget move, check whether the primary conversion is a qualified outcome, then show period changes with visible formulas. AI prepares the review. You decide whether any change happens in Google Ads. The kit changes nothing.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in an export or the conversion-actions table.",
  needsCheckHelp: "A gap a person has to check before ranking spend.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The exports",
    "MEASUREMENT REVIEW FIRST",
    "Visible formulas, then stop",
    "Check the facts",
    "What a later run needs",
    "You change it",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Google Ads Performance Coach Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for a measurement-first Google Ads review in ChatGPT, Claude, or Gemini. AI compares each primary conversion to the qualified outcome you wrote. You check every CONFIRMED number and make every change in Google Ads. The kit changes nothing.",
  planDifferenceNotice:
    "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  sessionOnlyNotice:
    "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.",
  kitNavLabel: "Kit contents",
  inThisKit: "In this kit",
  backToDemo: "Back to the guided demo",
  lockedEyebrow: "Premium · Private preview",
  lockedTitle: "Premium is locked",
  lockedBody:
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed.",
};
