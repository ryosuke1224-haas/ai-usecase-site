import type { UseCaseExperience } from "@/src/types";
import { getSampleBriefingUrl } from "@/src/lib/offers";
import { ExperienceSection } from "./experience-sections";

type SampleBriefingContent = UseCaseExperience["sampleBriefing"];

/**
 * Each evidence row is labelled in text as well as styled, so the distinction
 * between a stated fact, a model inference, and a recommendation never depends
 * on colour alone.
 */
const evidenceRows = [
  { key: "fact", label: "Confirmed fact" },
  { key: "interpretation", label: "AI interpretation" },
  { key: "action", label: "Suggested action" },
] as const;

export function SampleBriefing({
  sampleBriefing,
}: {
  sampleBriefing: SampleBriefingContent;
}) {
  const fullBriefingUrl = getSampleBriefingUrl();

  return (
    <ExperienceSection id="example-briefing" heading={sampleBriefing.heading}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 bg-surface px-5 py-4 sm:px-7">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            {sampleBriefing.title}
          </p>
          <p className="mt-0.5 text-sm text-muted">{sampleBriefing.date}</p>
        </div>

        <div className="divide-y divide-border/60">
          {sampleBriefing.groups.map((group) => (
            <div key={group.label} className="px-5 py-5 sm:px-7">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </h3>

              {group.items.map((item) => (
                <div key={item.title} className="mt-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </p>
                    {item.meta && (
                      <p className="font-mono text-xs font-medium text-muted">
                        {item.meta}
                      </p>
                    )}
                  </div>

                  <dl className="mt-3 space-y-2 border-l-2 border-border/60 pl-4">
                    {evidenceRows.map((row) => {
                      const value = item[row.key];
                      if (!value) return null;

                      return (
                        <div key={row.key} className="sm:flex sm:gap-3">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-muted sm:w-40 sm:shrink-0">
                            {row.label}
                          </dt>
                          <dd className="text-sm leading-relaxed text-foreground">
                            {value}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {fullBriefingUrl ? (
          <a
            href={fullBriefingUrl}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {sampleBriefing.secondaryActionLabel}
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-lg border border-border/60 bg-surface px-4 py-2 text-sm font-semibold text-muted opacity-70"
            >
              {sampleBriefing.secondaryActionLabel}
            </button>
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Coming soon
            </span>
          </>
        )}
      </div>
    </ExperienceSection>
  );
}
