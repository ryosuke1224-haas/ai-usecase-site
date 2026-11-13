import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { ExpenseCopy } from "./copy-types";

export const englishExpenseCopy: ExpenseCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "AI Expense Watchdog",
  publicBody:
    "Turn a few months of card or accounting CSV rows into a recurring-charge ledger with labelled amount changes and possible overlaps. AI prepares the review. You decide what to cancel. You cancel in the vendor's own site yourself. The kit changes nothing.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the export row.",
  needsCheckHelp: "A gap a person has to check. A missing usage column is one of these.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The export",
    "RECURRING LEDGER FIRST",
    "Visible formulas, then stop",
    "Check the facts",
    "What a later run needs",
    "You cancel it",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "AI Expense Watchdog Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing a card or accounting CSV in ChatGPT, Claude, or Gemini. AI builds a recurring ledger and labels amount changes. You check every CONFIRMED amount and cancel in the vendor's own site yourself. The kit changes nothing.",
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
