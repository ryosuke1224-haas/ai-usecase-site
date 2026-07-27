import { HomeSection } from "./home-section";

const steps = [
  {
    number: 1,
    title: "Select the tools you already use",
    description:
      "Choose APIs and business tools such as Gmail, Google Calendar, or Google Ads.",
  },
  {
    number: 2,
    title: "Choose your business type",
    description:
      "See the data your business likely already collects and relevant starter workflows.",
  },
  {
    number: 3,
    title: "Review matching workflows",
    description:
      "Compare what you can build now, what additional tools or data you need, and how difficult each workflow is to implement.",
  },
];

export function HowItWorks() {
  return (
    <HomeSection title="How to use AI Use Case Atlas">
      <ol className="grid gap-6 sm:grid-cols-3 sm:gap-0">
        {steps.map((step, index) => (
          <li
            key={step.number}
            className={`relative sm:px-6 ${index === 0 ? "sm:pl-0" : ""} ${
              index === steps.length - 1 ? "sm:pr-0" : ""
            }`}
          >
            {index < steps.length - 1 && (
              <span
                className="pointer-events-none absolute top-4 right-0 hidden h-px w-full bg-border sm:block"
                aria-hidden="true"
              />
            )}
            <div className="relative flex items-start gap-3 sm:flex-col sm:gap-3">
              <span
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-sm font-bold text-foreground"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
