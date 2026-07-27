import Link from "next/link";

const questions = [
  {
    label: "Build with Gmail + Calendar",
    href: "/?apis=gmail-api,google-calendar-api",
    hint: "Opens tool matcher with preset",
  },
  {
    label: "Explore workflows for fitness studios",
    href: "/?industry=fitness-studio",
    hint: "Shows your data and starter workflows",
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
