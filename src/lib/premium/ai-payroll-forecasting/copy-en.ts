import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { PayrollCopy } from "./copy-types";

export const englishPayrollCopy: PayrollCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "Next-Pay Labor Check",
  publicBody:
    "Before the pay period starts, calculate loaded payroll from the posted schedule with visible formulas, flag only against your labor-share target and overtime rule, and re-check against the actual pay run. AI prepares the math. Schedule edits stay in your own tool.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Schedule × rate from the export.",
  ownerEnteredHelp: "Load factor, target, revenue estimate, overtime rule.",
  calculatedHelp: "Formula results and labor percentage.",
  needsCheckHelp: "A gap a person has to check, such as a missing role or conflicting rate.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The schedule export",
    "NEXT-PAY LABOR CHECK",
    "Target and overtime flags",
    "Check the facts",
    "Interpretation and later variance",
    "You edit the schedule",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "Next-Pay Labor Check Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing a schedule export in ChatGPT, Claude, or Gemini. AI calculates loaded payroll with visible formulas. You check every CONFIRMED hour and rate, then edit the schedule in your own tool yourself. The kit changes nothing.",
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
