import Link from "next/link";

const questions = [
  {
    label: "Find ways to get more leads",
    href: "/find-workflows?problem=get-more-leads",
    hint: "Starts in business-problem mode",
  },
  {
    label: "Improve scheduling for a fitness studio",
    href: "/find-workflows?problem=improve-scheduling-and-operations&industry=fitness-studio",
    hint: "Business problem + business type",
  },
  {
    label: "Build with Gmail + Calendar",
    href: "/find-workflows?mode=tools&apis=gmail-api,google-calendar-api",
    hint: "Opens the tools-based matcher",
  },
  {
    label: "Find no-code AI workflows",
    href: "/use-cases?difficulty=Beginner",
    hint: "Beginner difficulty filter",
  },
  {
    label: "Explore finance automation",
    href: "/use-cases?category=Finance%20%26%20Planning",
    hint: "Cash flow, payroll, break-even blueprints",
  },
  {
    label: "Explore sales and lead workflows",
    href: "/use-cases?category=Sales%20%26%20Lead%20Generation",
    hint: "Prospecting, scoring, outreach, pipeline",
  },
];

export function DiscoveryPrompts() {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className="font-medium text-foreground">{item.label}</span>
          <span className="mt-0.5 block text-muted">{item.hint}</span>
        </Link>
      ))}
    </div>
  );
}
