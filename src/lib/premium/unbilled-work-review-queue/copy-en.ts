import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { UnbilledCopy } from "./copy-types";

export const englishUnbilledCopy: UnbilledCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Unbilled Work Review Queue",
  publicBody:
    "Turn a job or time-entry export into a skip-ruled unbilled queue with oldest-first ranking and field-limited invoice outlines. AI prepares. You create or hold each invoice. Nothing is sent or collected.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the job export or billing log.",
  needsCheckHelp: "Missing fields. Not outlined until you complete them.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The export",
    "SKIP RULES FIRST",
    "The ranked unbilled queue",
    "Check the numbers",
    "Next week's log",
    "You create the invoice",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Unbilled Work Review Queue Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing a job or time-entry export in ChatGPT, Claude, or Gemini. AI applies skip rules and drafts outlines from export fields only. You create the invoice. Nothing is sent or collected.",
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
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. You create the invoice. Nothing is sent or collected.",
};
