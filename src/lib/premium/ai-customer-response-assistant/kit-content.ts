import { secondaryPromptSetupStep } from "@/src/lib/premium/shared/setup-checklist";

export const PLAN_DIFFERENCE_NOTICE =
  "File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.";

export const SESSION_ONLY_NOTICE =
  "Worksheet entries and checklist progress stay in this browser session and are not saved to Atlas.";

export const KIT_SECTIONS = [
  { id: "setup-checklist", title: "On-brand Reply Setup Checklist" },
  { id: "escalate-prompt", title: "Escalate-First Prompt" },
  { id: "draft-prompt", title: "FAQ-Only Draft Prompt" },
  { id: "rules-worksheet", title: "Tone, FAQ, and Escalate Worksheet" },
  { id: "reply-log-template", title: "Weekly Consistency Log" },
  { id: "action-review-checklist", title: "Send Review Checklist" },
  { id: "sample-messages", title: "Fictional Sample Messages" },
  { id: "safety-guidance", title: "Data and Safety Guidance" },
] as const;

export type KitSectionId = (typeof KIT_SECTIONS)[number]["id"];

export function kitSectionTitle(id: KitSectionId): string {
  return KIT_SECTIONS.find((section) => section.id === id)?.title ?? id;
}

export const SETUP_STEPS = [
  "Write tone rules, FAQ facts, and an escalate list before any draft. Default escalate topics are refund demand, injury, legal threat, discrimination, and safety. You decide the written tone ladder, which facts the shop will stand behind, and which topics must never get a customer-facing draft from this workflow.",
  "Paste one inbound message, or a small CSV of form submissions with name, topic, and message text. Remove extra contact fields, phone numbers, email addresses, and payment details. This is a pasted message, not a live inbox, form, or helpdesk connection. You decide which message to review and what to leave out.",
  "Check your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload anything. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings. If your tool cannot take a file, or you would rather not upload it, paste the message as text instead, or do not use AI for this message at all.",
  "Paste the Escalate-First Prompt, your rules from the Tone, FAQ, and Escalate Worksheet, then the message text.",
  "AI runs ESCALATE RULES FIRST. If the message matches the escalate list, AI writes an INTERNAL NOTE, lists the matching rule, and does not draft a customer-facing reply about that topic. You handle any refund, injury, legal, discrimination, or safety message yourself.",
  secondaryPromptSetupStep(
    "FAQ-Only Draft Prompt",
    "after escalate rules run, to draft a reply that uses only pasted FAQ facts",
  ),
  "Use the Send Review Checklist, edit the draft in your own inbox, and log sent, held, or escalated. You send it. Nothing is sent automatically. The Blueprint never sends, edits, cancels, or pays.",
] as const;

export const ESCALATE_PROMPT = [
  "You are helping me review one pasted inbound customer message. You prepare; I decide.",
  "",
  "ESCALATE RULES FIRST. Apply the owner's escalate list before any customer-facing draft.",
  "",
  "Do not draft a customer-facing reply about money. Do not invent a policy, price, hours, or appointment time. Do not send.",
  "",
  "I am pasting:",
  "1. My tone, FAQ, and escalate rules from the Tone, FAQ, and Escalate Worksheet.",
  "2. One inbound message copied as plain text (name, topic, and message text). Extra contact fields, phone numbers, email addresses, and payment details have been removed.",
  "",
  "RULES",
  "- Write ESCALATE RULES FIRST at the top.",
  "- Compare the message to the escalate list. Match refund demand, injury, legal threat, discrimination, and safety, plus any extra items I listed.",
  "- If the message matches the escalate list, write INTERNAL NOTE, list the matching rule, and STOP. Do not draft a customer-facing reply about that topic. Do not draft a customer-facing reply about money or harm.",
  "- If the only content is an escalate match, STOP. Do not write any customer-facing reply.",
  "- If the same message also contains a separate CONFIRMED question that the FAQ answers, you may add a PARTIAL DRAFT for that question only, labelled as optional to discard, and still write no sentence about the escalate topic.",
  "- Label CONFIRMED (questions stated in the message and facts stated in the FAQ), AI INTERPRETATION, and RECOMMENDED ACTION separately.",
  "- A complaint about a long wait, with no independently stated duration in the message or FAQ, is AI INTERPRETATION, not a CONFIRMED fact.",
  "- The draft is a draft only. Do not send. Suggest a consistency-log row; I add it.",
  "",
  "OUTPUT FORMAT",
  "ESCALATE RULES FIRST",
  "REVIEW QUEUE — count messages",
  "ESCALATE: matching rule and the quoted phrase. Do not draft a customer-facing reply about money.",
  "INTERNAL NOTE: what the owner should handle. STOP when the message is only an escalate match.",
  "CONFIRMED: questions stated in the message.",
  "AI INTERPRETATION: unverified claims such as a long wait.",
  "RECOMMENDED ACTION (you decide): handle the escalate topic yourself; edit or discard any partial draft; send from your own inbox. You send it. Nothing is sent automatically.",
  "",
  "Do not invent. Do not send.",
].join("\n");

export const DRAFT_PROMPT = [
  "You are helping me draft a FAQ-only reply. Use this prompt only after escalate rules have already run.",
  "",
  "Do not invent a policy, price, hours, or appointment time. Do not send. Never promise a refund, discount, or deadline that is not in the FAQ. You send it. Nothing is sent automatically.",
  "",
  "I am pasting:",
  "1. My tone, FAQ, and escalate rules.",
  "2. The escalate-first result for this message.",
  "3. The original message text.",
  "",
  "RULES",
  "- Use this only after escalate rules ran. If the message still needs an escalate STOP, do not write a customer-facing sentence about that topic.",
  "- Extract CONFIRMED questions from the message.",
  "- Answer only with FAQ facts the owner pasted.",
  "- If the FAQ does not cover the question, write NEEDS YOUR CHECK. Do not invent a policy, price, or appointment time.",
  "- A mixed message may get a PARTIAL DRAFT for a covered question only, labelled as optional to discard.",
  "- Friday availability that is not in the FAQ is NEEDS YOUR CHECK, not an opening the shop can confirm from this workflow.",
  "- Never promise a refund.",
  "",
  "OUTPUT FORMAT",
  "CONFIRMED questions.",
  "FAQ FACTS used.",
  "PARTIAL DRAFT (optional to discard) or none.",
  "NEEDS YOUR CHECK for anything missing.",
  "AI INTERPRETATION labelled separately.",
  "RECOMMENDED ACTION (you decide). You send it. Nothing is sent automatically.",
  "",
  "Do not invent. Do not send. Never promise a refund. You send it.",
].join("\n");

export const REVIEW_CHECKLIST_ITEMS = [
  "ESCALATE RULES FIRST ran before any customer-facing draft.",
  "Matched escalate topics got no customer-facing money or harm reply.",
  "Every FAQ FACT appears in the pasted FAQ.",
  "Missing answers are labelled NEEDS YOUR CHECK. Nothing was invented.",
  "CONFIRMED, AI INTERPRETATION, and RECOMMENDED ACTION are labelled separately.",
  "The partial draft was checked against the original questions and contains no refund, discount, or invented appointment time.",
  "Friday availability and other missing facts were not invented.",
  "I will send from my own inbox, or I will hold or escalate. You send it. Nothing is sent automatically.",
  "I will not send this draft from the kit. Do not send.",
] as const;

export const SAFETY_RULES = [
  "Review your AI tool's data settings, such as chat history, training use, and file retention, before you paste or upload a customer message. File upload support and data controls in ChatGPT, Claude, and Gemini differ by plan, account, and admin settings.",
  "Remove extra contact fields, phone numbers, email addresses, and payment details.",
  "Do not paste account passwords, payment card numbers, or bank details into the AI tool.",
  "Do not draft a customer-facing reply on an escalate match. Do not draft a customer-facing reply about refund, injury, legal, discrimination, or safety matches.",
  "Do not invent hours or refunds missing from the FAQ, and do not send the draft from the kit.",
  "An incomplete escalate list is your risk: a legal or injury message that is not on the list can still get a draft you must stop yourself.",
  "Nothing is sent, edited, cancelled, or paid automatically. You send it. Nothing is sent automatically.",
  "Atlas does not connect to Gmail, a website form, a helpdesk, or any other vendor. It has no OAuth flow, no API call, and does not upload your data to any third party.",
] as const;

export const ESCALATE_LIST_ERROR = "Enter at least one escalate rule.";
export const FAQ_FACTS_ERROR = "Enter at least one FAQ fact.";

export type ReplyRulesInput = {
  toneRules: string;
  faqFacts: string;
  escalateList: string;
};

export const DEFAULT_RULES_INPUT: ReplyRulesInput = {
  toneRules: "warm, short, no slang",
  faqFacts:
    "color visits run 90 minutes\ncancellations need 24 hours\nwe do not quote refunds by email",
  escalateList: "refund demand\ninjury\nlegal threat",
};

export type RulesResult =
  | { ok: true; rules: string }
  | { ok: false; errors: string[] };

function linesOf(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function generateReplyRules(input: ReplyRulesInput): RulesResult {
  const faqFacts = linesOf(input.faqFacts);
  const escalateList = linesOf(input.escalateList);
  const tone = input.toneRules.trim();
  const errors: string[] = [];

  if (escalateList.length === 0) {
    errors.push(ESCALATE_LIST_ERROR);
  }
  if (faqFacts.length === 0) {
    errors.push(FAQ_FACTS_ERROR);
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const lines = [
    "Apply ESCALATE RULES FIRST before any customer-facing draft.",
    `Escalate and STOP when: ${escalateList.join("; ")}.`,
    "Answer only with FAQ facts the owner pasted.",
    `FAQ facts: ${faqFacts.join("; ")}.`,
    "If the FAQ does not cover the question, write NEEDS YOUR CHECK. Do not invent a policy, price, or appointment time.",
  ];
  if (tone) {
    lines.push(`Tone: ${tone}.`);
  }
  lines.push(
    "Never promise a refund, discount, or deadline that is not in the FAQ.",
    "Do not send. You send it. Nothing is sent automatically.",
  );

  return { ok: true, rules: lines.join("\n") };
}
