export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const PRIMARY_BUTTON = `inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

export const SECONDARY_BUTTON = `inline-flex items-center justify-center rounded-lg border border-border/60 bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS_RING}`;

export const TABLE_SCROLL = `max-w-full overflow-x-auto rounded-xl border border-border/60 bg-card ${FOCUS_RING}`;

export const PRE_BLOCK =
  "max-w-full whitespace-pre-wrap rounded-xl border border-border/60 bg-surface p-4 font-mono text-xs leading-relaxed text-foreground [overflow-wrap:anywhere]";
