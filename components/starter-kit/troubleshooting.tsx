const TROUBLESHOOTING_ITEMS = [
  {
    problem: "AI cannot see Gmail",
    fix: "Confirm the Gmail connector is connected for the same account you expect. Re-open the tool’s connection settings, reconnect if needed, and check that the conversation/session is allowed to use the connector.",
  },
  {
    problem: "AI cannot see Calendar",
    fix: "Connect Google Calendar explicitly (it is separate from Gmail in many tools). Then ask the AI to list today’s events to verify access before generating a full briefing.",
  },
  {
    problem: "Calendar events are missing",
    fix: "Check the calendar account, timezone, and date. Ask specifically for “today’s events on my primary calendar.” Shared or secondary calendars may need extra permission or may not be included.",
  },
  {
    problem: "AI marks too many items urgent",
    fix: "Use the Priority Rules Prompt or Worksheet. Limit urgency to deadlines today, blockers for today’s meetings, or risks to payment/shipment/client commitments. If none of the urgency criteria are supported by evidence, do not classify the item as urgent. Explicitly exclude newsletters and FYI-only updates.",
  },
  {
    problem: "AI invents deadlines",
    fix: "Remind the model: only use deadlines stated in the source. Require CONFIRMED FACT vs AI INTERPRETATION labels. If a deadline is not written in the email/event, it must not appear as a fact.",
  },
  {
    problem: "Briefing is too long",
    fix: "Ask for a shorter output: important items only, then TODAY’S TOP 3 PRIORITIES. You can also request one short line per item plus CONFIRMED FACT, AI INTERPRETATION, and RECOMMENDED ACTION labels.",
  },
  {
    problem: "Wrong items appear in Top 3",
    fix: "Paste your priority rules and ask the AI to regenerate with a WHAT CHANGED section. Correct one mistaken ranking in plain language, then ask it to re-rank using your correction.",
  },
  {
    problem: "Connector permissions changed",
    fix: "Revisit the tool’s connected-apps or connectors page. Revoke access you no longer want, reconnect with the minimum you are comfortable granting, and re-test with a small request before running the full briefing.",
  },
  {
    problem: "The AI service says a connector is unavailable",
    fix: "Availability can depend on plan, account type, region, or temporary outages. Try another supported tool from this kit (ChatGPT, Claude, or Gemini), or retry later after checking the provider’s status and your account settings.",
  },
] as const;

export function Troubleshooting() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        Common setup and quality issues, with concise fixes. Start with the
        smallest verification step before changing everything.
      </p>
      {TROUBLESHOOTING_ITEMS.map((item) => (
        <section
          key={item.problem}
          className="rounded-2xl border border-border/60 bg-card p-5"
        >
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {item.problem}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">Suggested fix: </span>
            {item.fix}
          </p>
        </section>
      ))}
    </div>
  );
}
