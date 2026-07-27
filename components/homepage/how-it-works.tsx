import { HomeSection } from "./home-section";

const steps = [
  {
    number: 1,
    title: "Tell us what you have",
    description:
      "Select your industry, business goal, existing tools, or available data.",
  },
  {
    number: 2,
    title: "Explore matching blueprints",
    description:
      "See relevant use cases, required APIs, data sources, implementation difficulty, and build options.",
  },
  {
    number: 3,
    title: "Test or build the workflow",
    description:
      "Start with a manual prompt, build a local app, or automate the workflow using APIs.",
  },
];

export function HowItWorks() {
  return (
    <HomeSection title="How to use AI Use Case Atlas">
      <ol className="grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.number}
            className="rounded-xl border border-border/60 bg-card p-5"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground"
              aria-hidden="true"
            >
              {step.number}
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
