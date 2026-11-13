import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { StaffingCopy } from "./copy-types";

export const englishStaffingCopy: StaffingCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Shift Coverage vs Demand Check",
  publicBody:
    "Line up hourly POS demand against clocked hours under owner-set minimums and a 3-of-4-weeks pattern rule. AI prepares the math. Schedule edits stay in your own tool.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Calculated from the exports.",
  ownerEnteredHelp: "Minimum, target range, protected roles, non-sales day-parts.",
  needsCheckHelp: "A gap a person has to check, such as a missing week or zero staff.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The exports",
    "OWNER RULES FIRST",
    "Day-by-hour grid and flags",
    "Check one flagged block",
    "Coverage-safe recommendation and re-check",
    "You edit the schedule",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Shift Coverage vs Demand Check Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing hourly POS and clocked-hour exports in ChatGPT, Claude, or Gemini. AI calculates transactions per staff-hour with visible formulas. You check every CONFIRMED figure, then edit the schedule in your own tool yourself. The kit changes nothing.",
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
    "Your Atlas account is signed in. This Premium kit is a private preview. Atlas has not recorded an entitlement for this account, so the kit stays closed. Access for this private preview is by entitlement only.",
};
