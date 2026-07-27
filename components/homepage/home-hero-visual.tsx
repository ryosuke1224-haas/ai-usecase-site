/**
 * Decorative conceptual diagram for the homepage hero.
 * Intentionally non-interactive — explanatory only.
 */
import { Fragment, type ComponentType } from "react";

export function HomeHeroVisual() {
  const stages = [
    {
      title: "What you have",
      items: [
        { label: "Your business", icon: BusinessIcon },
        { label: "Your tools", icon: ToolsIcon },
        { label: "Your data", icon: DataIcon },
      ],
      highlight: false,
    },
    {
      title: "AI Use Case Atlas",
      items: [
        { label: "Match", icon: MatchIcon },
        { label: "Assess", icon: AssessIcon },
        { label: "Map requirements", icon: MapIcon },
      ],
      highlight: true,
    },
    {
      title: "What you get",
      items: [
        { label: "Relevant AI workflows", icon: WorkflowIcon },
        { label: "Required APIs and data", icon: RequirementsIcon },
        { label: "Simplest build path", icon: PathIcon },
      ],
      highlight: false,
    },
  ];

  return (
    <div
      className="rounded-2xl border border-border/60 bg-surface/50 p-4 sm:p-5"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {stages.map((stage, index) => (
          <Fragment key={stage.title}>
            <StageCard stage={stage} />
            {index < stages.length - 1 && <StageArrow />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function StageCard({
  stage,
}: {
  stage: {
    title: string;
    items: { label: string; icon: ComponentType }[];
    highlight: boolean;
  };
}) {
  return (
    <div
      className={`w-full rounded-xl border p-3.5 sm:flex-1 sm:min-w-0 ${
        stage.highlight
          ? "border-accent/35 bg-accent/5"
          : "border-border/60 bg-card"
      }`}
    >
      <p className="text-xs font-semibold text-foreground">{stage.title}</p>
      <ul className="mt-2.5 space-y-2">
        {stage.items.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                stage.highlight
                  ? "bg-accent/15 text-accent"
                  : "bg-surface text-muted"
              }`}
            >
              <item.icon />
            </span>
            <span className="text-[11px] leading-snug text-muted sm:text-xs">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StageArrow() {
  return (
  <>
      <div className="flex flex-col items-center sm:hidden" aria-hidden="true">
        <span className="block h-3 w-px bg-border" />
        <span className="block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-border" />
      </div>
      <div
        className="hidden shrink-0 items-center justify-center px-2 sm:flex"
        aria-hidden="true"
      >
        <svg
          width="20"
          height="12"
          viewBox="0 0 20 12"
          fill="none"
          className="text-border"
        >
          <path
            d="M0 6h14M14 6l-4-4M14 6l-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </>
  );
}

function BusinessIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 12V4.5L7 2l5 2.5V12M5 12V8h4v4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M8.5 2.5a2.5 2.5 0 0 1 3.2 3.2L6 11l-3 1 1-3 5.7-5.7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M2.5 3.5v3c0 .83 2.01 1.5 4.5 1.5s4.5-.67 4.5-1.5v-3M2.5 6.5v3c0 .83 2.01 1.5 4.5 1.5s4.5-.67 4.5-1.5v-3"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 8l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AssessIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 11V3M5 11V7M8 11V5M11 11V2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 3.5 5 2l4 1.5 3-1v8.5l-3 1-4-1.5-3 1.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M5 2v8.5M9 3.5v8.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="5" y="8" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 6v1.5M10 6v1.5M7 6.5v1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function RequirementsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 4h8M3 7h8M3 10h5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="3" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4.2 9.8 7 7l2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
