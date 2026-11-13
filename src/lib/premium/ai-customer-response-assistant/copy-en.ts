import { FICTIONAL_DATA_NOTICE } from "./demo-data";
import type { ReplyCopy } from "./copy-types";

export const englishReplyCopy: ReplyCopy = {
  publicEyebrow: "Private preview",
  publicTitle: "On-brand Reply Review Queue",
  publicBody:
    "Paste one inbound message, stop drafts on the owner's escalate list, and answer only from pasted FAQ facts. AI prepares. You review and send. Confirmed facts, AI interpretation, and recommended actions are labelled separately. Nothing is sent automatically. Every name, time, and message on this walkthrough is invented.",
  labelsTitle: "How labels are used in this demo",
  confirmedHelp: "Stated in the message or in the pasted FAQ.",
  needsCheckHelp: "Missing from the FAQ. Do not invent an answer.",
  interpretationHelp: "An inference by the AI, never presented as a fact.",
  recommendedHelp: "A suggestion. You decide whether it happens.",
  fictionalNotice: FICTIONAL_DATA_NOTICE,
  demoAria: "Guided demo",
  stepLabel: (step, total) => `Step ${step} of ${total}`,
  previousStep: "Previous step",
  nextStep: "Next step",
  stepTitles: [
    "The FAQ, tone sheet, and message",
    "ESCALATE RULES FIRST",
    "FAQ-only timing",
    "Check the facts",
    "Missing answers stay labelled",
    "You send it",
  ],
  kitEyebrow: "Premium · Private preview",
  kitTitle: "On-brand Reply Review Queue Premium Kit",
  kitBody:
    "Prompts, a worksheet, and checklists for reviewing one pasted inbound message in ChatGPT, Claude, or Gemini. AI stops drafts on your escalate list and answers only from pasted FAQ facts. You review and send. You send it. Nothing is sent automatically.",
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
