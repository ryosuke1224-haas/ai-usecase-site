"use client";

import { useMemo, useState } from "react";
import type { UseCaseExperience } from "@/src/types";
import { ExperienceSection } from "./experience-sections";

type GuidedDemos = NonNullable<UseCaseExperience["guidedDemos"]>;
type ToolKey = GuidedDemos["tools"][number]["key"];

/**
 * Choose-your-AI walkthrough. Only the selected Supademo iframe is mounted so
 * the page never loads three heavy embeds at once. Embed URLs come from the
 * use-case content, not from this component.
 */
export function GuidedAiDemos({ guidedDemos }: { guidedDemos: GuidedDemos }) {
  const [selected, setSelected] = useState<ToolKey>(guidedDemos.defaultTool);

  const activeTool = useMemo(
    () =>
      guidedDemos.tools.find((tool) => tool.key === selected) ??
      guidedDemos.tools[0],
    [guidedDemos.tools, selected],
  );

  return (
    <ExperienceSection id="guided-demos" heading={guidedDemos.heading}>
      <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
        {guidedDemos.supporting}
      </p>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Choose your AI
        </p>
        <div
          role="tablist"
          aria-label="Choose your AI tool"
          className="mt-2 flex flex-wrap gap-2"
        >
          {guidedDemos.tools.map((tool) => {
            const isActive = tool.key === activeTool.key;
            return (
              <button
                key={tool.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`guided-demo-panel-${tool.key}`}
                id={`guided-demo-tab-${tool.key}`}
                onClick={() => setSelected(tool.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "border border-border/60 bg-surface text-foreground hover:border-accent/40 hover:bg-card"
                }`}
              >
                {tool.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {activeTool.availabilityNote}
        </p>
      </div>

      <div
        role="tabpanel"
        id={`guided-demo-panel-${activeTool.key}`}
        aria-labelledby={`guided-demo-tab-${activeTool.key}`}
        className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-card"
      >
        <div className="relative aspect-video w-full bg-surface">
          <iframe
            key={activeTool.key}
            src={activeTool.embedUrl}
            title={`${activeTool.label} guided walkthrough for AI Daily Inbox Briefing`}
            loading="lazy"
            allow="clipboard-write; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {guidedDemos.learning.heading}
        </h3>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {guidedDemos.learning.items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-foreground"
            >
              <span aria-hidden="true" className="mt-0.5 text-accent">
                &#10003;
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </ExperienceSection>
  );
}
