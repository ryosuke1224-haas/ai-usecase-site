export type FactKind =
  | "CONFIRMED"
  | "AI INTERPRETATION"
  | "RECOMMENDED ACTION"
  | "SKIPPED"
  | "REMOVED"
  | "YOU DECIDE";

const KIND_STYLES: Record<FactKind, string> = {
  CONFIRMED: "border-emerald-600/50 text-emerald-800 dark:text-emerald-300",
  "AI INTERPRETATION": "border-amber-600/50 text-amber-800 dark:text-amber-300",
  "RECOMMENDED ACTION": "border-indigo-600/50 text-indigo-800 dark:text-indigo-300",
  SKIPPED: "border-slate-500/50 text-slate-700 dark:text-slate-300",
  REMOVED: "border-slate-500/50 text-slate-700 dark:text-slate-300",
  "YOU DECIDE": "border-sky-600/50 text-sky-800 dark:text-sky-300",
};

/** The label word itself carries the meaning; color is only a secondary cue. */
export function FactLabel({ kind }: { kind: FactKind }) {
  return (
    <span
      className={`mr-1.5 inline-block rounded border px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider ${KIND_STYLES[kind]}`}
    >
      {kind}
    </span>
  );
}
