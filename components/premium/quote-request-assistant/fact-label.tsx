export type FactKind =
  | "CONFIRMED"
  | "AI INTERPRETATION"
  | "RECOMMENDED ACTION"
  | "SKIPPED"
  | "YOU DECIDE"
  | "NEEDS YOUR CHECK";

const KIND_STYLES: Record<FactKind, string> = {
  CONFIRMED: "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  "AI INTERPRETATION": "border-amber-600/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  "RECOMMENDED ACTION": "border-indigo-600/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
  SKIPPED: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  "YOU DECIDE": "border-sky-600/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  "NEEDS YOUR CHECK": "border-orange-600/40 bg-orange-500/10 text-orange-800 dark:text-orange-300",
};

/**
 * The label word itself carries the meaning; color is only a secondary cue.
 * `label` overrides the visible word for another locale. English callers omit it
 * and keep the canonical kind text.
 */
export function FactLabel({ kind, label }: { kind: FactKind; label?: string }) {
  return (
    <span
      className={`mr-1.5 inline-block rounded-md border px-1.5 py-0.5 align-middle font-bold ${
        label ? "text-xs" : "text-[10px] tracking-wider"
      } ${KIND_STYLES[kind]}`}
    >
      {label ?? kind}
    </span>
  );
}
