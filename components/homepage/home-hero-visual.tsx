/**
 * Decorative product-style workflow map for the homepage hero.
 * Intentionally non-interactive — no links or hover affordances.
 */
export function HomeHeroVisual() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-surface/70 p-4 sm:p-5"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
          How it works
        </p>
        <span className="rounded-md border border-border/60 bg-card px-2 py-0.5 text-[10px] text-muted">
          Preview
        </span>
      </div>

      <div className="space-y-3">
        <FlowPanel
          step="1"
          title="Your business"
          chips={["Fitness Studio", "Restaurant", "Home Services"]}
        />

        <FlowConnector />

        <FlowPanel
          step="2"
          title="Tools and data you already have"
          chips={["Gmail", "Google Ads", "Square", "Customer Reviews"]}
        />

        <FlowConnector />

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-accent-foreground">
              3
            </span>
            <p className="text-xs font-semibold">AI Use Case Atlas</p>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {["Match", "Assess", "Recommend build path"].map((label) => (
              <div
                key={label}
                className="rounded-md border border-border/60 bg-card px-2 py-1.5 text-center text-[10px] font-medium leading-tight text-foreground"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <FlowConnector />

        <FlowPanel
          step="4"
          title="Recommended workflows"
          chips={[
            "Google Ads Performance Coach",
            "Customer Review Intelligence",
            "Booking Optimization",
          ]}
        />

        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm shadow-black/5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                Example match
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">
                Google Ads Performance Coach
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
              Intermediate
            </span>
          </div>
          <dl className="mt-3 space-y-1.5 text-[11px]">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted">Uses</dt>
              <dd>Google Ads + GA4</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted">Already available</dt>
              <dd className="text-emerald-700 dark:text-emerald-400">
                Google Ads
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted">Still needed</dt>
              <dd className="text-amber-700 dark:text-amber-400">
                Conversion events
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function FlowPanel({
  step,
  title,
  chips,
}: {
  step: string;
  title: string;
  chips: string[];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-border bg-surface text-[10px] font-bold text-muted">
          {step}
        </span>
        <p className="text-xs font-semibold">{title}</p>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-md border border-border/60 bg-surface px-2 py-1 text-[10px] font-medium text-foreground"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <span className="block h-2 w-px bg-border" />
      <span className="block h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-border" />
    </div>
  );
}
