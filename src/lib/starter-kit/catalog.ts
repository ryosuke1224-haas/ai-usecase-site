import { DAILY_INBOX_STARTER_KIT_PATH } from "@/src/lib/blueprints";

export type StarterKitResourceSlug =
  | "initial-prompt"
  | "priority-rules-prompt"
  | "chatgpt-setup"
  | "claude-setup"
  | "gemini-setup"
  | "priority-worksheet"
  | "review-checklist"
  | "safety-guidance"
  | "troubleshooting";

export type StarterKitResource = {
  slug: StarterKitResourceSlug;
  title: string;
  summary: string;
  href: string;
};

export const STARTER_KIT_RESOURCES: StarterKitResource[] = [
  {
    slug: "initial-prompt",
    title: "Initial Daily Inbox Briefing Prompt",
    summary:
      "Reusable prompt that reviews Gmail and Calendar, separates CONFIRMED FACT from AI INTERPRETATION, and ends with today’s Top 3 priorities.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/initial-prompt`,
  },
  {
    slug: "priority-rules-prompt",
    title: "Priority Rules Prompt",
    summary:
      "Teach the AI your urgency rules, then regenerate the briefing and explain what changed.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/priority-rules-prompt`,
  },
  {
    slug: "chatgpt-setup",
    title: "ChatGPT Setup Guide",
    summary:
      "Connect Gmail and Calendar in ChatGPT, review permissions, and run the workflow safely.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/chatgpt-setup`,
  },
  {
    slug: "claude-setup",
    title: "Claude Setup Guide",
    summary:
      "Connect your work data in Claude, review connector permissions, and follow the guided walkthrough.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/claude-setup`,
  },
  {
    slug: "gemini-setup",
    title: "Gemini Setup Guide",
    summary:
      "Use Gemini with your Google account, review access carefully, and generate your first briefing.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/gemini-setup`,
  },
  {
    slug: "priority-worksheet",
    title: "Priority Rules Worksheet",
    summary:
      "Define your own priority rules and generate a copyable prompt—entirely in the browser.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/priority-worksheet`,
  },
  {
    slug: "review-checklist",
    title: "Review Checklist",
    summary:
      "Interactive checklist for verifying deadlines, facts, Top 3 priorities, and AI inventions.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/review-checklist`,
  },
  {
    slug: "safety-guidance",
    title: "Safety Guidance",
    summary:
      "Practical rules for connector permissions, sensitive data, and human approval before action.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/safety-guidance`,
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    summary:
      "Fixes for missing mail/calendar access, invented deadlines, noisy urgency, and connector issues.",
    href: `${DAILY_INBOX_STARTER_KIT_PATH}/troubleshooting`,
  },
];

export function getStarterKitResource(
  slug: string,
): StarterKitResource | undefined {
  return STARTER_KIT_RESOURCES.find((resource) => resource.slug === slug);
}

export function isStarterKitResourceSlug(
  slug: string,
): slug is StarterKitResourceSlug {
  return STARTER_KIT_RESOURCES.some((resource) => resource.slug === slug);
}
