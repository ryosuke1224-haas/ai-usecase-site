"use client";

type HydrationStatusProps = {
  hydrated: boolean;
  className?: string;
};

/** Visible cue while interactive controls stay disabled before hydration. */
export function HydrationStatus({ hydrated, className = "" }: HydrationStatusProps) {
  if (hydrated) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-xs leading-relaxed text-muted ${className}`.trim()}
    >
      Initializing controls…
    </p>
  );
}
