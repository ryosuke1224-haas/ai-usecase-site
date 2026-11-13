import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { WinbackCopy } from "./copy-types";

export const englishWinbackCopy: WinbackCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Lapsed Customer Return Queue",
  publicBody:
    "Turn a stripped customer export into a consent-filtered, VIP-first winback queue with drafts locked to your written offers, then check a later POS export for who returned. AI prepares the queue. You review and send, or you decide not to. Nothing is sent automatically, and no live POS, email, or SMS system is attached.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the customer export and your rules.",
  needsCheckHelp: "A gap a person has to check. Missing fields or unclear VIP or offer status are examples.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The customer export",
    "SKIP RULES FIRST",
    "VIP first, then drafts",
    "Check the facts",
    "Later export return check",
    "You send it",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Lapsed Customer Return Queue Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing a stripped customer export in ChatGPT, Claude, or Gemini. AI applies skip rules, ranks VIP first, and drafts only from your written offers. You pick the recipient and send it yourself from your own tool, or you decide not to. Nothing is sent automatically. Do not invent a discount that is not on your offer list.",
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
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. You send it. Nothing is sent automatically.",
};
