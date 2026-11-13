import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { QuoteCopy } from "./copy-types";

export const englishQuoteCopy: QuoteCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Quote Request Assistant",
  publicBody:
    "Paste a quote request, extract labelled scope against the owner's written qualification rules, and review a draft acknowledgment. AI prepares. You decide whether any reply is sent. The kit changes nothing.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the request.",
  needsCheckHelp: "A gap you must resolve before fit or a draft.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The request and the rules",
    "Extract with labels",
    "FIT: YES",
    "Check the facts",
    "Questions and draft",
    "You price and send",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Quote Request Assistant Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing one pasted quote request in ChatGPT, Claude, or Gemini. AI extracts stated scope and applies your written rules. You check every CONFIRMED field, price the job, and send any reply yourself. The kit changes nothing.",
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
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. You price it. You send it. The kit changes nothing.",
};
