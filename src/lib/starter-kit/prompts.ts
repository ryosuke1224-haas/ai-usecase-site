/** Plain-text prompts for the Daily Inbox Briefing Starter Kit. */

export const INITIAL_DAILY_INBOX_BRIEFING_PROMPT = `You are helping me prepare a Daily Inbox Briefing. Use only information available from my connected Gmail and today's Google Calendar. Do not invent messages, events, deadlines, or people.

## Goal
Create a clear morning briefing that helps me decide what needs attention today.

## What to review
1. Gmail messages received in the last 24 hours, plus any older unread messages that may still require action.
2. Today's Google Calendar events

## What to identify
- Items needing action
- Deadlines
- Replies needed
- Meeting preparation
- Calendar conflicts

## Hard rules
- Separate CONFIRMED FACT from AI INTERPRETATION.
- Do not invent deadlines.
- Do not invent missing details.
- Do not send emails.
- Do not modify calendar events.
- Do not take any external action.
- Recommend next actions for me to approve and take myself.

## Output format
Organize the briefing into clear sections. For each important item, include:
- Email subject or calendar event
- Relevant deadline or meeting time
- CONFIRMED FACT
- AI INTERPRETATION, if any
- RECOMMENDED ACTION

Use these labels exactly when relevant:
- CONFIRMED FACT
- AI INTERPRETATION
- RECOMMENDED ACTION

## Closing section
End the briefing with:

TODAY'S TOP 3 PRIORITIES
1.
2.
3.

For each of the Top 3, briefly explain why it belongs there based on evidence from email or calendar.`;

export const PRIORITY_RULES_PROMPT = `Apply the following priority rules to my Daily Inbox Briefing, then regenerate the briefing.

## Priority rules

### High priority
- Client contract approvals are high priority.
- Client proposal requests are high priority when a response is needed.

### Urgency
An item is urgent only if at least one of these is true:
1. It has a deadline today.
2. It blocks a meeting happening today.
3. It may delay a payment, shipment, or client commitment.

If none of the urgency criteria are supported by evidence, do not classify the item as urgent.

### Do not treat as urgent
- Newsletters
- FYI-only updates

### Waiting / FYI
- If someone explicitly says no action is needed yet, classify the item as Waiting or FYI as appropriate.

### Email and calendar connection
- When an email relates to a calendar event, show that connection and cite the evidence.

## Labeling requirements
Clearly label:
- CONFIRMED FACT
- AI INTERPRETATION
- RECOMMENDED ACTION

## Regeneration task
1. Re-evaluate the current briefing using these rules.
2. Produce an updated Daily Inbox Briefing.
3. Keep the same safety limits: do not invent deadlines, do not send emails, do not modify calendar events, and do not take external action.

## Final section
End with:

WHAT CHANGED
Explain which items changed priority or category and why, using the rules above.`;

export type PriorityWorksheetValues = {
  highPrioritySenders: string;
  highPriorityRequestTypes: string;
  urgentCriteria: string;
  neverUrgent: string;
  waitingOrFyi: string;
  meetingRules: string;
  neverAutomaticActions: string;
};

const WORKSHEET_SECTIONS: {
  key: keyof PriorityWorksheetValues;
  heading: string;
}[] = [
  {
    key: "highPrioritySenders",
    heading: "High-priority customers / senders",
  },
  {
    key: "highPriorityRequestTypes",
    heading: "High-priority request types",
  },
  {
    key: "urgentCriteria",
    heading: "What makes something urgent?",
  },
  {
    key: "neverUrgent",
    heading: "What should never be marked urgent?",
  },
  {
    key: "waitingOrFyi",
    heading: "Items that should be Waiting / FYI",
  },
  {
    key: "meetingRules",
    heading: "Meeting-related rules",
  },
  {
    key: "neverAutomaticActions",
    heading: "Actions AI must never take automatically",
  },
];

/**
 * Builds a priority-rules prompt from filled worksheet fields only.
 * Returns null when every field is empty.
 */
export function buildPriorityRulesPromptFromWorksheet(
  values: PriorityWorksheetValues,
): string | null {
  const filled = WORKSHEET_SECTIONS.flatMap((section) => {
    const trimmed = values[section.key].trim();
    if (!trimmed) return [];
    return [{ heading: section.heading, value: trimmed }];
  });

  if (filled.length === 0) {
    return null;
  }

  const rulesBlock = filled
    .map((section) => `### ${section.heading}\n${section.value}`)
    .join("\n\n");

  return `Apply the following custom priority rules to my Daily Inbox Briefing, then regenerate the briefing.

## My priority rules

${rulesBlock}

## Urgency evidence rule
If none of the urgency criteria are supported by evidence, do not classify the item as urgent.

## Labeling requirements
Clearly label:
- CONFIRMED FACT
- AI INTERPRETATION
- RECOMMENDED ACTION

## Regeneration task
1. Re-evaluate the current briefing using these rules.
2. Produce an updated Daily Inbox Briefing.
3. Keep the same safety limits: do not invent deadlines, do not send emails, do not modify calendar events, and do not take external action.

## Final section
End with:

WHAT CHANGED
Explain which items changed priority or category and why, using my rules above.`;
}
