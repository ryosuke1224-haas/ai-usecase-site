import Link from "next/link";
import type { StarterKitDemoTool } from "@/src/lib/starter-kit/demos";

type SetupGuideProps = {
  tool: StarterKitDemoTool;
  accountNeeded: string;
  whereToConnect: string[];
  notes?: string[];
};

export function SetupGuide({
  tool,
  accountNeeded,
  whereToConnect,
  notes = [],
}: SetupGuideProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          What you need
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{accountNeeded}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          {tool.availabilityNote} Service availability may depend on your plan,
          account type, and settings.
        </p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Where to find the connection setting
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          {whereToConnect.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Before you authorize
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            Review connector permissions carefully. AI tools may request broader
            access than this workflow needs.
          </li>
          <li>
            This workflow is designed for summarizing, prioritizing, and
            recommending. It does not require the AI to send emails or edit
            calendar events.
          </li>
          <li>
            Keep sending, editing, and deleting under your control unless you
            deliberately configure something else later.
          </li>
        </ul>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Guided walkthrough
            </h2>
            <p className="mt-1 text-sm text-muted">
              Visual walkthrough for {tool.label}. Same demo as on the public
              workflow page.
            </p>
          </div>
          <Link
            href="/use-cases/ai-daily-inbox-briefing#guided-demos"
            className="text-xs font-medium text-accent hover:underline"
          >
            Open public guided demos
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="relative aspect-video w-full bg-surface">
            <iframe
              src={tool.embedUrl}
              title={`${tool.label} guided walkthrough for AI Daily Inbox Briefing`}
              loading="lazy"
              allow="clipboard-write; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      </section>

      {notes.length > 0 ? (
        <section className="rounded-2xl border border-border/60 bg-surface/60 p-5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Extra notes
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            {notes.map((note) => (
              <li key={note} className="flex gap-2">
                <span aria-hidden="true" className="text-accent">
                  •
                </span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
