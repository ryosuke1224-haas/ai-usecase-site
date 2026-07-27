import { HomeSection } from "./home-section";

const examples = [
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
      title="What you can build"
      description="Each blueprint starts with a real business problem and shows the data, tools, and implementation path needed to solve it."
      className="rounded-2xl border border-border/60 bg-surface/50 px-6 sm:px-8"
    >
      <ul className="grid gap-4 sm:grid-cols-3">
        {examples.map((example) => (
          <li
            key={example.title}
            className="flex flex-col rounded-xl border border-border/60 bg-card p-5"
          >
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
              {example.category}
            </span>
            <h3 className="mt-2 font-semibold">{example.title}</h3>
            <p className="mt-2 text-xs font-medium text-muted">{example.tools}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {example.outcome}
            </p>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
