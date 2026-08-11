const SAFETY_POINTS = [
  {
    title: "Review connector permissions before authorizing",
    body: "When ChatGPT, Claude, or Gemini asks to connect Gmail or Calendar, read the permission list first. Approve only what you understand and are comfortable granting.",
  },
  {
    title: "Broader permissions are common",
    body: "AI tools may request wider access than this Daily Inbox Briefing workflow needs. That does not mean you should enable automatic sending or editing.",
  },
  {
    title: "This workflow is for summarize → prioritize → recommend",
    body: "The Starter Kit is designed to help you prepare decisions. It is not designed to quietly act on your behalf.",
  },
  {
    title: "Keep external actions under human control",
    body: "Do not allow automatic sending, editing, or deleting unless you deliberately configure that later and understand the risk.",
  },
  {
    title: "Be careful with sensitive information",
    body: "Do not paste highly sensitive information into tools or accounts you do not trust for that data. When possible, use approved connected tools instead of copying sensitive content into unrelated chats. Always review the permissions requested by the connected tool first.",
  },
  {
    title: "Verify before consequential action",
    body: "Treat AI-generated deadlines, conflicts, and interpretations as drafts. Confirm important facts in the original email or calendar event before you reply, pay, ship, or commit.",
  },
] as const;

export function SafetyGuidance() {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        Practical guardrails for using this kit with real work data. Useful, not
        alarmist.
      </p>
      {SAFETY_POINTS.map((point) => (
        <section
          key={point.title}
          className="rounded-2xl border border-border/60 bg-card p-5"
        >
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {point.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
        </section>
      ))}
    </div>
  );
}
