import Link from "next/link";
import { HomeSection } from "./home-section";

type Example = {
  category: string;
  title: string;
  tools: string;
  outcome: string;
  /** Real published use-case slug, if one exists. */
  href?: string;
};

const examples: Example[] = [
  {
    category: "Marketing",
    title: "Google Ads Performance Coach",
    tools: "Google Ads + GA4",
    outcome:
      "Analyze campaign and website data, detect tracking problems and wasted spend, and recommend prioritized improvements.",
  },
  {
    category: "Customer insights",
    title: "Customer Review Intelligence",
    tools: "Customer reviews + competitor reviews",
    outcome:
      "Identify recurring strengths and complaints, compare competitors, and recommend actions.",
    href: "/use-cases/ai-review-intelligence",
  },
  {
    category: "Sales operations",
    title: "Meeting Follow-up Assistant",
    tools: "Gmail + Google Calendar + meeting notes",
    outcome:
      "Summarize meetings, draft follow-ups, and track next actions.",
  },
];

export function WhatYouCanBuild() {
  return (
    <HomeSection
      title="Examples of workflows you can build"
      description="Each blueprint starts with a real business problem and shows the data, tools, and implementation path needed to solve it."
      className="rounded-2xl border border-border/60 bg-surface/50 px-6 sm:px-8"
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {examples.map((example) => (
          <li key={example.title}>
            <ExampleCard example={example} />
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}

function ExampleCard({ example }: { example: Example }) {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
          {example.category}
        </span>
        <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted">
          Example blueprint
        </span>
      </div>
      <h3 className="mt-2 font-semibold">{example.title}</h3>
      <p className="mt-2 text-xs font-medium text-muted">{example.tools}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
        {example.outcome}
      </p>
      {example.href ? (
        <span className="mt-4 text-sm font-medium text-accent">
          View blueprint →
        </span>
      ) : (
        <span className="mt-4 text-xs text-muted">Example only</span>
      )}
    </>
  );

  if (example.href) {
    return (
      <Link
        href={example.href}
        className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-5">
      {body}
    </div>
  );
}
