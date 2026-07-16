import Link from "next/link";

const questions = [
  {
    q: "I have Gmail and Google Calendar",
    href: "/?apis=gmail-api,google-calendar-api",
    hint: "Opens tool matcher with preset",
  },
  {
    q: "I run a fitness studio",
    href: "/?industry=fitness-studio",
    hint: "Shows your data and starter workflows",
  },
  {
    q: "What can I build with no-code only?",
    href: "/use-cases?difficulty=Beginner",
    hint: "Beginner difficulty filter",
  },
  {
    q: "Finance & planning workflows",
    href: "/use-cases?category=Finance%20%26%20Planning",
    hint: "Cash flow, payroll, break-even blueprints",
  },
  {
    q: "Sales & lead generation",
    href: "/use-cases?category=Sales%20%26%20Lead%20Generation",
    hint: "Prospecting, scoring, outreach, pipeline",
  },
];

export function DiscoveryPrompts() {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((item) => (
        <Link
          key={item.q}
          href={item.href}
          className="rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs hover:border-accent/40"
        >
          <span className="font-medium text-foreground">{item.q}</span>
          <span className="mt-0.5 block text-muted">{item.hint}</span>
        </Link>
      ))}
    </div>
  );
}
