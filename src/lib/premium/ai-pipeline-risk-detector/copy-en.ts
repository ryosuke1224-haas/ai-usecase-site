import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { PipelineCopy } from "./copy-types";

export const englishPipelineCopy: PipelineCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Stalled Deal Rescue Queue",
  publicBody:
    "Turn an open-deals export into a skip-ruled stall queue ranked by amount, with recovery notes that may use only export fields. AI prepares. You review and act from your own CRM or email. Nothing is sent or written to the CRM.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the deal export.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  skippedHelp: "Set aside by skip rules before the stall queue.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The export",
    "SKIP RULES FIRST",
    "The ranked stall queue",
    "Check the numbers",
    "Next week's log",
    "You send it",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Stalled Deal Rescue Queue Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing an open-deals export in ChatGPT, Claude, or Gemini. AI applies skip rules and drafts recovery notes from export fields only. You send it. Nothing is sent or written to the CRM.",
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
    "Your Atlas account is signed in. This Premium kit is a private preview. There is currently no checkout. Access is granted by entitlement for this private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. You send it. Nothing is sent or written to the CRM.",
};
